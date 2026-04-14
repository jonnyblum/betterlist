import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/storefront/[slug]
 * Public — returns provider profile + their picked products for the storefront.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const profile = await db.doctorProfile.findUnique({
    where: { slug },
    select: {
      displayName: true,
      specialty: true,
      storefrontEnabled: true,
      customCategories: true,
      practice: { select: { name: true } },
      picks: {
        select: {
          product: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const products = profile.picks.map((p) => p.product);

  return NextResponse.json({
    profile: {
      displayName: profile.displayName,
      specialty: profile.specialty,
      storefrontEnabled: profile.storefrontEnabled,
      customCategories: profile.customCategories,
      practiceName: profile.practice?.name ?? null,
    },
    products,
  });
}
