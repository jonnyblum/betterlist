import type { CatalogProduct } from "@/lib/types/catalog";
import type { ProductCategory } from "@prisma/client";

const RAINFOREST_BASE = "https://api.rainforestapi.com/request";

// ─── Raw Rainforest search response shape ─────────────────────────────────────

interface RainforestCategory {
  name?: string;
}

interface RainforestSearchItem {
  asin: string;
  title: string;
  brand?: string;
  manufacturer?: string;
  image?: string;
  link?: string;
  prices?: Array<{ value?: number }>;
  price?: { value?: number };
  // Amazon category breadcrumbs returned by the search endpoint
  categories?: RainforestCategory[];
  // Some responses use a flat category string instead
  category?: string;
}

interface RainforestSearchResponse {
  search_results?: RainforestSearchItem[];
}

// ─── Category mapping ──────────────────────────────────────────────────────────
//
// Matches against the joined title + Amazon category breadcrumb names.
// To support a new ProductCategory, add a row to CATEGORY_RULES below.

interface CategoryRule {
  pattern: RegExp;
  category: ProductCategory;
}

const CATEGORY_RULES: CategoryRule[] = [
  // DENTAL — before DEVICES so "oral care" beats generic "health care"
  {
    pattern:
      /oral care|dental|toothbrush|toothpaste|tooth paste|floss|mouthwash|mouth wash|whitening|water flosser|waterpik|gum|orthodon/i,
    category: "DENTAL",
  },
  // DEVICES
  {
    pattern:
      /blood pressure|sphygmomanometer|thermometer|pulse oximeter|nebulizer|cpap|bipap|glucose meter|glucometer|stethoscope|medical device|health monitor|ecg|ekg|spirometer|peak flow|oximeter|tens unit|tens machine|laser therapy|light therapy|red light|infrared|tens|ems machine|hearing aid|compression pump/i,
    category: "DEVICES",
  },
  // SUPPLEMENTS
  {
    pattern:
      /supplement|vitamin|mineral|probiotic|prebiotic|protein powder|whey protein|plant protein|fish oil|omega-?3|collagen|collagen peptide|antioxidant|adaptogen|ashwagandha|magnesium|zinc|iron supplement|calcium supplement|coenzyme|coq10|turmeric|curcumin|elderberry|melatonin|sleep aid|weight loss pill|fat burner|appetite suppressant/i,
    category: "SUPPLEMENTS",
  },
  // WEARABLES — before DEVICES so "fitness tracker" beats "monitor"
  {
    pattern:
      /fitness tracker|smartwatch|smart watch|activity tracker|wearable|garmin|fitbit|apple watch|heart rate monitor|continuous glucose monitor|cgm|smart ring|oura|whoop|sports watch/i,
    category: "WEARABLES",
  },
  // COSMETIC
  {
    pattern:
      /skin care|skincare|moisturizer|moisturiser|face serum|serum|face wash|facial cleanser|cleanser|sunscreen|sun screen|spf|retinol|hyaluronic|cosmetic|beauty|body lotion|body cream|anti-aging|anti aging|face cream|eye cream|toner|essence|primer|concealer|foundation|lip balm|lip care|hair care|shampoo|conditioner|hair mask|scalp/i,
    category: "COSMETIC",
  },
  // APPS (digital products rarely appear in Amazon search, but handle them)
  {
    pattern: /mobile app|digital subscription|software subscription/i,
    category: "APPS",
  },
];

/**
 * Map an Amazon item to one of our ProductCategory values.
 *
 * Searches the joined title + category breadcrumb text against CATEGORY_RULES
 * in order, returning the first match.  Falls back to "OTHER".
 *
 * To add a new category: extend the ProductCategory enum in schema.prisma,
 * run a migration, then add a new row to CATEGORY_RULES above.
 */
function mapCategory(
  title: string,
  categories?: RainforestCategory[],
  categoryFlat?: string
): ProductCategory {
  const text = [
    title,
    categoryFlat ?? "",
    ...(categories ?? []).map((c) => c.name ?? ""),
  ]
    .join(" ")
    .toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(text)) return rule.category;
  }
  return "OTHER";
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search Amazon's catalog via Rainforest API.
 *
 * Returns CatalogProduct-shaped objects with temporary ids (`rf_<ASIN>`) and
 * `source: 'rainforest'`.  Safe to render immediately; must be persisted via
 * POST /api/products before use in a recommendation.
 *
 * Only called when RAINFOREST_LIVE=true; callers are responsible for the gate.
 */
export async function searchProducts(
  query: string,
  page = 1
): Promise<CatalogProduct[]> {
  const apiKey = process.env.RAINFOREST_API_KEY;
  if (!apiKey) {
    console.warn("[rainforest] RAINFOREST_API_KEY not set — returning empty results");
    return [];
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    type: "search",
    amazon_domain: "amazon.com",
    search_term: query,
    page: String(page),
  });

  let data: RainforestSearchResponse;
  try {
    const res = await fetch(`${RAINFOREST_BASE}?${params}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "(unreadable)");
      console.error(`[rainforest] HTTP ${res.status} for search "${query}":`, errBody);
      return [];
    }
    data = await res.json();
  } catch (err) {
    console.error("[rainforest] fetch error:", err);
    return [];
  }

  const now = new Date();

  return (data.search_results ?? []).map((item): CatalogProduct => ({
    id: `rf_${item.asin}`,
    source: "rainforest",

    name: item.title,
    brand: item.brand ?? item.manufacturer ?? "",
    imageUrl: item.image ?? null,
    description: null,
    tags: [],

    price: item.prices?.[0]?.value ?? item.price?.value ?? 0,

    category: mapCategory(item.title, item.categories, item.category),
    fulfillmentType: "PHYSICAL",
    hsaFsaEligible: false,
    manualFulfillment: false,
    ctaLabel: null,
    affiliateUrl: null,
    sku: null,

    amazonUrl: item.link ?? null,
    walmartUrl: null,

    practiceId: null,
    createdAt: now,
  }));
}
