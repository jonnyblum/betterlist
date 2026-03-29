import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import type { RetailerPriceData } from "@/lib/fulfillment";
import { RecommendationReceipt } from "@/components/recommendation-receipt";
import type { RecommendationWithDetails } from "@/types";

interface RecommendationPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ purchased?: string }>;
}

export async function generateMetadata({
  params,
}: RecommendationPageProps): Promise<Metadata> {
  const { token } = await params;

  const rec = await db.recommendation.findUnique({
    where: { token },
    include: { doctorProfile: { include: { practice: true } } },
  });

  if (!rec) return { title: "Recommendation Not Found" };

  if (!rec.doctorProfile) {
    return {
      title: "Product Recommendation",
      description: "Products recommended for you",
    };
  }

  return {
    title: `${rec.doctorProfile.displayName}'s Recommendation`,
    description: `Products recommended by ${rec.doctorProfile.displayName}${rec.doctorProfile.practice ? ` at ${rec.doctorProfile.practice.name}` : ""}`,
  };
}

export default async function RecommendationPage({
  params,
  searchParams,
}: RecommendationPageProps) {
  const { token } = await params;
  const { purchased } = await searchParams;

  const recommendation = await db.recommendation.findUnique({
    where: { token },
    include: {
      items: { include: { product: true } },
      doctorProfile: { include: { practice: true } },
      doctor: { select: { id: true, name: true, email: true, image: true } },
      patient: { select: { id: true, name: true, email: true, phone: true } },
      order: true,
    },
  });

  if (!recommendation) notFound();

  // Mark as viewed
  if (recommendation.status === "SENT") {
    await db.recommendation.update({
      where: { id: recommendation.id },
      data: { status: "VIEWED", viewedAt: new Date() },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const physicalProducts = recommendation.items
    .filter((i) => (i.product as any).fulfillmentType === "PHYSICAL")
    .map((i) => i.product as any);

  // Fetch all available retailer prices for each physical product
  const allPricesByProductId: Record<string, RetailerPriceData[]> = {};
  if (physicalProducts.length > 0) {
    const rows = await db.productRetailerPrice.findMany({
      where: {
        productId: { in: physicalProducts.map((p: any) => p.id) },
        retailer: { in: ["amazon", "walmart"] },
        available: true,
      },
    });
    for (const row of rows) {
      if (!allPricesByProductId[row.productId]) {
        allPricesByProductId[row.productId] = [];
      }
      allPricesByProductId[row.productId].push({
        retailer: row.retailer as "amazon" | "walmart",
        price: row.price.toNumber(),
        url: row.url,
        retailerProductId: row.retailerProductId,
      });
    }
  }

  const handlingFee = parseFloat(process.env.HANDLING_FEE ?? "1.50");
  const amazonAffiliateTag = process.env.AMAZON_AFFILIATE_TAG ?? "";

  // Show patient nav only if the signed-in user owns this recommendation
  const session = await auth();
  const isOwner = !!session?.user && recommendation.patientId === session.user.id;
  const initials = isOwner
    ? (session!.user.name
        ?.split(" ")
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? "")
        .join("") ?? "ME")
    : "";

  return (
    <>
      {isOwner && (
        <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-[rgba(0,0,0,0.06)]">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-lg leading-none">💊</span>
              <span className="font-semibold text-sm">BetterList</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted hidden sm:block">
                {session!.user.name ?? session!.user.email}
              </span>
              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xs font-semibold">
                {initials}
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/sign-in" });
                }}
              >
                <button
                  type="submit"
                  className="text-muted hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-black/5"
                  title="Sign out"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </nav>
      )}
      <RecommendationReceipt
        recommendation={recommendation as unknown as RecommendationWithDetails}
        allPricesByProductId={allPricesByProductId}
        handlingFee={handlingFee}
        amazonAffiliateTag={amazonAffiliateTag}
        initialPurchased={purchased === "1"}
      />
    </>
  );
}
