"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { normalizePhone, isValidPhone, getShareUrl } from "@/lib/utils";
import type { Product } from "@prisma/client";
import type { KitWithItems } from "@/lib/types/kit";

const SPECIALTIES = [
  "Primary Care",
  "Dermatology",
  "Cardiology",
  "Dentistry",
  "OB/GYN",
  "Orthopedics",
  "Other",
];

interface CartItem {
  product: Product;
  quantity: number;
}

interface GuestSendModalProps {
  cartItems: CartItem[];
  patientIdentifier: string;
  note: string;
  onClose: () => void;
  onSuccess: (token: string) => void;
  onSignedIn?: (kits: KitWithItems[] | null, picks: string[] | null) => void;
}

export function GuestSendModal({
  cartItems,
  patientIdentifier,
  note,
  onClose,
  onSuccess,
  onSignedIn,
}: GuestSendModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 2 fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [specialty, setSpecialty] = useState("");

  const identifier = isValidPhone(patientIdentifier)
    ? normalizePhone(patientIdentifier)
    : patientIdentifier;

  async function handleAnonymousSend() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/recommendations/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientIdentifier: identifier,
          productIds: cartItems.map((i) => i.product.id),
          quantities: Object.fromEntries(cartItems.map((i) => [i.product.id, i.quantity])),
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send recommendation.");
        return;
      }
      onSuccess(data.token);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccountCreate() {
    if (!firstName.trim() || !lastName.trim() || !specialty) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/guest-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          specialty,
          patientIdentifier: identifier,
          productIds: cartItems.map((i) => i.product.id),
          quantities: Object.fromEntries(cartItems.map((i) => [i.product.id, i.quantity])),
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create account. Please try again.");
        return;
      }

      // Auto-login with the one-time token
      const signInResult = await signIn("auto-login", {
        userId: data.userId,
        token: data.autoLoginToken,
        redirect: false,
      });

      if (!signInResult?.ok) {
        // Still show success — recommendation was sent, just couldn't auto-sign-in
        onSuccess(data.token);
        return;
      }

      // Pass newly seeded kits + picks back to the builder
      onSignedIn?.(data.kits ?? null, data.picks ?? null);
      onSuccess(data.token);
      // Refresh router to load session-dependent UI
      router.refresh();
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

      {/* Modal card */}
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#bbb] hover:text-[#666] hover:bg-black/[0.04] transition-all"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === 1 ? (
          <>
            {/* Step 1: Choose path */}
            <div>
              <h2 className="text-xl font-bold text-foreground leading-snug">
                Your recommendation is ready to send
              </h2>
              <p className="mt-1.5 text-sm text-muted">
                Create a free account to track it, or send without saving.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setStep(2)}
                className="w-full bg-foreground text-white rounded-xl py-3.5 px-5 text-sm font-semibold hover:bg-[#222] transition-colors flex items-center justify-between"
              >
                <span>Send and keep track</span>
                <span className="opacity-60">→</span>
              </button>

              <button
                onClick={handleAnonymousSend}
                disabled={loading}
                className="w-full border border-[rgba(0,0,0,0.12)] text-foreground rounded-xl py-3.5 px-5 text-sm font-medium hover:bg-black/[0.03] transition-colors disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send without account"}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center -mt-2">{error}</p>
            )}
          </>
        ) : (
          <>
            {/* Step 2: Create account */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-0.5">
                  Step 2 of 2
                </p>
                <h2 className="text-xl font-bold text-foreground leading-snug">
                  Create your account
                </h2>
              </div>
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

            {error && (
              <p className="text-sm text-red-500 -mt-1">{error}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => { setStep(1); setError(""); }}
                className="text-sm text-muted hover:text-foreground transition-colors font-medium"
              >
                ← Back
              </button>
              <button
                onClick={handleAccountCreate}
                disabled={loading || !firstName.trim() || !lastName.trim() || !specialty}
                className="flex-1 bg-foreground text-white rounded-xl py-3 px-5 text-sm font-semibold hover:bg-[#222] transition-colors disabled:opacity-40 flex items-center justify-between"
              >
                <span>{loading ? "Creating account…" : "Continue and send"}</span>
                {!loading && <span className="opacity-60">→</span>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
