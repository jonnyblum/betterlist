"use client";

import { useState } from "react";
import Link from "next/link";
import { SignInModal } from "@/components/sign-in-modal";

// ─── Avatar color palette (matches recommendation-receipt.tsx) ─────────────────

const AVATAR_PALETTE = [
  { bg: "rgba(135,168,120,0.16)", text: "#3a6b2f", pillBg: "rgba(135,168,120,0.11)" },
  { bg: "rgba(110,175,210,0.18)", text: "#1e6f95", pillBg: "rgba(110,175,210,0.11)" },
  { bg: "rgba(240,162,125,0.18)", text: "#a84f25", pillBg: "rgba(240,162,125,0.11)" },
  { bg: "rgba(172,148,218,0.18)", text: "#5c38a0", pillBg: "rgba(172,148,218,0.11)" },
  { bg: "rgba(242,204,80,0.22)",  text: "#8a6600", pillBg: "rgba(242,204,80,0.14)"  },
  { bg: "rgba(238,108,100,0.15)", text: "#a82420", pillBg: "rgba(238,108,100,0.10)" },
  { bg: "rgba(100,188,155,0.18)", text: "#26775a", pillBg: "rgba(100,188,155,0.11)" },
  { bg: "rgba(212,145,182,0.18)", text: "#88226a", pillBg: "rgba(212,145,182,0.11)" },
];

function getDoctorColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

interface StorefrontHeaderProps {
  displayName: string;
  specialty?: string | null;
  practiceName?: string | null;
  storefrontUrl: string;
  /** Hide the share button (e.g. on demo pages for signed-out users) */
  hideShare?: boolean;
  /** If set, renders the demo specialty switcher + notice inside the header */
  demoSpecialties?: readonly string[];
  /** The currently active specialty on the demo page */
  demoActiveSpecialty?: string;
}

export function StorefrontHeader({
  displayName,
  specialty,
  practiceName,
  storefrontUrl,
  hideShare = false,
  demoSpecialties,
  demoActiveSpecialty,
}: StorefrontHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const color = getDoctorColor(displayName);

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(storefrontUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text from a temporary input
      const input = document.createElement("input");
      input.value = storefrontUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="bg-white border-b border-black/[0.06] px-4 sm:px-6 py-8">
      <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
        {/* Left: avatar + info */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0"
            style={{ background: color.bg, color: color.text }}
          >
            {initials}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
              {displayName}
            </h1>

            {(specialty || practiceName) && !demoSpecialties && (
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {specialty && (
                  <span
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                    style={{ background: color.pillBg, color: color.text }}
                  >
                    {specialty}
                  </span>
                )}
                {practiceName && (
                  <span className="text-sm text-muted">{practiceName}</span>
                )}
              </div>
            )}

            <p className="text-sm text-muted mt-1.5">
              Products I recommend to my patients
            </p>

            {demoSpecialties && demoSpecialties.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[#999] font-medium">Previewing as:</span>
                  {demoSpecialties.map((s) => {
                    const isActive = s === demoActiveSpecialty;
                    return (
                      <Link
                        key={s}
                        href={`/store?specialty=${encodeURIComponent(s)}`}
                        className={[
                          "px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all",
                          isActive ? "" : "bg-black/[0.06] text-muted hover:text-foreground hover:bg-black/[0.1]",
                        ].join(" ")}
                        style={isActive ? { background: color.pillBg, color: color.text } : undefined}
                      >
                        {s}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: demo notice + share button */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {demoSpecialties && (
            <p className="text-[11px] text-[#aaa] text-right hidden sm:block">
              This is a sample storefront.{" "}
              <button
                onClick={() => setSignInModalOpen(true)}
                className="text-foreground font-medium hover:underline underline-offset-2"
              >
                Create yours free →
              </button>
            </p>
          )}
          {signInModalOpen && (
            <SignInModal
              onClose={() => setSignInModalOpen(false)}
              onSuccess={() => setSignInModalOpen(false)}
            />
          )}
          {!hideShare && <button
          onClick={handleShare}
          title="Copy storefront link"
          className={[
            "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
            copied
              ? "bg-sage-100 text-sage-700"
              : "bg-white border border-[rgba(0,0,0,0.08)] text-muted hover:text-foreground hover:border-foreground/20",
          ].join(" ")}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="hidden sm:block">Copied</span>
            </>
          ) : (
            <>
              {/* Share icon */}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:block">Share</span>
            </>
          )}
        </button>}
        </div>
      </div>
    </div>
  );
}
