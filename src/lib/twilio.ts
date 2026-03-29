import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken) {
  console.warn("Twilio credentials not configured");
}

export const twilioClient =
  accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  if (!twilioClient || !verifySid) {
    return { success: false, error: "Twilio not configured" };
  }

  try {
    await twilioClient.verify.v2
      .services(verifySid)
      .verifications.create({ to: phone, channel: "sms" });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send OTP";
    return { success: false, error: message };
  }
}

export async function verifyOTP(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (!twilioClient || !verifySid) {
    return { success: false, error: "Twilio not configured" };
  }

  try {
    const result = await twilioClient.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: phone, code });

    if (result.status === "approved") {
      return { success: true };
    }
    return { success: false, error: "Invalid or expired code" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify OTP";
    return { success: false, error: message };
  }
}

export async function sendSMS(
  to: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  if (!twilioClient || !fromPhone) {
    return { success: false, error: "Twilio not configured" };
  }

  try {
    await twilioClient.messages.create({ body, from: fromPhone, to });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send SMS";
    return { success: false, error: message };
  }
}
