"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  avatarUrl?: string | null;
  /** Hide the share button (e.g. on demo pages for signed-out users) */
  hideShare?: boolean;
  /** If set, renders the demo specialty switcher + notice inside the header */
  demoSpecialties?: readonly string[];
  /** The currently active specialty on the demo page */
  demoActiveSpecialty?: string;
  /** If true, show edit controls on hover (owner viewing their own storefront) */
  isOwner?: boolean;
  /** Initial publish state — only relevant when isOwner is true */
  storefrontEnabled?: boolean;
}

export function StorefrontHeader({
  displayName: initialDisplayName,
  specialty,
  practiceName,
  storefrontUrl,
  avatarUrl: initialAvatarUrl,
  hideShare = false,
  demoSpecialties,
  demoActiveSpecialty,
  isOwner = false,
  storefrontEnabled: initialStorefrontEnabled = true,
}: StorefrontHeaderProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  // Share dropdown (owner only)
  const [shareOpen, setShareOpen] = useState(false);
  const [isPublished, setIsPublished] = useState(initialStorefrontEnabled);
  const [publishLoading, setPublishLoading] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Local optimistic state so the header updates immediately after save
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? null);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(initialDisplayName);
  const [editAvatarUrl, setEditAvatarUrl] = useState(initialAvatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Resize + compress to max 256px via canvas before storing as data URL
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 256;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setEditAvatarUrl(canvas.toDataURL("image/jpeg", 0.85));
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  }

  async function handleSave() {
    if (!editName.trim()) { setSaveError("Name can't be empty."); return; }
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: editName.trim(), avatarUrl: editAvatarUrl }),
      });
      if (!res.ok) { setSaveError("Failed to save. Please try again."); return; }
      // Optimistic update
      setDisplayName(editName.trim());
      setAvatarUrl(editAvatarUrl);
      setEditOpen(false);
      router.refresh();
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function openEdit() {
    setEditName(displayName);
    setEditAvatarUrl(avatarUrl);
    setSaveError("");
    setEditOpen(true);
  }

  return (
    <>
      <div className="bg-white border-b border-black/[0.06] px-4 sm:px-6 lg:px-16 py-8">
        <div className="max-w-[1100px] mx-auto flex items-start justify-between gap-4">
          {/* Left: avatar + info */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {isOwner ? (
              <button
                onClick={openEdit}
                className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex-shrink-0 overflow-hidden"
                title="Edit profile photo"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-lg sm:text-xl font-bold"
                    style={{ background: color.bg, color: color.text }}
                  >
                    {initials}
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </button>
            ) : (
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0 overflow-hidden"
                style={avatarUrl ? undefined : { background: color.bg, color: color.text }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : initials}
              </div>
            )}

            {/* Info */}
            <div>
              {isOwner ? (
                <button
                  onClick={openEdit}
                  className="group flex items-center gap-1.5 text-left"
                  title="Edit name"
                >
                  <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight group-hover:underline underline-offset-2">
                    {displayName}
                  </h1>
                  <svg className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                  </svg>
                </button>
              ) : (
                <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                  {displayName}
                </h1>
              )}

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
                  Create yours for free →
                </button>
              </p>
            )}
            {signInModalOpen && (
              <SignInModal
                onClose={() => setSignInModalOpen(false)}
                onSuccess={() => setSignInModalOpen(false)}
              />
            )}
            {!hideShare && (
              isOwner ? (
                /* Owner: Share button → dropdown */
                <div className="relative" ref={shareRef}>
                  <button
                    onClick={async () => {
                      if (!isPublished) {
                        // Publish and open dropdown so user sees the result
                        setPublishLoading(true);
                        try {
                          await fetch("/api/profile", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ storefrontEnabled: true }),
                          });
                          setIsPublished(true);
                          setShareOpen(true);
                          router.refresh();
                        } finally {
                          setPublishLoading(false);
                        }
                      } else {
                        setShareOpen((o) => !o);
                      }
                    }}
                    disabled={publishLoading}
                    className={[
                      "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border disabled:opacity-50",
                      isPublished
                        ? "bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100"
                        : "bg-white border-[rgba(0,0,0,0.08)] text-muted hover:text-foreground hover:border-foreground/20",
                    ].join(" ")}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="hidden sm:block">
                      {publishLoading ? "…" : isPublished ? "Published" : "Unpublished"}
                    </span>
                  </button>

                  {shareOpen && (
                    <>
                      {/* Click-away */}
                      <div className="fixed inset-0 z-40" onClick={() => setShareOpen(false)} />
                      <div className="absolute right-0 top-10 z-50 w-72 bg-white rounded-2xl shadow-xl border border-[rgba(0,0,0,0.07)] p-4 flex flex-col gap-3">
                        {/* URL display */}
                        <div className="bg-black/[0.03] rounded-xl px-3 py-2">
                          <p className="text-xs text-muted font-mono truncate">
                            {storefrontUrl.replace(/^https?:\/\//, "")}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              setPublishLoading(true);
                              try {
                                await fetch("/api/profile", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ storefrontEnabled: !isPublished }),
                                });
                                setIsPublished((p) => !p);
                                router.refresh();
                              } finally {
                                setPublishLoading(false);
                              }
                            }}
                            disabled={publishLoading}
                            className="flex-1 py-2 px-3 rounded-xl border border-[rgba(0,0,0,0.12)] text-xs font-semibold text-foreground hover:bg-black/[0.03] transition-all disabled:opacity-50"
                          >
                            {publishLoading ? "…" : isPublished ? "Unpublish" : "Publish"}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(storefrontUrl).catch(() => {
                                const input = document.createElement("input");
                                input.value = storefrontUrl;
                                document.body.appendChild(input);
                                input.select();
                                document.execCommand("copy");
                                document.body.removeChild(input);
                              });
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-foreground text-white text-xs font-semibold hover:bg-[#222] transition-all"
                          >
                            {copied ? "Copied!" : "Copy link"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Non-owner: plain share button */
                <button
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
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span className="hidden sm:block">Share</span>
                    </>
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Edit profile modal */}
      {editOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setEditOpen(false)} />
          <div
            className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-xl border border-[rgba(0,0,0,0.06)] p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setEditOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#bbb] hover:text-[#666] hover:bg-black/[0.04] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-foreground mb-6">Edit profile</h2>

            {/* Avatar upload */}
            <div className="flex flex-col items-center mb-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-20 h-20 rounded-2xl overflow-hidden mb-2"
                title="Upload photo"
              >
                {editAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editAvatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-2xl font-bold"
                    style={{ background: color.bg, color: color.text }}
                  >
                    {editName.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("")}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-muted hover:text-foreground transition-colors font-medium"
                >
                  Upload photo
                </button>
                {editAvatarUrl && (
                  <>
                    <span className="text-[#ddd]">·</span>
                    <button
                      onClick={() => setEditAvatarUrl(null)}
                      className="text-xs text-muted hover:text-red-500 transition-colors font-medium"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Name input */}
            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-xs font-medium text-muted">Display name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Dr. Jane Smith, MD"
                autoFocus
                className="w-full border border-[rgba(0,0,0,0.12)] rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-[#ccc] focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40"
              />
              <p className="text-[11px] text-muted">Update your name and credentials (MD, DO, DDS, etc) here.</p>
            </div>

            {/* Storefront URL */}
            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-xs font-medium text-muted">Storefront URL</label>
              <div className="flex items-center gap-2 border border-[rgba(0,0,0,0.12)] rounded-xl px-3.5 py-2.5">
                <span className="text-sm text-[#bbb] flex-1 truncate select-none">{storefrontUrl.replace(/^https?:\/\//, "")}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(storefrontUrl).catch(() => {
                      const input = document.createElement("input");
                      input.value = storefrontUrl;
                      document.body.appendChild(input);
                      input.select();
                      document.execCommand("copy");
                      document.body.removeChild(input);
                    });
                    setUrlCopied(true);
                    setTimeout(() => setUrlCopied(false), 2000);
                  }}
                  className="flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-foreground transition-colors"
                >
                  {urlCopied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="9" y="9" width="13" height="13" rx="2" strokeLinejoin="round" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted">Custom URL coming soon.</p>
            </div>

            {saveError && <p className="text-sm text-red-500 mb-3">{saveError}</p>}

            <button
              onClick={handleSave}
              disabled={saving || !editName.trim()}
              className="w-full bg-foreground text-white rounded-xl py-3 px-5 text-sm font-semibold hover:bg-[#222] transition-colors disabled:opacity-40 flex items-center justify-between"
            >
              <span>{saving ? "Saving…" : "Save changes"}</span>
              {!saving && <span className="opacity-60">→</span>}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
