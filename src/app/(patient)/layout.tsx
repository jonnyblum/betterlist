import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { signOut } from "@/lib/auth";

export default async function PatientLayout({
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

  // Doctors should be on the builder
  if ((dbUser.role as string) === "CLINICIAN") {
    redirect("/builder");
  }

  const initials =
    session.user.name
      ?.split(" ")
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("") ?? "ME";

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-[rgba(0,0,0,0.06)]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-lg leading-none">💊</span>
            <span className="font-semibold text-sm">BetterList</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted hidden sm:block">
              {session.user.name ?? session.user.email}
            </span>
            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xs font-semibold">
              {initials}
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/sign-in" });
              }}
            >
              <button
                type="submit"
                className="text-muted hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-black/5"
                title="Sign out"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
