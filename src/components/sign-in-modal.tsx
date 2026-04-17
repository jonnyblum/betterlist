"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SignInForm } from "@/components/sign-in-form";

const SPECIALTIES = [
  "Primary Care",
  "Dermatology",
  "Cardiology",
  "Dentistry",
  "OB/GYN",
  "Orthopedics",
  "Other",
];

type Step = "auth" | "checking" | "role" | "provider-details";

interface SignInModalProps {
  onClose: () => void;
  onSuccess: () => void;
  /** If set to "PATIENT", auto-select patient role for new users — skips role picker */
  defaultRole?: "PATIENT";
}

export function SignInModal({ onClose, onSuccess, defaultRole }: SignInModalProps) {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [step, setStep] = useState<Step>("auth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step: provider-details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [specialty, setSpecialty] = useState("");

  // Set to true right after phone OTP succeeds so the session effect
  // knows to route based on onboarded status rather than ignore the update.
  const justSignedInRef = useRef(false);

  // After sign-in, wait for session to reflect the new user then route.
  useEffect(() => {
    if (step !== "checking") return;
    if (!session?.user) return;

    if (session.user.onboarded) {
      // Returning user — close immediately
      onSuccess();
    } else if (defaultRole === "PATIENT") {
      // New user on storefront — auto-onboard as patient, no role picker
      handlePatientChoice();
    } else {
      // New user — show role question
      setStep("role");
    }
  // onSuccess is stable (defined in parent); session.user changes after router.refresh()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, session?.user?.onboarded, session?.user?.id]);

  function handleSignInComplete() {
    justSignedInRef.current = true;
    setStep("checking");
    router.refresh();
  }

  async function handlePatientChoice() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "patient" }),
      });
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }
      await updateSession();
      router.refresh();
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleProviderSubmit() {
    if (!firstName.trim() || !lastName.trim() || !specialty) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "provider",
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          specialty,
        }),
      });
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }
      // Refresh JWT so session.user.role becomes CLINICIAN — this triggers
      // the builder's useEffect to re-load picks/profile/kits.
      await updateSession();
      router.refresh();
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-3xl shadow-xl border border-[rgba(0,0,0,0.06)] p-8">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#bbb] hover:text-[#666] hover:bg-black/[0.04] transition-all"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* ── Step: auth ── */}
          {step === "auth" && (
            <>
              <div className="mb-8 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#F0EDE6" }}>
                  <span className="font-bold text-2xl">💊</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground">Welcome to BetterList</h1>
                <p className="text-muted text-sm mt-1">Please sign in or sign up below.</p>
              </div>
              <SignInForm callbackUrl="/builder" onSignInComplete={handleSignInComplete} />
              <p className="text-center text-[11px] text-muted mt-4 whitespace-nowrap">
                By continuing you agree to our{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">Terms</a>
                {" & "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</a>
              </p>
            </>
          )}

          {/* ── Step: checking (spinner while session propagates) ── */}
          {step === "checking" && (
            <div className="py-14 flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted">Signing you in…</p>
            </div>
          )}

          {/* ── Step: role ── */}
          {step === "role" && (
            <>
              <div className="mb-6 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#F0EDE6" }}>
                  <span className="font-bold text-2xl">💊</span>
                </div>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-1">Step 2</p>
                <h2 className="text-xl font-bold text-foreground">What best describes you?</h2>
                <p className="text-sm text-muted mt-1">We'll set up your account accordingly.</p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setError(""); setStep("provider-details"); }}
                  className="w-full border border-[rgba(0,0,0,0.12)] rounded-xl py-3.5 px-4 text-sm text-foreground hover:bg-black/[0.03] hover:border-[rgba(0,0,0,0.2)] transition-all flex items-center gap-3"
                >
                  <span className="text-2xl leading-none">🩺</span>
                  <div className="text-left">
                    <div className="font-semibold">I'm a provider</div>
                    <div className="text-xs text-muted font-normal">Doctor, dentist, practitioner</div>
                  </div>
                </button>

                <button
                  onClick={handlePatientChoice}
                  disabled={loading}
                  className="w-full border border-[rgba(0,0,0,0.12)] rounded-xl py-3.5 px-4 text-sm text-foreground hover:bg-black/[0.03] hover:border-[rgba(0,0,0,0.2)] transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  <span className="text-2xl leading-none">👤</span>
                  <div className="text-left">
                    <div className="font-semibold">I'm a patient</div>
                    <div className="text-xs text-muted font-normal">Viewing doctor recommendations</div>
                  </div>
                </button>
              </div>

              {error && <p className="text-sm text-red-500 text-center mt-3">{error}</p>}
            </>
          )}

          {/* ── Step: provider-details ── */}
          {step === "provider-details" && (
            <>
              <div className="mb-5">
                <button
                  onClick={() => { setStep("role"); setError(""); }}
                  className="text-sm text-muted hover:text-foreground transition-colors font-medium mb-4 flex items-center gap-1"
                >
                  ← Back
                </button>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-0.5">Step 3 of 3</p>
                <h2 className="text-xl font-bold text-foreground">Set up your profile</h2>
                <p className="text-sm text-muted mt-1">Personalizes your catalog and kits.</p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted">First name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      autoFocus
                      className="w-full border border-[rgba(0,0,0,0.12)] rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-[#ccc] focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted">Last name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Smith"
                      className="w-full border border-[rgba(0,0,0,0.12)] rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-[#ccc] focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted">Specialty</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full border border-[rgba(0,0,0,0.12)] rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 bg-white"
                  >
                    <option value="">Select specialty…</option>
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

              <button
                onClick={handleProviderSubmit}
                disabled={loading || !firstName.trim() || !lastName.trim() || !specialty}
                className="mt-5 w-full bg-foreground text-white rounded-xl py-3 px-5 text-sm font-semibold hover:bg-[#222] transition-colors disabled:opacity-40 flex items-center justify-between"
              >
                <span>{loading ? "Setting up your account…" : "Get started"}</span>
                {!loading && <span className="opacity-60">→</span>}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
