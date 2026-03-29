import type { Job } from "bullmq";
import type { SendRecommendationPayload } from "../../src/lib/queue";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function handleSendRecommendation(
  job: Job<SendRecommendationPayload>
): Promise<void> {
  const { recommendationId, patientIdentifier, shareToken, doctorName } = job.data;

  console.log(`[send-recommendation] Processing job ${job.id} for rec ${recommendationId}`);

  const shareUrl = `${APP_URL}/r/${shareToken}`;
  const isPhone = !patientIdentifier.includes("@");

  const senderName = doctorName ?? "Your provider";
  if (isPhone) {
    await sendViaSMS(patientIdentifier, senderName, shareUrl);
  } else {
    await sendViaEmail(patientIdentifier, senderName, shareUrl);
  }

  console.log(`[send-recommendation] Delivered to ${patientIdentifier}`);
}

async function sendViaSMS(phone: string, doctorName: string, shareUrl: string): Promise<void> {
  const twilio = await import("twilio");
  const client = twilio.default(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const body =
    `${doctorName} just sent you a personalized product recommendation. ` +
    `View it here: ${shareUrl}`;

  await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phone,
  });
}

async function sendViaEmail(
  email: string,
  doctorName: string,
  shareUrl: string
): Promise<void> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "BetterList <noreply@docpick.com>",
    to: email,
    subject: `${doctorName} sent you a recommendation`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FAF9F7; padding: 40px 20px; margin: 0;">
          <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <div style="width: 48px; height: 48px; background: #1a1a1a; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
              <span style="color: white; font-weight: 700; font-size: 20px;">💊</span>
            </div>

            <h1 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px;">
              You have a new recommendation
            </h1>
            <p style="color: #6b7280; margin: 0 0 28px; font-size: 15px; line-height: 1.5;">
              <strong style="color: #1a1a1a;">${doctorName}</strong> has curated a personalized product recommendation for you.
            </p>

            <a href="${shareUrl}" style="display: inline-block; background: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 15px; margin-bottom: 28px;">
              View my recommendation →
            </a>

            <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
              Or copy this link: <a href="${shareUrl}" style="color: #6b7280;">${shareUrl}</a>
            </p>

            <hr style="border: none; border-top: 1px solid rgba(0,0,0,0.06); margin: 28px 0;" />

            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Sent via BetterList — the secure platform for provider recommendations.
              If you weren't expecting this, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
  });
}
