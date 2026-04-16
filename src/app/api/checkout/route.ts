import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getBaseUrl } from "@/lib/utils";

const HANDLING_FEE = parseFloat(process.env.HANDLING_FEE ?? "1.50");
const AMAZON_FREE_SHIPPING = 25;
const WALMART_FREE_SHIPPING = 35;
const FLAT_SHIPPING = 5.99;
const POST_RATE_LIMIT = { limit: 10, windowSeconds: 3600 };

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowed, resetIn } = await checkRateLimit(
      `checkout:${session.user.id}`,
      POST_RATE_LIMIT
    );
    if (!allowed) return rateLimitResponse(resetIn);

    const body = await req.json();
    const { recommendationId, selectedProductIds, retailerOverrides } = body as {
      recommendationId: string;
      selectedProductIds?: string[];
      retailerOverrides?: Record<string, "amazon" | "walmart">;
    };

    if (!recommendationId) {
      return NextResponse.json({ error: "recommendationId required" }, { status: 400 });
    }

    const recommendation = await db.recommendation.findUnique({
      where: { id: recommendationId },
      include: {
        items: { include: { product: true } },
        doctorProfile: true,
      },
    });

    if (!recommendation) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    // Only physical products go through BetterList checkout
    let physicalItems = recommendation.items.filter(
      (i) => (i.product as any).fulfillmentType === "PHYSICAL"
    );

    // Apply selection filter if provided
    if (selectedProductIds && selectedProductIds.length > 0) {
      physicalItems = physicalItems.filter((i) =>
        selectedProductIds.includes(i.product.id)
      );
    }

    if (physicalItems.length === 0) {
      return NextResponse.json(
        { error: "No shippable products selected" },
        { status: 400 }
      );
    }

    // Fetch retailer prices for selected items
    const priceRows = await db.productRetailerPrice.findMany({
      where: {
        productId: { in: physicalItems.map((i) => i.product.id) },
        available: true,
      },
    });

    const priceMap = new Map<string, Map<string, number>>();
    for (const row of priceRows) {
      if (!priceMap.has(row.productId)) priceMap.set(row.productId, new Map());
      priceMap.get(row.productId)!.set(row.retailer, row.price.toNumber());
    }

    // Build line items and compute per-retailer subtotals for shipping
    let amazonSubtotal = 0;
    let walmartSubtotal = 0;

    const lineItems = physicalItems.map((item) => {
      const retailer = retailerOverrides?.[item.product.id] ?? "amazon";
      const unitPrice =
        priceMap.get(item.product.id)?.get(retailer) ?? item.product.price;

      if (retailer === "amazon") {
        amazonSubtotal += unitPrice * item.quantity;
      } else {
        walmartSubtotal += unitPrice * item.quantity;
      }

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.product.name,
            description: item.product.brand,
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity: item.quantity,
      };
    });

    // Add shipping per retailer group
    if (amazonSubtotal > 0 && amazonSubtotal < AMAZON_FREE_SHIPPING) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Amazon shipping", description: "" },
          unit_amount: Math.round(FLAT_SHIPPING * 100),
        },
        quantity: 1,
      });
    }
    if (walmartSubtotal > 0 && walmartSubtotal < WALMART_FREE_SHIPPING) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Walmart shipping", description: "" },
          unit_amount: Math.round(FLAT_SHIPPING * 100),
        },
        quantity: 1,
      });
    }

    // Handling fee
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Handling", description: "" },
        unit_amount: Math.round(HANDLING_FEE * 100),
      },
      quantity: 1,
    });

    // Determine primary retailer for metadata (amazon if any items there)
    const primaryRetailer = amazonSubtotal > 0 ? "amazon" : "walmart";

    const baseUrl = getBaseUrl();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      metadata: {
        recommendationId: recommendation.id,
        patientId: session.user.id,
        retailer: primaryRetailer,
      },
      customer_email: session.user.email ?? undefined,
      success_url: `${baseUrl}/r/${(recommendation as any).token}?purchased=1`,
      cancel_url: `${baseUrl}/r/${(recommendation as any).token}`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
