import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { KitWithItems } from "@/lib/types/kit";

const KIT_INCLUDE = {
  items: {
    orderBy: { order: "asc" as const },
    include: {
      product: { select: { id: true, name: true, brand: true, imageUrl: true } },
    },
  },
} as const;

async function getProfile(userId: string) {
  return db.doctorProfile.findUnique({
    where: { userId },
    select: { id: true, specialty: true },
  });
}

type FavRow = Awaited<ReturnType<typeof fetchFavorites>>[number];

async function fetchFavorites(profileId: string) {
  return db.kitFavorite.findMany({
    where: { doctorProfileId: profileId },
    include: { kit: { include: KIT_INCLUDE } },
    orderBy: { createdAt: "asc" },
  });
}

function mapFav(fav: FavRow): KitWithItems {
  return {
    id: fav.kit.id,
    name: fav.kit.name,
    specialty: fav.kit.specialty,
    isSystem: fav.kit.doctorProfileId === null,
    favoriteId: fav.id,
    items: fav.kit.items.map((item) => ({
      id: item.id,
      order: item.order,
      product: item.product,
    })),
  };
}

/** Ensure every product in the given set has a ClinicianPickedProduct row for this clinician. */
async function autofavoriteProducts(profileId: string, productIds: string[]) {
  if (productIds.length === 0) return;
  await db.clinicianPickedProduct.createMany({
    data: productIds.map((productId) => ({ clinicianId: profileId, productId })),
    skipDuplicates: true,
  });
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await getProfile(session.user.id);
    if (!profile) return NextResponse.json({ error: "No doctor profile" }, { status: 403 });

    let favorites = await fetchFavorites(profile.id);

    // Auto-seed system kits on first load
    if (favorites.length === 0) {
      const systemKits = await db.kit.findMany({
        where: {
          doctorProfileId: null,
          OR: [
            { specialty: profile.specialty },
            { specialty: null },
          ],
        },
        include: KIT_INCLUDE,
      });
      if (systemKits.length > 0) {
        await db.kitFavorite.createMany({
          data: systemKits.map((k) => ({ doctorProfileId: profile.id, kitId: k.id })),
          skipDuplicates: true,
        });
        // Auto-favorite all products in the seeded kits
        const allProductIds = [...new Set(
          systemKits.flatMap((k) => k.items.map((i) => i.product.id))
        )];
        await autofavoriteProducts(profile.id, allProductIds);
        favorites = await fetchFavorites(profile.id);
      }
    }

    // Backfill: ensure all kit products are favorited for existing clinicians
    const allKitProductIds = [...new Set(
      favorites.flatMap((f) => f.kit.items.map((i) => i.product.id))
    )];
    await autofavoriteProducts(profile.id, allKitProductIds);

    return NextResponse.json({ kits: favorites.map(mapFav) });
  } catch (err) {
    console.error("[api/kits GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const CreateKitSchema = z.object({
  name: z.string().min(1).max(30),
  productIds: z.array(z.string().min(1)).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await getProfile(session.user.id);
    if (!profile) return NextResponse.json({ error: "No doctor profile" }, { status: 403 });

    const body = await req.json();
    const parsed = CreateKitSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const { name, productIds } = parsed.data;

    const kit = await db.kit.create({
      data: {
        name,
        doctorProfileId: profile.id,
        items: {
          create: productIds.map((productId, i) => ({ productId, order: i })),
        },
        favorites: {
          create: [{ doctorProfileId: profile.id }],
        },
      },
      include: {
        ...KIT_INCLUDE,
        favorites: { where: { doctorProfileId: profile.id } },
      },
    });

    // Auto-favorite all products in the new kit
    await autofavoriteProducts(profile.id, productIds);

    const result: KitWithItems = {
      id: kit.id,
      name: kit.name,
      specialty: kit.specialty,
      isSystem: false,
      favoriteId: kit.favorites[0].id,
      items: kit.items.map((item) => ({ id: item.id, order: item.order, product: item.product })),
    };

    return NextResponse.json({ kit: result }, { status: 201 });
  } catch (err) {
    console.error("[api/kits POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
