import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/twilio";
import { db } from "@/lib/db";
import { z } from "zod";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";

const VerifyOTPSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, "Invalid phone number format"),
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Code must be numeric"),
});

// OWASP: Brute-force protection. A 6-digit code has 1,000,000 combinations;
// 10 attempts per hour per IP makes brute-force computationally infeasible.
const RATE_LIMIT = { limit: 10, windowSeconds: 3600 };

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = getClientIp(req);
  const { allowed, resetIn } = await checkRateLimit(`otp:verify:${ip}`, RATE_LIMIT);
  if (!allowed) return rateLimitResponse(resetIn);

  try {
    const body = await req.json();
    const parsed = VerifyOTPSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { phone, code } = parsed.data;

    const result = await verifyOTP(phone, code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Verification failed" },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await db.user.findUnique({ where: { phone } });

    if (!user) {
      user = await db.user.create({
        data: { phone, role: "PATIENT" },
      });
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      isNewUser: !user.name,
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
