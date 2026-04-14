import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StorefrontHeader } from "@/components/storefront-header";
import { StorefrontCatalog } from "@/components/storefront-catalog";

interface StorefrontPageProps {
  params: Promise<{ "clinician-slug": string }>;
}

export async function generateMetadata({ params }: StorefrontPageProps): Promise<Metadata> {
  const { "clinician-slug": slug } = await params;
  const profile = await db.doctorProfile.findUnique({
    where: { slug },
    select: { displayName: true, specialty: true },
  });
  if (!profile) return { title: "Storefront Not Found" };
  return {
    title: `${profile.displayName} — BetterList`,
    description: `Browse products recommended by ${profile.displayName}${profile.specialty ? ` (${profile.specialty})` : ""} on BetterList.`,
  };
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { "clinician-slug": slug } = await params;

  const profile = await db.doctorProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      displayName: true,
      specialty: true,
      storefrontEnabled: true,
      customCategories: true,
      practice: { select: { name: true } },
      picks: {
        select: { product: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!profile) notFound();

  if (!profile.storefrontEnabled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-2xl mb-3">🔒</p>
          <h1 className="text-lg font-semibold text-foreground mb-2">
            Storefront unavailable
          </h1>
          <p className="text-sm text-muted">
            This provider&apos;s storefront is currently unavailable.
          </p>
        </div>
      </div>
    );
  }

  const storefrontUrl =
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/${slug}`;

  const products = profile.picks.map((p) => p.product);

  return (
    <div className="flex flex-col h-screen">
      <StorefrontHeader
        displayName={profile.displayName}
        specialty={profile.specialty}
        practiceName={profile.practice?.name ?? null}
        storefrontUrl={storefrontUrl}
      />

      <div className="flex-1 overflow-hidden">
        <StorefrontCatalog
          clinicianSlug={slug}
          initialProducts={products}
          customCategories={profile.customCategories}
        />
      </div>
    </div>
  );
}
