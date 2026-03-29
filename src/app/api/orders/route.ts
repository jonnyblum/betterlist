import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await db.doctorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) return NextResponse.json({ error: "No doctor profile" }, { status: 403 });

    const orders = await db.order.findMany({
      where: { recommendation: { doctorProfileId: profile.id } },
      include: {
        items: { include: { product: { select: { name: true } } } },
        recommendation: { select: { patientIdentifier: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
