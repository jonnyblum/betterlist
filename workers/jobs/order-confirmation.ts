import type { Job } from "bullmq";
import type { OrderConfirmationPayload } from "../../src/lib/queue";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function handleOrderConfirmation(
  job: Job<OrderConfirmationPayload>
): Promise<void> {
  const { orderId } = job.data;

  console.log(`[order-confirmation] Processing job ${job.id} for order ${orderId}`);

  // Import db dynamically to avoid Next.js module issues in workers
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        patient: true,
        recommendation: {
          include: {
            doctorProfile: { include: { practice: true } },
          },
        },
      },
    });

    if (!order) {
      console.error(`[order-confirmation] Order not found: ${orderId}`);
      return;
    }

    // Update order status to ensure it's PAID
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID" },
    });

    const patient = order.patient;
    const doctor = order.recommendation.doctorProfile ?? { displayName: "Your provider" };
    const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemLines = order.items
      .map((item) => `• ${item.product.name} (×${item.quantity}) — $${(item.price * item.quantity).toFixed(2)}`)
      .join("\n");

    if (patient.phone) {
      await sendSMSConfirmation(patient.phone, doctor.displayName, total, order.id);
    } else if (patient.email) {
      await sendEmailConfirmation(patient.email, patient.name, doctor.displayName, total, itemLines, orderId);
    }

    console.log(`[order-confirmation] Confirmation sent for order ${orderId}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function sendSMSConfirmation(
  phone: string,
  doctorName: string,
  total: number,
  orderId: string
): Promise<void> {
  const twilio = await import("twilio");
  const client = twilio.default(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const body =
    `Your order from ${doctorName}'s recommendations is confirmed! ` +
    `Total: $${total.toFixed(2)}. Track it at ${APP_URL}/dashboard`;

  await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phone,
  });
}

async function sendEmailConfirmation(
  email: string,
  patientName: string | null,
  doctorName: string,
  total: number,
  itemLines: string,
  orderId: string
): Promise<void> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const greeting = patientName ? `Hi ${patientName.split(" ")[0]},` : "Hi there,";

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "BetterList <noreply@betterlist.com>",
    to: email,
    subject: "Your order is confirmed",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FAF9F7; padding: 40px 20px; margin: 0;">
          <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <h1 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px;">
              Order Confirmed ✓
            </h1>
            <p style="color: #6b7280; margin: 0 0 20px; font-size: 15px;">
              ${greeting} Your order from ${doctorName}'s recommendations has been placed.
            </p>

            <div style="background: #FAF9F7; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
              <pre style="font-family: inherit; font-size: 14px; color: #374151; margin: 0; white-space: pre-wrap;">${itemLines}</pre>
              <hr style="border: none; border-top: 1px solid rgba(0,0,0,0.08); margin: 12px 0;" />
              <p style="font-size: 15px; font-weight: 700; color: #1a1a1a; margin: 0; text-align: right;">
                Total: $${total.toFixed(2)}
              </p>
            </div>

            <a href="${APP_URL}/dashboard" style="display: inline-block; background: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 15px;">
              View in dashboard
            </a>

            <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
              Order ID: ${orderId}
            </p>
          </div>
        </body>
      </html>
    `,
  });
}
