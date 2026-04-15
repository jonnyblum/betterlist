import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";
import { getShareUrl } from "@/lib/utils";

/**
 * POST /api/storefront/[slug]/get
 * Auth required (patient must be signed in).
 * Accepts { productIds: string[] } (bag checkout).
 * Validates all products are in the provider's picks, creates a multi-item
 * recommendation, and returns the receipt URL.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const body = await req.json();

  // Support both { productIds: string[] } (bag) and legacy { productId: string }
  let productIds: string[];
  if (Array.isArray(body.productIds) && body.productIds.length > 0) {
    productIds = body.productIds;
  } else if (typeof body.productId === "string" && body.productId) {
    productIds = [body.productId];
  } else {
    return NextResponse.json({ error: "productIds is required" }, { status: 400 });
  }

  if (productIds.length > 50) {
    return NextResponse.json({ error: "Too many products" }, { status: 400 });
  }

  // Find the provider
  const doctorProfile = await db.doctorProfile.findUnique({
    where: { slug },
    select: { id: true, userId: true, storefrontEnabled: true },
  });

  if (!doctorProfile || !doctorProfile.storefrontEnabled) {
    return NextResponse.json({ error: "Storefront not available" }, { status: 404 });
  }

  // Validate all products exist in provider's picks
  const picks = await db.clinicianPickedProduct.findMany({
    where: {
      clinicianId: doctorProfile.id,
      productId: { in: productIds },
    },
    select: { productId: true },
  });

  const validProductIds = new Set(picks.map((p) => p.productId));
  const invalidIds = productIds.filter((id) => !validProductIds.has(id));
  if (invalidIds.length > 0) {
    return NextResponse.json({ error: "One or more products not found in storefront" }, { status: 404 });
  }

  // Determine patient identifier (phone or email)
  const patientIdentifier = session.user.phone ?? session.user.email ?? session.user.id;

  // Create recommendation with all items
  const token = nanoid(12);
  const recommendation = await db.recommendation.create({
    data: {
      token,
      doctorId: doctorProfile.userId,
      doctorProfileId: doctorProfile.id,
      patientIdentifier,
      items: {
        create: productIds.map((productId) => ({ productId, quantity: 1 })),
      },
    },
  });

  return NextResponse.json({ token: recommendation.token, url: getShareUrl(recommendation.token) });
}
