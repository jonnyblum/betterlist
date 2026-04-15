import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { StorefrontHeader } from "@/components/storefront-header";
import { StorefrontCatalog } from "@/components/storefront-catalog";
import { DoctorNav } from "@/components/layout/doctor-nav";

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
      userId: true,
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

  const session = await auth();
  const isSignedIn = !!session?.user;

  // Determine if the signed-in user is the owner of this storefront
  const isOwner = isSignedIn && session.user.id === profile.userId;

  if (!profile.storefrontEnabled) {
    return (
      <>
        {isOwner && (
          <DoctorNav session={session} clinicianSlug={slug} />
        )}
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
      </>
    );
  }

  const storefrontUrl =
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/${slug}`;

  const products = profile.picks.map((p) => p.product);

  return (
    <div className="flex flex-col h-screen">
      {/* DoctorNav shown only to the clinician who owns this storefront */}
      {isOwner && (
        <DoctorNav session={session} clinicianSlug={slug} />
      )}

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
