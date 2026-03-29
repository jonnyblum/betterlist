import { db } from "@/lib/db";
import { getDefaultCategories } from "@/lib/specialty-categories";

type TxOrDb = Parameters<Parameters<typeof db.$transaction>[0]>[0] | typeof db;

/**
 * Seeds specialty kits and picks for a newly created DoctorProfile.
 * Accepts either a Prisma transaction client or the top-level db client
 * so it can be called inside or outside a $transaction.
 */
export async function seedClinicianKits(
  client: TxOrDb,
  profileId: string,
  specialty: string,
): Promise<void> {
  const systemKits = await client.kit.findMany({
    where: {
      doctorProfileId: null,
      OR: [{ specialty }, { specialty: null }],
    },
    include: { items: { select: { productId: true } } },
  });

  if (systemKits.length === 0) return;

  await client.kitFavorite.createMany({
    data: systemKits.map((k) => ({ doctorProfileId: profileId, kitId: k.id })),
    skipDuplicates: true,
  });

  const allProductIds = [
    ...new Set(systemKits.flatMap((k) => k.items.map((i) => i.productId))),
  ];
  if (allProductIds.length > 0) {
    await client.clinicianPickedProduct.createMany({
      data: allProductIds.map((productId) => ({ clinicianId: profileId, productId })),
      skipDuplicates: true,
    });
  }
}

/**
 * Returns the default customCategories for a specialty.
 * Re-exported here so callers don't need a second import.
 */
export { getDefaultCategories };
