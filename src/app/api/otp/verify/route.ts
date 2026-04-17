import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/twilio";
import { db } from "@/lib/db";
import { z } from "zod";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/utils";

const VerifyOTPSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, "Invalid phone number format"),
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Code must be numeric"),
});

// Per-IP: 10 attempts/hour stops distributed scanning
const IP_RATE_LIMIT = { limit: 10, windowSeconds: 3600 };
// Per-phone: 5 attempts/hour stops targeted brute-force on a specific number
const PHONE_RATE_LIMIT = { limit: 5, windowSeconds: 3600 };

export async function POST(req: NextRequest) {
  // IP check first (no body parse needed)
  const ip = getClientIp(req);
  const ipCheck = await checkRateLimit(`otp:verify:ip:${ip}`, IP_RATE_LIMIT);
  if (!ipCheck.allowed) return rateLimitResponse(ipCheck.resetIn);

  try {
    const body = await req.json();
    const normalized = normalizePhone(body?.phone ?? "");
    if (!normalized) {
      return NextResponse.json(
        { error: "Please enter a valid US phone number" },
        { status: 400 }
      );
    }

    const parsed = VerifyOTPSchema.safeParse({ phone: normalized, code: body?.code });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a valid US phone number" },
        { status: 400 }
      );
    }

    const { phone, code } = parsed.data;

    // Per-phone check after parsing — prevents targeted brute-force regardless of IP
    const phoneCheck = await checkRateLimit(`otp:verify:phone:${phone}`, PHONE_RATE_LIMIT);
    if (!phoneCheck.allowed) return rateLimitResponse(phoneCheck.resetIn);

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
