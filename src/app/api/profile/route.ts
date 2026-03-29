import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await db.doctorProfile.findUnique({
      where: { userId: session.user.id },
      select: { specialty: true, customCategories: true },
    });

    if (!profile) return NextResponse.json({ error: "No doctor profile" }, { status: 404 });

    return NextResponse.json(profile);
  } catch (err) {
    console.error("[api/profile GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { customCategories } = body;

  if (!Array.isArray(customCategories) || !customCategories.every((v) => typeof v === "string")) {
    return NextResponse.json({ error: "customCategories must be a string array" }, { status: 400 });
  }

  await db.doctorProfile.update({
    where: { userId: session.user.id },
    data: { customCategories },
  });

  return NextResponse.json({ ok: true });
}
