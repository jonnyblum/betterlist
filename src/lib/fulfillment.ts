import { getProductPrices, getManualPrice } from "@/lib/price-scanner";
import type { Product } from "@prisma/client";

const AMAZON_FREE_SHIPPING_THRESHOLD = 25;
const WALMART_FREE_SHIPPING_THRESHOLD = 35;
const FLAT_SHIPPING_RATE = 5.99;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RetailerPriceData {
  retailer: "amazon" | "walmart" | "manual";
  price: number;
  url: string;
  retailerProductId: string | null;
}

export interface ManualItem {
  productId: string;
  price: number;
  url: string;
}

export interface FulfillmentOption {
  /** Winning automated retailer (Amazon or Walmart). Null if only manual items. */
  retailer: "amazon" | "walmart" | null;
  /** Estimated shipping for the automated items */
  shipping: number;
  /** Best price per product at the winning retailer, keyed by product ID */
  priceByProductId: Record<string, RetailerPriceData>;
  /** True when every automated product has a Zinc-compatible ASIN — enables Amazon cart URL */
  allHaveAsin: boolean;
  /** Products with manualFulfillment=true — routed outside Zinc */
  manualItems: ManualItem[];
  /** True when any product requires manual fulfillment review */
  requiresManualReview: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shippingCost(retailer: "amazon" | "walmart", subtotal: number): number {
  const threshold =
    retailer === "amazon" ? AMAZON_FREE_SHIPPING_THRESHOLD : WALMART_FREE_SHIPPING_THRESHOLD;
  return subtotal >= threshold ? 0 : FLAT_SHIPPING_RATE;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Choose the single retailer (Amazon or Walmart) that yields the lowest total
 * for all Zinc-fulfillable physical products. Manual-fulfillment products are
 * separated into `manualItems` and are never sent to Zinc.
 *
 * Prefers Amazon on a tie.
 *
 * Prices come from the ProductRetailerPrice table. Trigger a fresh Rainforest
 * scan upstream if staleness is a concern.
 */
export async function getBestFulfillmentOption(
  products: Product[]
): Promise<FulfillmentOption | null> {
  if (products.length === 0) return null;

  // Split manual vs Zinc-fulfillable
  const zincProducts = products.filter((p) => !p.manualFulfillment);
  const manualProducts = products.filter((p) => p.manualFulfillment);

  // Resolve manual item prices
  const manualItems: ManualItem[] = (
    await Promise.all(
      manualProducts.map(async (p) => {
        const price = await getManualPrice(p.id);
        return price
          ? { productId: p.id, price: price.price, url: price.url }
          : null;
      })
    )
  ).filter((x): x is ManualItem => x !== null);

  // If there are no Zinc products, return a manual-only option
  if (zincProducts.length === 0) {
    return {
      retailer: null,
      shipping: 0,
      priceByProductId: {},
      allHaveAsin: false,
      manualItems,
      requiresManualReview: manualItems.length > 0,
    };
  }

  // Fetch retailer prices for all Zinc-fulfillable products in parallel
  const priceResults = await Promise.all(
    zincProducts.map((p) => getProductPrices(p.id, ["amazon", "walmart"]))
  );

  // Evaluate each retailer — only keep it if it covers every Zinc product
  const retailers: Array<"amazon" | "walmart"> = ["amazon", "walmart"];

  type RetailerEntry = {
    subtotal: number;
    shipping: number;
    prices: Record<string, RetailerPriceData>;
  };

  const retailerEntries: Partial<Record<"amazon" | "walmart", RetailerEntry>> = {};

  for (const retailer of retailers) {
    const prices: Record<string, RetailerPriceData> = {};
    let subtotal = 0;
    let coversAll = true;

    for (let i = 0; i < zincProducts.length; i++) {
      const product = zincProducts[i];
      const hit = priceResults[i].find((r) => r.retailer === retailer);

      if (!hit) {
        coversAll = false;
        break;
      }

      prices[product.id] = {
        retailer,
        price: hit.price,
        url: hit.url,
        retailerProductId: hit.retailerProductId,
      };
      subtotal += hit.price;
    }

    if (!coversAll) continue;

    const shipping = shippingCost(retailer, subtotal);
    retailerEntries[retailer] = { subtotal, shipping, prices };
  }

  // Pick winner — lowest total, Amazon preferred on tie
  let winner: "amazon" | "walmart" | null = null;
  let bestTotal = Infinity;

  for (const retailer of retailers) {
    const entry = retailerEntries[retailer];
    if (!entry) continue;
    const total = entry.subtotal + entry.shipping;
    if (total < bestTotal) {
      bestTotal = total;
      winner = retailer;
    }
  }

  if (winner) {
    const { prices, shipping } = retailerEntries[winner]!;
    const allHaveAsin =
      winner === "amazon" &&
      Object.values(prices).every((p) => p.retailerProductId != null);

    return {
      retailer: winner,
      shipping,
      priceByProductId: prices,
      allHaveAsin,
      manualItems,
      requiresManualReview: manualItems.length > 0,
    };
  }

  // Fallback — no retailer covers all Zinc products; use product list price
  const fallbackPrices: Record<string, RetailerPriceData> = {};
  let subtotal = 0;

  for (let i = 0; i < zincProducts.length; i++) {
    const product = zincProducts[i];
    const first = priceResults[i][0];
    fallbackPrices[product.id] = first
      ? {
          retailer: first.retailer as "amazon" | "walmart",
          price: first.price,
          url: first.url,
          retailerProductId: first.retailerProductId,
        }
      : {
          retailer: "amazon",
          price: product.price,
          url: product.amazonUrl ?? product.affiliateUrl ?? "",
          retailerProductId: null,
        };
    subtotal += fallbackPrices[product.id].price;
  }

  const shipping = shippingCost("amazon", subtotal);

  return {
    retailer: "amazon",
    shipping,
    priceByProductId: fallbackPrices,
    allHaveAsin: false,
    manualItems,
    requiresManualReview: manualItems.length > 0,
  };
}
