import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { seedClinicianKits, getDefaultCategories } from "@/lib/setup-new-clinician";

const PatientSchema = z.object({
  action: z.literal("patient"),
});

const ProviderSchema = z.object({
  action: z.literal("provider"),
  firstName: z.string().min(1, "First name is required").max(50).trim(),
  lastName: z.string().min(1, "Last name is required").max(50).trim(),
  specialty: z.string().min(1, "Specialty is required").max(100).trim(),
});

const OnboardingSchema = z.discriminatedUnion("action", [PatientSchema, ProviderSchema]);

// 10 attempts per hour
const RATE_LIMIT = { limit: 10, windowSeconds: 3600 };

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowed, resetIn } = await checkRateLimit(
      `onboarding:${session.user.id}`,
      RATE_LIMIT
    );
    if (!allowed) return rateLimitResponse(resetIn);

    const body = await req.json();
    const parsed = OnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    if (parsed.data.action === "patient") {
      await db.user.update({
        where: { id: session.user.id },
        data: { role: "PATIENT", onboarded: true },
      });
      return NextResponse.json({ success: true });
    }

    // Provider
    const { firstName, lastName, specialty } = parsed.data;
    const displayName = `${firstName} ${lastName}`;

    const baseSlug = slugify(displayName);
    let profileSlug = baseSlug;
    let suffix = 1;
    while (await db.doctorProfile.findUnique({ where: { slug: profileSlug } })) {
      profileSlug = `${baseSlug}-${suffix++}`;
    }

    const defaultCategories = getDefaultCategories(specialty) ?? [];

    const { doctorProfile } = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: displayName,
        role: "CLINICIAN",
        onboarded: true,
        doctorProfile: {
          create: {
            displayName,
            specialty,
            slug: profileSlug,
            customCategories: defaultCategories,
          },
        },
      },
      select: { doctorProfile: { select: { id: true } } },
    });

    if (doctorProfile) {
      await seedClinicianKits(db, doctorProfile.id, specialty);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
