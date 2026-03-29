import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SignInForm } from "@/components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to BetterList to view your doctor's recommendations.",
};

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user) {
    if (params.callbackUrl) {
      redirect(params.callbackUrl);
    }
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { onboarded: true },
    });
    if (!dbUser?.onboarded) {
      redirect("/onboarding");
    }
    redirect(session.user.role === "CLINICIAN" ? "/builder" : "/dashboard");
  }

  const errorMessages: Record<string, string> = {
    OAuthSignin: "Error signing in. Please try again.",
    OAuthCallback: "Error signing in. Please try again.",
    OAuthCreateAccount: "Could not create account.",
    EmailCreateAccount: "Could not create account.",
    Callback: "Something went wrong. Please try again.",
    OAuthAccountNotLinked: "This email is already associated with another sign-in method.",
    EmailSignin: "Failed to send sign-in link.",
    CredentialsSignin: "Invalid credentials. Please try again.",
    default: "Something went wrong. Please try again.",
  };

  const errorMessage = params.error
    ? (errorMessages[params.error] ?? errorMessages.default)
    : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden px-4">
      {/* Background blobs */}
      <div className="glass-blob w-96 h-96 bg-sage top-[-100px] left-[-100px]" />
      <div className="glass-blob w-80 h-80 bg-sky bottom-[-80px] right-[-80px]" />
      <div className="glass-blob w-64 h-64 bg-peach top-1/2 right-1/4" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-[rgba(0,0,0,0.06)] p-8">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#F0EDE6" }}>
              <span className="font-bold text-2xl">💊</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome to BetterList</h1>
            <p className="text-muted text-sm mt-1">
            Please sign in or sign up below.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <SignInForm callbackUrl={params.callbackUrl} />
        </div>

        <p className="text-center text-xs text-muted mt-6">
          By signing in you agree to our{" "}
          <a href="#" className="underline underline-offset-2 hover:text-foreground">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-2 hover:text-foreground">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
