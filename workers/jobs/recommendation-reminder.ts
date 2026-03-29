import type { Job } from "bullmq";
import type { RecommendationReminderPayload } from "../../src/lib/queue";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function handleRecommendationReminder(
  job: Job<RecommendationReminderPayload>
): Promise<void> {
  const { recommendationId } = job.data;

  console.log(`[recommendation-reminder] Processing job ${job.id} for rec ${recommendationId}`);

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
      include: {
        doctorProfile: true,
        patient: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!recommendation) {
      console.log(`[recommendation-reminder] Recommendation not found: ${recommendationId}`);
      return;
    }

    // Only send reminder if still in SENT status (not viewed or purchased)
    if (recommendation.status !== "SENT") {
      console.log(
        `[recommendation-reminder] Skipping — status is ${recommendation.status} for rec ${recommendationId}`
      );
      return;
    }

    const shareUrl = `${APP_URL}/r/${recommendation.token}`;
    const doctorName = recommendation.doctorProfile?.displayName ?? "Your provider";
    const patientIdentifier = recommendation.patientIdentifier;

    if (!patientIdentifier) {
      console.log(`[recommendation-reminder] No patient identifier for rec ${recommendationId}`);
      return;
    }

    const isPhone = !patientIdentifier.includes("@");

    if (isPhone) {
      await sendSMSReminder(patientIdentifier, doctorName, shareUrl);
    } else {
      await sendEmailReminder(
        patientIdentifier,
        recommendation.patient?.name ?? null,
        doctorName,
        shareUrl
      );
    }

    console.log(`[recommendation-reminder] Reminder sent to ${patientIdentifier}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function sendSMSReminder(
  phone: string,
  doctorName: string,
  shareUrl: string
): Promise<void> {
  const twilio = await import("twilio");
  const client = twilio.default(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const body =
    `Reminder: ${doctorName} sent you a product recommendation that you haven't viewed yet. ` +
    `Check it out: ${shareUrl}`;

  await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phone,
  });
}

async function sendEmailReminder(
  email: string,
  patientName: string | null,
  doctorName: string,
  shareUrl: string
): Promise<void> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const greeting = patientName ? `Hi ${patientName.split(" ")[0]},` : "Hi there,";

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "BetterList <noreply@docpick.com>",
    to: email,
    subject: `Reminder: ${doctorName} sent you a recommendation`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FAF9F7; padding: 40px 20px; margin: 0;">
          <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <h1 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px;">
              Don't forget your recommendation
            </h1>
            <p style="color: #6b7280; margin: 0 0 20px; font-size: 15px; line-height: 1.5;">
              ${greeting} <strong style="color: #1a1a1a;">${doctorName}</strong> sent you a personalized product recommendation a couple days ago — you haven't viewed it yet.
            </p>

            <a href="${shareUrl}" style="display: inline-block; background: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 15px; margin-bottom: 24px;">
              View recommendation →
            </a>

            <hr style="border: none; border-top: 1px solid rgba(0,0,0,0.06); margin: 24px 0;" />

            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is a one-time reminder from BetterList. If you don't want these reminders, you can ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
  });
}
