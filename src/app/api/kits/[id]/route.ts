import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { KitWithItems } from "@/lib/types/kit";

async function getProfile(userId: string) {
  return db.doctorProfile.findUnique({ where: { userId }, select: { id: true } });
}

const UpdateKitSchema = z.object({
  name: z.string().min(1).max(30).optional(),
  productIds: z.array(z.string().min(1)).min(1).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await getProfile(session.user.id);
    if (!profile) return NextResponse.json({ error: "No doctor profile" }, { status: 403 });

    const { id } = await params;
    const kit = await db.kit.findUnique({ where: { id }, select: { doctorProfileId: true } });
    if (!kit) return NextResponse.json({ error: "Kit not found" }, { status: 404 });
    // Allow own kits (doctorProfileId === profile.id) and system kits (doctorProfileId === null)
    const isOwnKit = kit.doctorProfileId === profile.id;
    const isSystemKit = kit.doctorProfileId === null;
    if (!isOwnKit && !isSystemKit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = UpdateKitSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const { name, productIds } = parsed.data;

    // Compute newly added products so we can auto-favorite them (removed products stay favorited)
    let newlyAdded: string[] = [];
    if (productIds) {
      const existing = await db.kitItem.findMany({ where: { kitId: id }, select: { productId: true } });
      const existingIds = new Set(existing.map((i) => i.productId));
      newlyAdded = productIds.filter((pid) => !existingIds.has(pid));
    }

    await db.$transaction(async (tx) => {
      if (name) await tx.kit.update({ where: { id }, data: { name } });
      if (productIds) {
        await tx.kitItem.deleteMany({ where: { kitId: id } });
        await tx.kitItem.createMany({
          data: productIds.map((productId, i) => ({ kitId: id, productId, order: i })),
        });
        if (newlyAdded.length > 0) {
          await tx.clinicianPickedProduct.createMany({
            data: newlyAdded.map((productId) => ({ clinicianId: profile.id, productId })),
            skipDuplicates: true,
          });
        }
      }
    });

    const updated = await db.kit.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: { product: { select: { id: true, name: true, brand: true, imageUrl: true } } },
        },
        favorites: { where: { doctorProfileId: profile.id } },
      },
    });

    const result: KitWithItems = {
      id: updated!.id,
      name: updated!.name,
      specialty: updated!.specialty,
      isSystem: isSystemKit,
      favoriteId: updated!.favorites[0]?.id ?? "",
      items: updated!.items.map((item) => ({ id: item.id, order: item.order, product: item.product })),
    };

    return NextResponse.json({ kit: result });
  } catch (err) {
    console.error("[api/kits/[id] PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await getProfile(session.user.id);
    if (!profile) return NextResponse.json({ error: "No doctor profile" }, { status: 403 });

    const { id } = await params;
    const kit = await db.kit.findUnique({ where: { id }, select: { doctorProfileId: true } });
    if (!kit) return NextResponse.json({ error: "Kit not found" }, { status: 404 });

    if (kit.doctorProfileId === profile.id) {
      // Own kit — hard delete (cascades to items + favorites)
      await db.kit.delete({ where: { id } });
    } else if (kit.doctorProfileId === null) {
      // System kit — remove this clinician's favorite only
      await db.kitFavorite.deleteMany({ where: { doctorProfileId: profile.id, kitId: id } });
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/kits/[id] DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
