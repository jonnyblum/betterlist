import { auth } from "@/lib/auth";
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

  return (
    <div className="min-h-screen bg-background">
      <DoctorNav session={session} practiceSlug={practiceSlug} />
      <main>{children}</main>
    </div>
  );
}
