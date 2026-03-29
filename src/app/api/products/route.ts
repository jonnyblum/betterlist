import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { ProductCategory, Prisma } from "@prisma/client";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";

const VALID_CATEGORIES: ProductCategory[] = [
  "SUPPLEMENTS",
  "APPS",
  "WEARABLES",
  "DEVICES",
  "COSMETIC",
  "DENTAL",
  "OTHER",
];

// Zod schema with strict length limits to prevent oversized payloads
const CreateProductSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  brand: z.string().min(1).max(100).trim(),
  imageUrl: z.string().url().max(2000).optional().nullable(),
  price: z.number().positive().max(100_000),
  affiliateUrl: z.string().url().max(2000).optional().nullable(),
  sku: z.string().max(100).trim().optional().nullable(),
  hsaFsaEligible: z.boolean().optional().default(false),
  category: z.enum(["SUPPLEMENTS", "DEVICES", "COSMETIC", "DENTAL", "OTHER"]),
  tags: z.array(z.string().max(50).trim()).max(20).optional().default([]),
  description: z.string().max(2000).trim().optional().nullable(),
  practiceId: z.string().cuid().optional().nullable(),
});

// Public read: 100 requests/min per IP (scraping protection)
const GET_RATE_LIMIT = { limit: 100, windowSeconds: 60 };
// Authenticated write: 20 requests/hour per user
const POST_RATE_LIMIT = { limit: 20, windowSeconds: 3600 };

export async function GET(req: NextRequest) {
  // Rate limit catalog reads by IP
  const ip = getClientIp(req);
  const { allowed, resetIn } = await checkRateLimit(`products:get:${ip}`, GET_RATE_LIMIT);
  if (!allowed) return rateLimitResponse(resetIn);

  try {
    const { searchParams } = new URL(req.url);

    // Cap search length to prevent slow queries
    const search = searchParams.get("search")?.trim().slice(0, 100);
    const categoryParam = searchParams.get("category")?.toUpperCase();
    const practiceSlug = searchParams.get("practice")?.slice(0, 100);

    const whereClause: Prisma.ProductWhereInput = {};

    if (categoryParam && VALID_CATEGORIES.includes(categoryParam as ProductCategory)) {
      whereClause.category = categoryParam as ProductCategory;
    }

    if (practiceSlug) {
      const practice = await db.practice.findUnique({
        where: { slug: practiceSlug },
        select: { id: true },
      });
      if (practice) {
        whereClause.practiceId = practice.id;
      }
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search.toLowerCase()] } },
      ];
    }

    const products = await db.product.findMany({
      where: whereClause,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      take: 200,
    });

    const isBaseRequest = !search && !categoryParam && !practiceSlug;
    const cacheControl = isBaseRequest
      ? "public, max-age=60, stale-while-revalidate=300"
      : "public, max-age=10, stale-while-revalidate=60";

    return NextResponse.json({ products }, {
      headers: { "Cache-Control": cacheControl },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // OWASP: Require authentication — previously this endpoint was completely open,
  // allowing anyone to inject arbitrary products into the catalog.
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "CLINICIAN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Rate limit by user ID
  const { allowed, resetIn } = await checkRateLimit(
    `products:post:${session.user.id}`,
    POST_RATE_LIMIT
  );
  if (!allowed) return rateLimitResponse(resetIn);

  try {
    const body = await req.json();
    const parsed = CreateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const product = await db.product.create({
      data: {
        name: data.name,
        brand: data.brand,
        imageUrl: data.imageUrl ?? null,
        price: data.price,
        affiliateUrl: data.affiliateUrl ?? null,
        sku: data.sku ?? null,
        hsaFsaEligible: data.hsaFsaEligible,
        category: data.category,
        tags: data.tags,
        description: data.description ?? null,
        practiceId: data.practiceId ?? null,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
