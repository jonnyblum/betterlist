import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const RAINFOREST_BASE = "https://api.rainforestapi.com/request";

interface RainforestProductResponse {
  request_info?: { success: boolean; message?: string };
  product?: {
    main_image?: { link?: string };
    images?: Array<{ link?: string }>;
  };
}

async function fetchProductImage(amazonUrl: string): Promise<string | null> {
  const apiKey = process.env.RAINFOREST_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    api_key: apiKey,
    type: "product",
    url: amazonUrl,
  });

  try {
    const res = await fetch(`${RAINFOREST_BASE}?${params}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;

    const data: RainforestProductResponse = await res.json();
    if (!data.request_info?.success) return null;

    return (
      data.product?.main_image?.link ??
      data.product?.images?.[0]?.link ??
      null
    );
  } catch {
    return null;
  }
}

// POST /api/admin/fix-images
// Finds all products missing imageUrl and attempts to backfill from Rainforest.
// Pass { amazonUrls: { "<productId>": "<amazonUrl>" } } in the body to supply
// URLs for products that have no amazonUrl stored yet.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const extraUrls: Record<string, string> = body?.amazonUrls ?? {};

  const products = await db.product.findMany({
    where: { imageUrl: null },
    select: { id: true, name: true, amazonUrl: true },
  });

  const fixed: string[] = [];
  const failed: Array<{ id: string; name: string; reason: string }> = [];

  const liveEnabled = process.env.RAINFOREST_LIVE === "true";

  for (const product of products) {
    const amazonUrl = extraUrls[product.id] ?? product.amazonUrl;

    if (!amazonUrl) {
      failed.push({ id: product.id, name: product.name, reason: "no_amazon_url" });
      continue;
    }

    if (!liveEnabled) {
      failed.push({ id: product.id, name: product.name, reason: "rainforest_disabled" });
      continue;
    }

    const imageUrl = await fetchProductImage(amazonUrl);

    if (!imageUrl) {
      failed.push({ id: product.id, name: product.name, reason: "rainforest_no_image" });
      continue;
    }

    await db.product.update({
      where: { id: product.id },
      data: {
        imageUrl,
        ...(extraUrls[product.id] ? { amazonUrl: extraUrls[product.id] } : {}),
      },
    });

    fixed.push(product.name);
  }

  const needsUrl = failed.filter((f) => f.reason === "no_amazon_url");
  const couldNotFetch = failed.filter((f) => f.reason === "rainforest_no_image");

  return NextResponse.json({
    total: products.length,
    fixed: fixed.length,
    fixedProducts: fixed,
    // Still need an Amazon URL supplied — pass their IDs in amazonUrls body
    needsUrl,
    // Had a URL but Rainforest returned no image — supply a replacement URL in amazonUrls
    couldNotFetch,
    skipped: failed.filter((f) => f.reason === "rainforest_disabled"),
    tip: needsUrl.length + couldNotFetch.length > 0
      ? `Re-run POST with { amazonUrls: { "<id>": "<url>", ... } } for the ${needsUrl.length + couldNotFetch.length} remaining products`
      : undefined,
  });
}

// GET /api/admin/fix-images
// Returns a preview: which products are missing images and whether they have Amazon URLs.
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const products = await db.product.findMany({
    where: { imageUrl: null },
    select: { id: true, name: true, brand: true, amazonUrl: true },
    orderBy: { name: "asc" },
  });

  const withUrl = products.filter((p) => p.amazonUrl);
  const withoutUrl = products.filter((p) => !p.amazonUrl);

  return NextResponse.json({
    total: products.length,
    // These will be attempted automatically on POST (but may still fail if the URL is bad)
    willAttempt: withUrl.length,
    // These definitely need a URL supplied in the POST body
    needsUrl: withoutUrl.length,
    withAmazonUrl: withUrl,
    withoutAmazonUrl: withoutUrl,
  });
}
