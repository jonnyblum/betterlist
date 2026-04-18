import type { Metadata } from "next";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { StorefrontHeader } from "@/components/storefront-header";

import { StorefrontCatalog } from "@/components/storefront-catalog";
import { DoctorNav } from "@/components/layout/doctor-nav";
import { SPECIALTY_DEFAULT_CATEGORIES } from "@/lib/specialty-categories";
import { getBaseUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sample Storefront — BetterList",
  description: "See what a BetterList provider storefront looks like.",
};

const DEMO_SPECIALTIES = ["Dermatology", "Cardiology", "Primary Care", "Dentistry"] as const;
type DemoSpecialty = typeof DEMO_SPECIALTIES[number];

const DEMO_PROVIDER: Record<DemoSpecialty, { name: string; specialty: DemoSpecialty }> = {
  "Dermatology":  { name: "Dr. Sarah Chen, MD",     specialty: "Dermatology"  },
  "Cardiology":   { name: "Dr. James Rivera, MD",   specialty: "Cardiology"   },
  "Primary Care": { name: "Dr. Maya Patel, DO",     specialty: "Primary Care" },
  "Dentistry":    { name: "Dr. Thomas Brooks, DDS", specialty: "Dentistry"    },
};

// Ordered list of partial name matches per specialty.
// Products are shown in this order; unmatched entries are silently skipped.
const SPECIALTY_PRODUCTS: Record<DemoSpecialty, string[]> = {
  "Dermatology": [
    "EltaMD UV Clear",
    "CeraVe Moisturizing Cream",
    "La Roche-Posay Anthelios Melt-In Milk Sunscreen SPF 100",
    "CeraVe Hydrating Facial Cleanser",
    "La Roche-Posay Toleriane",
    "Neutrogena Rapid Wrinkle Repair",
    "Nordic Naturals Ultimate Omega",
    "Vital Proteins Collagen Peptides",
    "Nature Made Vitamin D3",
    "Pure Encapsulations Magnesium",
    "Calm",
    "Headspace",
  ],
  "Cardiology": [
    "OMRON Platinum",
    "OMRON Silver",
    "KardiaMobile",
    "Zacurate Pro Series 500DL",
    "Innovo Deluxe",
    "Bayer Aspirin Low Dose",
    "Nordic Naturals Ultimate Omega",
    "Apple Watch",
    "WHOOP",
    "Garmin Forerunner",
    "MyFitnessPal",
    "Strava",
  ],
  "Primary Care": [
    "Nature Made Vitamin D3",
    "Nordic Naturals Ultimate Omega",
    "Pure Encapsulations Magnesium",
    "Physician's CHOICE",
    "Nature Made Super B Complex",
    "Emergen-C",
    "NatureWise Vitamin D3",
    "OMRON Silver",
    "Garmin Forerunner",
    "Apple Watch",
    "Fitbit Charge 6",
    "Noom",
    "MyFitnessPal",
  ],
  "Dentistry": [
    "Oral-B Pro 1000 Rechargeable Electric Toothbrush, Black",
    "Philips Sonicare 4100",
    "Waterpik Aquarius",
    "Crest Pro-Health Gum Detoxify",
    "Listerine Total Care",
    "Oral-B Pro 1000 Rechargeable Electric Toothbrush, White",
    "Nordic Naturals Ultimate Omega",
    "Nature Made Vitamin D3",
    "Physician's CHOICE",
    "Pure Encapsulations Magnesium",
    "Calm",
    "Headspace",
  ],
};

interface StorePageProps {
  searchParams: Promise<{ specialty?: string }>;
}

export default async function StoreDemoPage({ searchParams }: StorePageProps) {
  const { specialty: rawSpecialty } = await searchParams;

  const specialty: DemoSpecialty =
    DEMO_SPECIALTIES.includes(rawSpecialty as DemoSpecialty)
      ? (rawSpecialty as DemoSpecialty)
      : "Dermatology";

  const provider = DEMO_PROVIDER[specialty];
  const categories = SPECIALTY_DEFAULT_CATEGORIES[specialty] ?? [];

  const allProducts = await db.product.findMany({
    where: { imageUrl: { not: null } },
  });

  const nameList = SPECIALTY_PRODUCTS[specialty];
  const products = nameList
    .map((fragment) =>
      allProducts.find((p) => p.name.toLowerCase().includes(fragment.toLowerCase()))
    )
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  const session = await auth();
  const isSignedIn = !!session?.user;

  return (
    <div className="flex flex-col h-screen">
      <DoctorNav session={session} hideLogo />

      <StorefrontHeader
        key={specialty}
        displayName={provider.name}
        specialty={provider.specialty}
        practiceName={null}
        storefrontUrl={`${getBaseUrl()}/store`}
        hideShare={!isSignedIn}
        demoSpecialties={DEMO_SPECIALTIES}
        demoActiveSpecialty={specialty}
      />

      <div className="flex-1 overflow-hidden">
        <StorefrontCatalog
          key={specialty}
          initialProducts={products}
          customCategories={categories}
          isDemo={true}
        />
      </div>
    </div>
  );
}
