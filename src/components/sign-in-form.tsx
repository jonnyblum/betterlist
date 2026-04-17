"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidEmail, isValidPhone, normalizePhone } from "@/lib/utils";

interface SignInFormProps {
  callbackUrl?: string;
  defaultTab?: "email" | "phone";
  /** Called after successful phone OTP auth instead of navigating to callbackUrl */
  onSignInComplete?: () => void;
}

export function SignInForm({ callbackUrl = "/", defaultTab = "email", onSignInComplete }: SignInFormProps) {
  const [tab, setTab] = useState<"email" | "phone">(defaultTab);
  const [emailValue, setEmailValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(emailValue)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await signIn("resend", {
        email: emailValue,
        callbackUrl,
        redirect: false,
      });
      if (result?.error) {
        setError("Failed to send sign-in link. Please try again.");
      } else {
        setEmailSent(true);
      }
    } catch {
      setError("Failed to send sign-in link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneSend(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhone(phoneValue)) {
      setError("Please enter a valid phone number.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const normalized = normalizePhone(phoneValue);
      if (!normalized) { setError("Please enter a valid US phone number."); return; }
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send code.");
        return;
      }
      setOtpStep(true);
    } catch {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const normalized = normalizePhone(phoneValue);
      if (!normalized) { setError("Please enter a valid US phone number."); return; }
      const result = await signIn("phone-otp", {
        phone: normalized,
        code: otpCode,
        callbackUrl,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid or expired code. Please try again.");
      } else if (result?.ok) {
        if (onSignInComplete) {
          onSignInComplete();
        } else if (result.url) {
          window.location.href = result.url;
        }
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="font-semibold text-foreground mb-1">Check your email</h3>
        <p className="text-sm text-muted mb-4">
          We sent a magic link to <strong>{emailValue}</strong>
        </p>
        <button
          onClick={() => { setEmailSent(false); setEmailValue(""); }}
          className="text-sm text-muted underline underline-offset-2"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => { setTab("email"); setError(""); setOtpStep(false); }}
          className={[
            "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
            tab === "email"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted hover:text-foreground",
          ].join(" ")}
        >
          Email
        </button>
        <button
          onClick={() => { setTab("phone"); setError(""); setOtpStep(false); }}
          className={[
            "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
            tab === "phone"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted hover:text-foreground",
          ].join(" ")}
        >
          Phone
        </button>
      </div>

      {/* Email form */}
      {tab === "email" && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email address"
            placeholder="you@example.com"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            error={error}
            autoFocus
            autoComplete="email"
          />
          <Button type="submit" fullWidth loading={loading} size="lg">
            Continue with Email
          </Button>

        </form>
      )}

      {/* Phone form */}
      {tab === "phone" && !otpStep && (
        <form onSubmit={handlePhoneSend} className="space-y-4">
          <Input
            type="tel"
            label="Phone number"
            placeholder="+1 (201) 555-0123"
            value={phoneValue}
            onChange={(e) => setPhoneValue(e.target.value)}
            error={error}
            autoFocus
            autoComplete="tel"
          />
          <Button type="submit" fullWidth loading={loading} size="lg">
            Continue with Phone
          </Button>
        </form>
      )}

      {/* OTP form */}
      {tab === "phone" && otpStep && (
        <form onSubmit={handleOtpVerify} className="space-y-4">
          <div>
            <p className="text-sm text-muted mb-4">
              Enter the 6-digit code sent to{" "}
              <strong className="text-foreground">{phoneValue}</strong>
            </p>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              label="Verification code"
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              error={error}
              autoFocus
              className="text-center text-xl tracking-[0.5em] font-mono"
            />
          </div>
          <Button type="submit" fullWidth loading={loading} size="lg">
            Verify code
          </Button>
          <button
            type="button"
            onClick={() => { setOtpStep(false); setOtpCode(""); setError(""); }}
            className="w-full text-sm text-muted hover:text-foreground transition-colors"
          >
            Use a different number
          </button>
        </form>
      )}
    </div>
  );
}
