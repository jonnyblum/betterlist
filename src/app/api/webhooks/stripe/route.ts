import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enqueueOrderConfirmation, enqueuePlaceZincOrder } from "@/lib/queue";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: { type: string; data: { object: Record<string, unknown> } };

  // Verify webhook signature
  try {
    const stripe = (await import("stripe")).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);
    event = stripeClient.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    ) as unknown as typeof event;
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          id: string;
          metadata?: { recommendationId?: string; patientId?: string };
          amount_total?: number;
          line_items?: { data: Array<{ price?: { product?: string }; quantity?: number; amount_total?: number }> };
        };

        const { recommendationId, patientId, retailer } = session.metadata ?? {};

        if (!recommendationId || !patientId) {
          console.error("Missing metadata in checkout session:", session.id);
          break;
        }

        // Get recommendation items to build order items
        const recommendation = await db.recommendation.findUnique({
          where: { id: recommendationId },
          include: { items: { include: { product: true } } },
        });

        if (!recommendation) {
          console.error("Recommendation not found:", recommendationId);
          break;
        }

        // Create or update order
        const order = await db.order.upsert({
          where: { recommendationId },
          create: {
            recommendationId,
            patientId,
            total: (session.amount_total ?? 0) / 100,
            status: "PAID",
            stripeSessionId: session.id,
            retailer: retailer ?? null,
            items: {
              create: recommendation.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price,
              })),
            },
          },
          update: {
            status: "PAID",
            stripeSessionId: session.id,
          },
        });

        // Update recommendation status
        await db.recommendation.update({
          where: { id: recommendationId },
          data: { status: "PURCHASED", purchasedAt: new Date() },
        });

        // Enqueue order confirmation and Zinc fulfillment job
        await enqueueOrderConfirmation({ orderId: order.id });
        if (retailer === "amazon" || retailer === "walmart") {
          await enqueuePlaceZincOrder({
            orderId: order.id,
            recommendationId,
            retailer,
          });
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as { metadata?: { orderId?: string } };
        const { orderId } = paymentIntent.metadata ?? {};
        if (orderId) {
          await db.order.update({
            where: { id: orderId },
            data: { status: "CANCELLED" },
          });
        }
        break;
      }

      default:
        // Unhandled event type — log and ignore
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
