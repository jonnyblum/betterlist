import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const BodySchema = z.object({ productId: z.string().min(1) });

async function getDoctorProfile(userId: string) {
  return db.doctorProfile.findUnique({ where: { userId }, select: { id: true } });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getDoctorProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: "No doctor profile" }, { status: 403 });

  const picks = await db.clinicianPickedProduct.findMany({
    where: { clinicianId: profile.id },
    select: { productId: true },
  });

  return NextResponse.json({ productIds: picks.map((p) => p.productId) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const profile = await getDoctorProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: "No doctor profile" }, { status: 403 });

  await db.clinicianPickedProduct.upsert({
    where: { clinicianId_productId: { clinicianId: profile.id, productId: parsed.data.productId } },
    create: { clinicianId: profile.id, productId: parsed.data.productId },
    update: {},
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const profile = await getDoctorProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: "No doctor profile" }, { status: 403 });

  await db.clinicianPickedProduct.deleteMany({
    where: { clinicianId: profile.id, productId: parsed.data.productId },
  });

  return NextResponse.json({ success: true });
}
