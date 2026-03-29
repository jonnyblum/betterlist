import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// Rainforest API — Amazon US and Walmart only.
// Do NOT extend to Target, eBay, Best Buy, or other retailers
// without also confirming Zinc supports the retailer for fulfillment.
const RAINFOREST_BASE = "https://api.rainforestapi.com/request";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RetailerPriceResult {
  retailer: "amazon" | "walmart" | "manual";
  price: number;
  url: string;
  retailerProductId: string | null;
  available: boolean;
  manualEntry: boolean;
}

interface RainforestProduct {
  buybox_winner?: {
    price?: { value: number };
    availability?: { raw?: string };
  };
  price?: { value: number };
}

interface RainforestResponse {
  request_info?: { success: boolean; message?: string };
  product?: RainforestProduct;
}

// ─── Rainforest fetch (Amazon US + Walmart) ───────────────────────────────────

async function fetchRainforestPrice(
  productUrl: string
): Promise<{ price: number; available: boolean } | null> {
  const apiKey = process.env.RAINFOREST_API_KEY;
  if (!apiKey) {
    console.warn("[price-scanner] RAINFOREST_API_KEY not set — skipping live scan");
    return null;
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    type: "product",
    url: productUrl,
  });

  const res = await fetch(`${RAINFOREST_BASE}?${params.toString()}`, {
    next: { revalidate: 0 }, // always fresh
  });

  if (!res.ok) {
    console.error(`[price-scanner] Rainforest HTTP ${res.status} for ${productUrl}`);
    return null;
  }

  const data: RainforestResponse = await res.json();

  if (!data.request_info?.success) {
    console.error("[price-scanner] Rainforest error:", data.request_info?.message);
    return null;
  }

  const priceValue =
    data.product?.buybox_winner?.price?.value ??
    data.product?.price?.value ??
    null;

  if (priceValue == null) return null;

  const available =
    data.product?.buybox_winner?.availability?.raw?.toLowerCase().includes("in stock") ?? true;

  return { price: priceValue, available };
}

// ─── Scan a single product ────────────────────────────────────────────────────

/**
 * Refresh Amazon and Walmart prices for one product via Rainforest.
 *
 * Rules:
 * - Only scans retailers where the product has an explicit URL set.
 * - Never overwrites records where manualEntry = true.
 * - Only calls Rainforest when RAINFOREST_LIVE=true; otherwise uses
 *   existing DB records as-is (treating them as up-to-date stubs).
 * - Skips the product entirely when manualFulfillment = true.
 */
export async function scanProductPrices(productId: string): Promise<void> {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      retailerPrices: { where: { manualEntry: true } },
    },
  });

  if (!product) {
    console.warn(`[price-scanner] Product ${productId} not found`);
    return;
  }

  if (product.manualFulfillment) {
    // Manual products are managed by admin — Rainforest never touches them
    return;
  }

  const liveEnabled = process.env.RAINFOREST_LIVE === "true";
  const manualRetailers = new Set(product.retailerPrices.map((r) => r.retailer));

  async function upsertPrice(
    retailer: "amazon" | "walmart",
    productUrl: string
  ) {
    // Never overwrite an admin-managed record
    if (manualRetailers.has(retailer)) return;

    let scannedPrice: number | null = null;
    let available = true;

    if (liveEnabled) {
      const result = await fetchRainforestPrice(productUrl);
      if (!result) return; // Rainforest returned nothing — keep existing record
      scannedPrice = result.price;
      available = result.available;
    } else {
      // Feature flag off — check if a non-manual record exists already
      const existing = await db.productRetailerPrice.findUnique({
        where: { productId_retailer: { productId, retailer } },
      });
      if (!existing) return; // Nothing to refresh, no stub data
      scannedPrice = existing.price.toNumber();
      available = existing.available;
    }

    await db.productRetailerPrice.upsert({
      where: { productId_retailer: { productId, retailer } },
      create: {
        productId,
        retailer,
        price: new Prisma.Decimal(scannedPrice),
        url: productUrl,
        available,
        manualEntry: false,
        scannedAt: liveEnabled ? new Date() : null,
      },
      update: {
        price: new Prisma.Decimal(scannedPrice),
        url: productUrl,
        available,
        ...(liveEnabled ? { scannedAt: new Date() } : {}),
      },
    });
  }

  const tasks: Promise<void>[] = [];
  if (product.amazonUrl) tasks.push(upsertPrice("amazon", product.amazonUrl));
  if (product.walmartUrl) tasks.push(upsertPrice("walmart", product.walmartUrl));
  await Promise.all(tasks);
}

// ─── Scan all eligible products ───────────────────────────────────────────────

/**
 * Refresh prices for every non-manual product that has at least one retailer URL.
 * Intended to run as a scheduled BullMQ job.
 */
export async function scanAllProducts(): Promise<{ scanned: number; skipped: number }> {
  const products = await db.product.findMany({
    where: {
      manualFulfillment: false,
      OR: [{ amazonUrl: { not: null } }, { walmartUrl: { not: null } }],
    },
    select: { id: true },
  });

  let skipped = 0;
  for (const { id } of products) {
    try {
      await scanProductPrices(id);
    } catch (err) {
      console.error(`[price-scanner] Failed scanning product ${id}:`, err);
      skipped++;
    }
  }

  return { scanned: products.length - skipped, skipped };
}

// ─── Read prices for fulfillment ──────────────────────────────────────────────

/**
 * Returns current retailer prices for a product from the DB.
 * Called by fulfillment.ts — does NOT trigger a live Rainforest scan.
 */
export async function getProductPrices(
  productId: string,
  retailers: Array<"amazon" | "walmart"> = ["amazon", "walmart"]
): Promise<RetailerPriceResult[]> {
  const rows = await db.productRetailerPrice.findMany({
    where: { productId, retailer: { in: retailers }, available: true },
  });

  return rows.map((r) => ({
    retailer: r.retailer as "amazon" | "walmart" | "manual",
    price: r.price.toNumber(),
    url: r.url,
    retailerProductId: r.retailerProductId,
    available: r.available,
    manualEntry: r.manualEntry,
  }));
}

/**
 * Returns manual-entry prices for products with manualFulfillment = true.
 */
export async function getManualPrice(
  productId: string
): Promise<RetailerPriceResult | null> {
  const row = await db.productRetailerPrice.findFirst({
    where: { productId, retailer: "manual" },
  });
  if (!row) return null;
  return {
    retailer: "manual",
    price: row.price.toNumber(),
    url: row.url,
    retailerProductId: null,
    available: row.available,
    manualEntry: true,
  };
}
