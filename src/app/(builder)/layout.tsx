import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DoctorNav } from "@/components/layout/doctor-nav";
import { headers } from "next/headers";

export default async function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const headersList = await headers();
  const practiceSlug = headersList.get("x-practice-slug") ?? undefined;

  // Fetch the clinician's slug for the Storefront nav link (null for guests)
  let clinicianSlug: string | undefined;
  if (session?.user?.id) {
    const profile = await db.doctorProfile.findUnique({
      where: { userId: session.user.id },
      select: { slug: true },
    });
    clinicianSlug = profile?.slug ?? undefined;
  }

  return (
    <div className="min-h-screen bg-background">
      <DoctorNav session={session} practiceSlug={practiceSlug} clinicianSlug={clinicianSlug} />
      <main>{children}</main>
    </div>
  );
}
