import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { nanoid } from "nanoid";
import { enqueueRecommendation, enqueueReminderIn } from "@/lib/queue";
import { getShareUrl } from "@/lib/utils";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/utils";

const CreateRecommendationSchema = z.object({
  patientIdentifier: z.string().min(1, "Patient phone or email is required").max(320),
  productIds: z.array(z.string().cuid()).min(1, "At least one product is required").max(50),
  quantities: z.record(z.string(), z.number().int().positive().max(99)).optional(),
  note: z.string().max(1000).optional(),
});

// 60 recommendations per hour per clinician — more than enough for any practice
const POST_RATE_LIMIT = { limit: 60, windowSeconds: 3600 };

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowed, resetIn } = await checkRateLimit(
      `rec:post:${session.user.id}`,
      POST_RATE_LIMIT
    );
    if (!allowed) return rateLimitResponse(resetIn);

    const body = await req.json();
    const parsed = CreateRecommendationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

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
    const { productIds, quantities = {}, note } = parsed.data;

    // Find doctor profile — this is the authoritative clinician check (avoids stale JWT role)
    const doctorProfile = await db.doctorProfile.findUnique({
      where: { userId: session.user.id },
      include: { practice: true },
    });

    if (!doctorProfile) {
      return NextResponse.json(
        { error: "Only doctors can create recommendations" },
        { status: 403 }
      );
    }

    // Validate all products exist
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products not found" },
        { status: 400 }
      );
    }

    // Find or create patient
    let patientId: string | null = null;
    const isEmail = isEmailIdentifier;

    if (isEmail) {
      const patient = await db.user.findUnique({ where: { email: patientIdentifier } });
      if (patient) patientId = patient.id;
    } else {
      const patient = await db.user.findUnique({ where: { phone: patientIdentifier } });
      if (patient) patientId = patient.id;
    }

    // Generate token
    const token = nanoid(12);
    const shareUrl = getShareUrl(token);

    // Create recommendation
    const recommendation = await db.recommendation.create({
      data: {
        token,
        doctorId: session.user.id,
        doctorProfileId: doctorProfile.id,
        patientId: patientId,
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

    // Enqueue delivery job
    try {
      await enqueueRecommendation({
        recommendationId: recommendation.id,
        patientIdentifier,
        shareToken: token,
        doctorName: doctorProfile.displayName,
      });

      // Schedule a reminder in 48 hours
      await enqueueReminderIn(
        { recommendationId: recommendation.id },
        48 * 60 * 60 * 1000
      );
    } catch (queueError) {
      console.error("Failed to enqueue recommendation job:", queueError);
      // Don't fail the request — recommendation was created
    }

    return NextResponse.json({
      token,
      shareUrl,
      recommendationId: recommendation.id,
    });
  } catch (error) {
    console.error("Error creating recommendation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
    const skip = (page - 1) * limit;

    let whereClause = {};

    if (session.user.role === "CLINICIAN") {
      whereClause = { doctorId: session.user.id };
    } else {
      whereClause = { patientId: session.user.id };
    }

    const [recommendations, total] = await Promise.all([
      db.recommendation.findMany({
        where: whereClause,
        include: {
          items: { include: { product: true } },
          doctorProfile: { include: { practice: true } },
          patient: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.recommendation.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      recommendations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
