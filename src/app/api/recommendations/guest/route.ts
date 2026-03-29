import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { nanoid } from "nanoid";
import { enqueueRecommendation, enqueueReminderIn } from "@/lib/queue";
import { getShareUrl } from "@/lib/utils";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const GuestRecommendationSchema = z.object({
  patientIdentifier: z.string().min(1).max(320),
  productIds: z.array(z.string().cuid()).min(1).max(50),
  quantities: z.record(z.string(), z.number().int().positive().max(99)).optional(),
  note: z.string().max(1000).optional(),
});

// 20 anonymous sends per hour per IP — lower limit than authenticated
const RATE_LIMIT = { limit: 20, windowSeconds: 3600 };

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { allowed, resetIn } = await checkRateLimit(`rec:guest:${ip}`, RATE_LIMIT);
    if (!allowed) return rateLimitResponse(resetIn);

    const body = await req.json();
    const parsed = GuestRecommendationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { patientIdentifier, productIds, quantities = {}, note } = parsed.data;

    // Validate all products exist
    const products = await db.product.findMany({ where: { id: { in: productIds } } });
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
    }

    // Find patient if they have an account
    let patientId: string | null = null;
    const isEmail = patientIdentifier.includes("@");
    if (isEmail) {
      const patient = await db.user.findUnique({ where: { email: patientIdentifier } });
      if (patient) patientId = patient.id;
    } else {
      const patient = await db.user.findUnique({ where: { phone: patientIdentifier } });
      if (patient) patientId = patient.id;
    }

    const token = nanoid(12);

    const recommendation = await db.recommendation.create({
      data: {
        token,
        doctorId: null,
        doctorProfileId: null,
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

    try {
      await enqueueRecommendation({
        recommendationId: recommendation.id,
        patientIdentifier,
        shareToken: token,
        doctorName: null,
      });
      await enqueueReminderIn({ recommendationId: recommendation.id }, 48 * 60 * 60 * 1000);
    } catch (queueError) {
      console.error("[guest rec] Failed to enqueue job:", queueError);
    }

    return NextResponse.json({ token, shareUrl: getShareUrl(token), recommendationId: recommendation.id });
  } catch (error) {
    console.error("[api/recommendations/guest POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
