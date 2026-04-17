import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { nanoid } from "nanoid";
import { slugify } from "@/lib/utils";
import { seedClinicianKits, getDefaultCategories } from "@/lib/setup-new-clinician";
import { enqueueRecommendation, enqueueReminderIn } from "@/lib/queue";
import { getShareUrl } from "@/lib/utils";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/utils";
import type { KitWithItems } from "@/lib/types/kit";

const GuestSignupSchema = z.object({
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  specialty: z.string().min(1).max(100).trim(),
  patientIdentifier: z.string().min(1).max(320),
  productIds: z.array(z.string().cuid()).min(1).max(50),
  quantities: z.record(z.string(), z.number().int().positive().max(99)).optional(),
  note: z.string().max(1000).optional(),
});

const RATE_LIMIT = { limit: 10, windowSeconds: 3600 };

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { allowed, resetIn } = await checkRateLimit(`guest-signup:${ip}`, RATE_LIMIT);
    if (!allowed) return rateLimitResponse(resetIn);

    const body = await req.json();
    const parsed = GuestSignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { firstName, lastName, specialty, productIds, quantities = {}, note } = parsed.data;
    const isEmailIdentifier = parsed.data.patientIdentifier.includes("@");
    let patientIdentifier = parsed.data.patientIdentifier;
    if (!isEmailIdentifier) {
      const normalized = normalizePhone(patientIdentifier);
      if (!normalized) {
        return NextResponse.json(
          { error: "Please enter a valid US phone number" },
          { status: 400 }
        );
      }
      patientIdentifier = normalized;
    }
    const displayName = `${firstName} ${lastName}`;

    // Validate products
    const products = await db.product.findMany({ where: { id: { in: productIds } } });
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
    }

    // Atomic: create account + DoctorProfile + seed kits + create recommendation + auto-login token
    const { userId, autoLoginToken, recommendationToken, recommendationId, profileId } = await db.$transaction(async (tx) => {
      // 1. Create user (no email/phone — guest account)
      const user = await tx.user.create({
        data: { role: "CLINICIAN", onboarded: true },
      });

      // 2. Create DoctorProfile with unique slug
      const baseSlug = slugify(displayName);
      let profileSlug = baseSlug;
      let suffix = 1;
      // eslint-disable-next-line no-await-in-loop
      while (await tx.doctorProfile.findUnique({ where: { slug: profileSlug } })) {
        profileSlug = `${baseSlug}-${suffix++}`;
      }
      const defaultCategories = getDefaultCategories(specialty) ?? [];
      const profile = await tx.doctorProfile.create({
        data: {
          userId: user.id,
          displayName,
          specialty,
          slug: profileSlug,
          customCategories: defaultCategories,
        },
      });

      // 3. Seed specialty kits
      await seedClinicianKits(tx, profile.id, specialty);

      // 4. Find patient if they already have an account
      let patientId: string | null = null;
      if (isEmailIdentifier) {
        const patient = await tx.user.findUnique({ where: { email: patientIdentifier } });
        if (patient) patientId = patient.id;
      } else {
        const patient = await tx.user.findUnique({ where: { phone: patientIdentifier } });
        if (patient) patientId = patient.id;
      }

      // 5. Create recommendation with doctorProfileId attached
      const recToken = nanoid(12);
      const recommendation = await tx.recommendation.create({
        data: {
          token: recToken,
          doctorId: user.id,
          doctorProfileId: profile.id,
          patientId,
          patientIdentifier,
          note: note ?? null,
          items: {
            create: productIds.map((productId) => ({
              productId,
              quantity: quantities[productId] ?? 1,
            })),
          },
        },
      });

      // 6. Create one-time auto-login token (5 min TTL)
      const loginToken = nanoid(32);
      await tx.verificationToken.create({
        data: {
          identifier: user.id,
          token: loginToken,
          expires: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      return {
        userId: user.id,
        autoLoginToken: loginToken,
        recommendationToken: recToken,
        recommendationId: recommendation.id,
        profileId: profile.id,
      };
    });

    // Enqueue send job (non-critical — recommendation is already created)
    try {
      await enqueueRecommendation({
        recommendationId,
        patientIdentifier,
        shareToken: recommendationToken,
        doctorName: displayName,
      });
      await enqueueReminderIn({ recommendationId }, 48 * 60 * 60 * 1000);
    } catch (queueError) {
      console.error("[guest-signup] Failed to enqueue job:", queueError);
    }

    // Fetch seeded kits + picks to return to builder so it can update state immediately
    const kitFavorites = await db.kitFavorite.findMany({
      where: { doctorProfileId: profileId },
      include: {
        kit: {
          include: {
            items: {
              orderBy: { order: "asc" },
              include: { product: { select: { id: true, name: true, brand: true, imageUrl: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    const kits: KitWithItems[] = kitFavorites.map((fav) => ({
      id: fav.kit.id,
      name: fav.kit.name,
      specialty: fav.kit.specialty,
      isSystem: fav.kit.doctorProfileId === null,
      favoriteId: fav.id,
      items: fav.kit.items.map((item) => ({ id: item.id, order: item.order, product: item.product })),
    }));

    const picks = await db.clinicianPickedProduct.findMany({
      where: { clinicianId: profileId },
      select: { productId: true },
    });

    return NextResponse.json({
      token: recommendationToken,
      shareUrl: getShareUrl(recommendationToken),
      userId,
      autoLoginToken,
      kits,
      picks: picks.map((p) => p.productId),
    });
  } catch (error) {
    console.error("[api/guest-signup POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
