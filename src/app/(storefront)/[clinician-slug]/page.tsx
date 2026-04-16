import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { StorefrontHeader } from "@/components/storefront-header";
import { getBaseUrl } from "@/lib/utils";
import { StorefrontCatalog } from "@/components/storefront-catalog";
import { DoctorNav } from "@/components/layout/doctor-nav";
import { StorefrontUnavailable } from "@/components/storefront-unavailable";

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
      avatarUrl: true,
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

  // Non-owners can't view an unpublished storefront
  if (!profile.storefrontEnabled && !isOwner) {
    return <StorefrontUnavailable isSignedIn={isSignedIn} />;
  }

  const storefrontUrl =
    `${getBaseUrl()}/${slug}`;

  const products = profile.picks.map((p) => p.product);

  return (
    <div className="flex flex-col h-screen">
      {/* DoctorNav shown only to the clinician who owns this storefront */}
      {isOwner && (
        <DoctorNav session={session} clinicianSlug={slug} hideLogo />
      )}

      <StorefrontHeader
        displayName={profile.displayName}
        specialty={profile.specialty}
        practiceName={profile.practice?.name ?? null}
        storefrontUrl={storefrontUrl}
        avatarUrl={profile.avatarUrl}
        isOwner={isOwner}
        storefrontEnabled={profile.storefrontEnabled}
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
