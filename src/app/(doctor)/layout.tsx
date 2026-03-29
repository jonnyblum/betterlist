import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DoctorNav } from "@/components/layout/doctor-nav";
import { headers } from "next/headers";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!dbUser) {
    redirect("/sign-in");
  }

  if ((dbUser.role as string) !== "CLINICIAN") {
    redirect("/dashboard");
  }

  const headersList = await headers();
  const practiceSlug = headersList.get("x-practice-slug") ?? undefined;

  return (
    <div className="min-h-screen bg-background">
      <DoctorNav session={session} practiceSlug={practiceSlug} />
      <main>{children}</main>
    </div>
  );
}
