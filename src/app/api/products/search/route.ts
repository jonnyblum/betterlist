import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchProducts } from "@/lib/rainforest";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import type { Prisma } from "@prisma/client";
import type { CatalogProduct } from "@/lib/types/catalog";

const PAGE_SIZE = 36;
const RATE_LIMIT = { limit: 60, windowSeconds: 60 };

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, resetIn } = await checkRateLimit(`products:search:${ip}`, RATE_LIMIT);
  if (!allowed) return rateLimitResponse(resetIn);

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().slice(0, 100) ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  // Short queries or empty: fall back to DB-only results (same as /api/products)
  if (q.length < 2) {
    const products = await db.product.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    });
    return NextResponse.json({
      products: products.map((p) => ({ ...p, source: "db" })),
      page,
      hasMore: products.length === PAGE_SIZE,
    });
  }

  // ─── DB search ──────────────────────────────────────────────────────────────

  const whereClause: Prisma.ProductWhereInput = {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ],
  };

  // DB results are always returned in full on page 1 (they're fast and bounded)
  const dbProducts =
    page === 1
      ? await db.product.findMany({
          where: whereClause,
          orderBy: [{ category: "asc" }, { name: "asc" }],
          take: 200,
        })
      : [];

  // ─── Rainforest live search ──────────────────────────────────────────────────

  const liveEnabled = process.env.RAINFOREST_LIVE === "true";

  let rainforestResults: CatalogProduct[] = [];
  let hasMore = false;

  if (liveEnabled) {
    rainforestResults = await searchProducts(q, page);

    // Build set of ASINs already in DB so we can deduplicate
    const dbAsins = new Set<string>();
    if (rainforestResults.length > 0) {
      const amazonPrices = await db.productRetailerPrice.findMany({
        where: {
          retailer: "amazon",
          retailerProductId: { not: null },
          product: { OR: whereClause.OR },
        },
        select: { retailerProductId: true },
      });
      // Also collect ASINs from ALL db products matching our results (not just query matches)
      // because a product might match by ASIN but not by name
      const allDbAsins = await db.productRetailerPrice.findMany({
        where: {
          retailer: "amazon",
          retailerProductId: {
            in: rainforestResults.map((r) => r.id.replace(/^rf_/, "")),
          },
        },
        select: { retailerProductId: true },
      });
      for (const row of amazonPrices) {
        if (row.retailerProductId) dbAsins.add(row.retailerProductId);
      }
      for (const row of allDbAsins) {
        if (row.retailerProductId) dbAsins.add(row.retailerProductId);
      }
    }

    // Filter out Rainforest results whose ASIN is already in the DB
    rainforestResults = rainforestResults.filter(
      (r) => !dbAsins.has(r.id.replace(/^rf_/, ""))
    );

    hasMore = rainforestResults.length >= 10;
  }

  // ─── Merge: DB first, then Rainforest ───────────────────────────────────────

  const dbTagged: CatalogProduct[] = dbProducts.map((p) => ({
    ...p,
    source: "db" as const,
  }));

  const merged = [...dbTagged, ...rainforestResults];

  return NextResponse.json(
    { products: merged, page, hasMore },
    { headers: { "Cache-Control": "no-store" } }
  );
}
