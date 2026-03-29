import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { LandingClient } from "@/components/landing-client";

export default async function RootPage() {
  const session = await auth();

  if (session?.user) {
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { onboarded: true, role: true },
    });
    if (!dbUser || !dbUser.onboarded) redirect("/onboarding");
    redirect(dbUser.role === "CLINICIAN" ? "/builder" : "/dashboard");
  }

  return <LandingClient />;
}
