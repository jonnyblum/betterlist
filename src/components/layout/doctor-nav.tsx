"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { SignInModal } from "@/components/sign-in-modal";

interface DoctorNavProps {
  session: Session | null;
  practiceSlug?: string;
  /** The signed-in clinician's own slug, used to link to their storefront */
  clinicianSlug?: string;
  /** Hide the logo (e.g. on the /store demo page where the StorefrontHeader already brands the page) */
  hideLogo?: boolean;
}

export function DoctorNav({ session, practiceSlug, clinicianSlug, hideLogo = false }: DoctorNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const isSignedIn = !!session?.user;

  const storefrontHref = clinicianSlug ? `/${clinicianSlug}` : null;

  const navItems = [
        {
      href: storefrontHref ?? "/store",
      label: "Storefront",
      icon: (
        /* Store / shop icon */
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M3 10h18" strokeLinecap="round"/>
    <path d="M4 10l1-4h14l1 4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 10v9a2 2 0 002 2h10a2 2 0 002-2v-9" strokeLinecap="round"/>
    <path d="M9 21v-6h6v6" strokeLinecap="round"/>
  </svg>
      ),
      // Guests go to /store demo; signed-in clinicians go to their own storefront
      guestAllowed: true,
    },
    {
      href: "/builder",
      label: "Recommend",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ),
      guestAllowed: true,
    },
    {
      href: "/activity",
      label: "History",
      icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
      ),
      guestAllowed: false,
    },    
  ];

  const initials = session?.user?.name
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("") ?? "DR";

  return (
    <>
    <nav className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-black/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center">
        {/* Left: Logo */}
        <div className="flex-1 flex items-center">
          {!hideLogo && (
            <Link href={isSignedIn ? "/builder" : "/"} className="flex items-center gap-2">
              <span className="text-lg leading-none">💊</span>
              <span className="font-semibold text-sm hidden sm:block">BetterList</span>
              {practiceSlug && (
                <span className="text-muted text-sm hidden md:block">/ {practiceSlug}</span>
              )}
            </Link>
          )}
        </div>

        {/* Center: Nav items */}
        <div className="flex items-center gap-0.5">
          {navItems.map((item) => {
            const active =
              item.label === "Storefront"
                ? (clinicianSlug ? pathname === `/${clinicianSlug}` : pathname === "/store")
                : pathname === item.href;
            const disabled = !isSignedIn && !item.guestAllowed;
            return (
              <button
                key={item.label}
                onClick={() => {
                  if (disabled) {
                    setSignInModalOpen(true);
                  } else {
                    router.push(item.href);
                  }
                }}
                className={[
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all h-14",
                  active
                    ? "text-[#111] font-semibold after:absolute after:bottom-0 after:left-1 after:right-1 after:h-[1.5px] after:bg-[#555] after:rounded-t-full"
                    : "text-[#999] font-medium hover:text-[#555]",
                ].join(" ")}
              >
                <span className={active ? "opacity-100" : "opacity-50"}>
                  {item.icon}
                </span>
                <span className="hidden sm:block">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Auth area */}
        <div className="flex-1 flex items-center justify-end">
          {isSignedIn ? (
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 text-xs font-semibold hover:ring-2 hover:ring-black/10 transition-all"
              >
                {initials}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 w-44 bg-white rounded-2xl shadow-lg border border-black/[0.06] py-1.5 z-50">
                  <button
                    disabled
                    className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-[#bbb] cursor-default"
                  >
                    View profile
                    <span className="text-[10px] text-[#ccc] font-medium">Soon</span>
                  </button>
                  <div className="mx-3 my-1 border-t border-black/[0.06]" />
                  <button
                    onClick={() => signOut({ callbackUrl: "/sign-in" })}
                    className="w-full flex items-center px-3.5 py-2 text-sm text-foreground hover:bg-black/[0.04] transition-colors rounded-lg"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: single button */}
              <button
                onClick={() => setSignInModalOpen(true)}
                className="sm:hidden text-sm font-semibold bg-foreground text-white px-3.5 py-1.5 rounded-lg hover:bg-[#333] transition-colors"
              >
                Sign in
              </button>
              {/* Desktop: two buttons */}
              <div className="hidden sm:flex items-center gap-3">
                <button
                  onClick={() => router.push("/sign-in")}
                  className="text-sm text-[#777] hover:text-[#333] transition-colors font-medium"
                >
                  Log in
                </button>
                <button
                  onClick={() => setSignInModalOpen(true)}
                  className="text-sm font-semibold bg-foreground text-white px-3.5 py-1.5 rounded-lg hover:bg-[#333] transition-colors"
                >
                  Create account
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>

    {signInModalOpen && (
      <SignInModal
        onClose={() => setSignInModalOpen(false)}
        onSuccess={() => {
          setSignInModalOpen(false);
          router.refresh();
        }}
      />
    )}
    </>
  );
}
