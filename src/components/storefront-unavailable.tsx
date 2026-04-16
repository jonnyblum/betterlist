"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function StorefrontUnavailable({ isSignedIn }: { isSignedIn: boolean }) {
  const router = useRouter();
  const [count, setCount] = useState(5);
  const dest = isSignedIn ? "/builder" : "/";

  useEffect(() => {
    if (count <= 0) { router.push(dest); return; }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, dest, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal header */}
      <div className="border-b border-black/[0.08] px-6 h-14 flex items-center">
        <a href="/" className="flex items-center gap-2">
          <span className="text-lg leading-none">💊</span>
          <span className="font-semibold text-sm">BetterList</span>
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-2xl mb-3">🔒</p>
        <h1 className="text-lg font-semibold text-foreground mb-2">
          Storefront unavailable
        </h1>
        <p className="text-sm text-muted mb-5">
          This provider&apos;s storefront is currently unavailable.
        </p>
        <button
          onClick={() => router.push(dest)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-white text-sm font-semibold hover:bg-[#222] transition-colors"
        >
          {isSignedIn ? "Take me to my profile" : "Go to homepage"}
          <span className="opacity-50 tabular-nums">({count})</span>
        </button>
      </div>
      </div>
    </div>
  );
}
