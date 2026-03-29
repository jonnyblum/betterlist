"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

type Step = "choose" | "provider-form";

const SPECIALTIES = ["Primary Care", "Dermatology", "Cardiology", "Dentistry"];

export default function OnboardingPage() {
  const { update } = useSession();
  const [step, setStep] = useState<Step>("choose");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handlePatient() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "patient" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }
      await update();
      window.location.href = "/dashboard";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProviderSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "provider", firstName, lastName, specialty }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }
      await update();
      window.location.href = "/builder";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden px-4">
      <div className="glass-blob w-96 h-96 bg-sage top-[-100px] left-[-100px]" />
      <div className="glass-blob w-80 h-80 bg-sky bottom-[-80px] right-[-80px]" />
      <div className="glass-blob w-64 h-64 bg-peach top-1/2 right-1/4" />

      <div className="relative z-10 w-full max-w-sm">
        {step === "choose" ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "#F0EDE6" }}>
              <span className="font-bold text-2xl">💊</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to BetterList</h1>
            <p className="text-muted text-sm mb-10">Are you a patient or a provider?</p>

            <div className="flex flex-col gap-4">
              <button
                onClick={handlePatient}
                disabled={submitting}
                className="w-full py-6 bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.08)] hover:shadow-md hover:border-[rgba(0,0,0,0.14)] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <div className="text-3xl mb-2">🧑‍⚕️</div>
                <div className="text-base font-semibold text-foreground">I&apos;m a Patient</div>
                <div className="text-sm text-muted mt-1">View recommendations from my doctor</div>
              </button>

              <button
                onClick={() => setStep("provider-form")}
                disabled={submitting}
                className="w-full py-6 bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.08)] hover:shadow-md hover:border-[rgba(0,0,0,0.14)] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <div className="text-3xl mb-2">👨‍💼</div>
                <div className="text-base font-semibold text-foreground">I&apos;m a Provider</div>
                <div className="text-sm text-muted mt-1">Recommend products to my patients</div>
              </button>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl border border-[rgba(0,0,0,0.06)] p-8">
            <button
              onClick={() => setStep("choose")}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-6"
            >
              ← Back
            </button>

            <div className="mb-7">
              <h1 className="text-2xl font-bold text-foreground">Set up your profile</h1>
              <p className="text-muted text-sm mt-1">Takes 20 seconds.</p>
            </div>

            <form onSubmit={handleProviderSubmit} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    First name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[rgba(0,0,0,0.12)] bg-white text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[rgba(0,0,0,0.12)] bg-white text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Specialty
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(0,0,0,0.12)] bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all text-sm appearance-none"
                >
                  <option value="" disabled>Select a specialty</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-foreground text-white rounded-xl font-semibold text-sm hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {submitting ? "Setting up..." : "Let's Go →"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
