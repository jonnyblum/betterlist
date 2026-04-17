"use client";

import { useRouter } from "next/navigation";

export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();

  function handleBack() {
    try {
      const referrer = document.referrer;
      const fromSameSite =
        referrer && new URL(referrer).origin === window.location.origin;

      if (fromSameSite) {
        if (window.history.length > 1) {
          // Same tab — normal back navigation
          router.back();
        } else {
          // New tab (target="_blank") — no history, navigate to the referring page directly
          router.push(new URL(referrer).pathname + new URL(referrer).search);
        }
      } else {
        router.push(fallbackHref);
      }
    } catch {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}
