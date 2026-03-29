import { NextRequest, NextResponse } from "next/server";
import { sendOTP } from "@/lib/twilio";
import { z } from "zod";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";

const SendOTPSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, "Invalid phone number format"),
});

// OWASP: Limit OTP sends aggressively — each send costs money and can be used
// to harass users. 5 per IP per hour is generous for legitimate use.
const RATE_LIMIT = { limit: 5, windowSeconds: 3600 };

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = getClientIp(req);
  const { allowed, resetIn } = await checkRateLimit(`otp:send:${ip}`, RATE_LIMIT);
  if (!allowed) return rateLimitResponse(resetIn);

  try {
    const body = await req.json();
    const parsed = SendOTPSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid phone number" },
        { status: 400 }
      );
    }

    const { phone } = parsed.data;
    const result = await sendOTP(phone);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Failed to send verification code" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Verification code sent" });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
