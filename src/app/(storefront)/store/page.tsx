import type { Metadata } from "next";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { ProductCategory } from "@prisma/client";
import { StorefrontHeader } from "@/components/storefront-header";
import { StorefrontCatalog } from "@/components/storefront-catalog";
import { DoctorNav } from "@/components/layout/doctor-nav";
import { SPECIALTY_DEFAULT_CATEGORIES } from "@/lib/specialty-categories";
import { getBaseUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sample Storefront — BetterList",
  description: "See what a BetterList provider storefront looks like.",
};

// Demo provider config
const DEMO_SPECIALTIES = ["Dermatology", "Cardiology", "Primary Care", "Dentistry"] as const;
type DemoSpecialty = typeof DEMO_SPECIALTIES[number];

const DEMO_PROVIDER: Record<DemoSpecialty, { name: string; specialty: DemoSpecialty }> = {
  "Dermatology":  { name: "Dr. Sarah Chen",    specialty: "Dermatology"  },
  "Cardiology":   { name: "Dr. James Rivera",  specialty: "Cardiology"   },
  "Primary Care": { name: "Dr. Maya Patel",    specialty: "Primary Care" },
  "Dentistry":    { name: "Dr. Thomas Brooks", specialty: "Dentistry"    },
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

  // How many products to pull per category — weighted by priority (first category gets most)
  const PER_CATEGORY_COUNTS: Record<DemoSpecialty, Record<string, number>> = {
    "Dermatology":  { COSMETIC: 5, SUPPLEMENTS: 3, DEVICES: 2, APPS: 2 },
    "Cardiology":   { DEVICES: 5, SUPPLEMENTS: 3, WEARABLES: 2, APPS: 2 },
    "Primary Care": { SUPPLEMENTS: 5, DEVICES: 3, APPS: 2, WEARABLES: 2 },
    "Dentistry":    { DENTAL: 5, SUPPLEMENTS: 4, DEVICES: 2, APPS: 1 },
  };
  const counts = PER_CATEGORY_COUNTS[specialty];

  // Fetch products per category in parallel, each with a name-based offset unique to the specialty
  // so overlapping categories (e.g. SUPPLEMENTS) surface different products per specialty
  const SPECIALTY_OFFSETS: Record<DemoSpecialty, number> = {
    "Dermatology": 0, "Cardiology": 2, "Primary Care": 4, "Dentistry": 1,
  };
  const offset = SPECIALTY_OFFSETS[specialty];

  const perCategoryResults = await Promise.all(
    categories.map((cat) =>
      db.product.findMany({
        where: { category: cat as ProductCategory },
        orderBy: { name: "asc" },
        skip: offset,
        take: counts[cat] ?? 2,
      })
    )
  );

  // Products to exclude per specialty (by partial name match, case-insensitive)
  const EXCLUDE_NAMES: Partial<Record<DemoSpecialty, string[]>> = {
    "Dentistry":   ["pulse ox", "blood pressure","emergen-c"],
    "Dermatology": ["pulse ox"],
    "Cardiology":  ["emergen-c"],
  };
  const excludePatterns = (EXCLUDE_NAMES[specialty] ?? []).map((s) => s.toLowerCase());

  // Interleave: one from each category in rotation until we hit 12
  const byCategory = perCategoryResults.map((arr) =>
    arr.filter((p) => !excludePatterns.some((ex) => p.name.toLowerCase().includes(ex)))
  );
  const products = [];
  let remaining = 12;
  while (remaining > 0 && byCategory.some((arr) => arr.length > 0)) {
    for (const arr of byCategory) {
      if (arr.length > 0 && remaining > 0) {
        products.push(arr.shift()!);
        remaining--;
      }
    }
  }

  const session = await auth();
  const isSignedIn = !!session?.user;

  return (
    <div className="flex flex-col h-screen">
      <DoctorNav session={session} />

      <StorefrontHeader
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
