import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";
import { getShareUrl } from "@/lib/utils";

/**
 * POST /api/storefront/[slug]/get
 * Auth required (patient must be signed in).
 * Creates a single-product recommendation from this provider to the patient,
 * then returns the receipt URL so the patient can view and purchase.
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
  const { productId } = body as { productId?: string };

  if (!productId || typeof productId !== "string") {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  // Find the provider
  const doctorProfile = await db.doctorProfile.findUnique({
    where: { slug },
    select: { id: true, userId: true, storefrontEnabled: true },
  });

  if (!doctorProfile || !doctorProfile.storefrontEnabled) {
    return NextResponse.json({ error: "Storefront not available" }, { status: 404 });
  }

  // Validate product exists and is in provider's picks
  const pick = await db.clinicianPickedProduct.findUnique({
    where: { clinicianId_productId: { clinicianId: doctorProfile.id, productId } },
  });

  if (!pick) {
    return NextResponse.json({ error: "Product not found in storefront" }, { status: 404 });
  }

  // Determine patient identifier (phone or email)
  const patientIdentifier = session.user.phone ?? session.user.email ?? session.user.id;

  // Create recommendation
  const token = nanoid(12);
  const recommendation = await db.recommendation.create({
    data: {
      token,
      doctorId: doctorProfile.userId,
      doctorProfileId: doctorProfile.id,
      patientIdentifier,
      items: {
        create: [{ productId, quantity: 1 }],
      },
    },
  });

  return NextResponse.json({ token: recommendation.token, url: getShareUrl(recommendation.token) });
}
