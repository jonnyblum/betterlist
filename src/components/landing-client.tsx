"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignInModal } from "@/components/sign-in-modal";
import { BrandMarquee, type Specialty } from "@/components/brand-marquee";

interface CardProduct {
  emoji: string;
  brand: string;
  name: string;
  price: string;
  originalPrice?: string;
  bg: string;
}

const CARD_PRODUCTS: Record<Specialty, CardProduct[]> = {
  All: [
    { emoji: "💊", brand: "Garden of Life", name: "Magnesium Glycinate", price: "$22.99", originalPrice: "$29.99", bg: "bg-sky-50" },
    { emoji: "☀️", brand: "Thorne", name: "Vitamin D3 + K2", price: "$18.99", bg: "bg-peach-50" },
    { emoji: "🐟", brand: "Nordic Naturals", name: "Omega-3 Fish Oil", price: "$28.99", originalPrice: "$34.99", bg: "bg-sage-50" },
    { emoji: "🦷", brand: "Burst", name: "Sonic Electric Toothbrush", price: "$49.99", bg: "bg-sage-50" },
  ],
  Dermatology: [
    { emoji: "🧴", brand: "CeraVe", name: "Moisturizing Cream", price: "$16.97", bg: "bg-sage-50" },
    { emoji: "☀️", brand: "EltaMD", name: "UV Clear SPF 46", price: "$37.00", originalPrice: "$42.00", bg: "bg-peach-50" },
    { emoji: "💊", brand: "Nordic Naturals", name: "Omega-3 Fish Oil", price: "$28.99", originalPrice: "$34.99", bg: "bg-sky-50" },
    { emoji: "📱", brand: "Calm", name: "Meditation & Sleep App", price: "Free", bg: "bg-sage-50" },
  ],
  Dental: [
    { emoji: "🪥", brand: "Oral-B", name: "Pro 1000 Electric Toothbrush", price: "$49.99", originalPrice: "$59.99", bg: "bg-sage-50" },
    { emoji: "🦷", brand: "Sensodyne", name: "Pronamel Toothpaste", price: "$9.97", bg: "bg-sky-50" },
    { emoji: "🚿", brand: "Waterpik", name: "Aquarius Water Flosser", price: "$54.00", bg: "bg-peach-50" },
    { emoji: "💊", brand: "Nordic Naturals", name: "Omega-3 Fish Oil", price: "$28.99", originalPrice: "$34.99", bg: "bg-sage-50" },
  ],
  Cardiology: [
    { emoji: "⌚", brand: "Withings", name: "ScanWatch 2", price: "$299.00", bg: "bg-sage-50" },
    { emoji: "🫀", brand: "OMRON", name: "Platinum BP Monitor", price: "$74.00", originalPrice: "$89.99", bg: "bg-peach-50" },
    { emoji: "💊", brand: "Nordic Naturals", name: "Omega-3 Fish Oil", price: "$28.99", originalPrice: "$34.99", bg: "bg-sky-50" },
    { emoji: "📱", brand: "MyFitnessPal", name: "Nutrition Tracker", price: "Free", bg: "bg-peach-50" },
  ],
  "Primary": [
    { emoji: "💊", brand: "Thorne", name: "Vitamin D3", price: "$18.99", bg: "bg-sage-50" },
    { emoji: "🌿", brand: "Garden of Life", name: "Probiotics", price: "$27.00", originalPrice: "$35.00", bg: "bg-peach-50" },
    { emoji: "⌚", brand: "Garmin", name: "Forerunner 265", price: "$349.99", bg: "bg-sky-50" },
    { emoji: "📱", brand: "Noom", name: "Weight Management", price: "Free", bg: "bg-sage-50" },
  ],
};

export function LandingClient() {
  const router = useRouter();
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Specialty>("All");
  const [displayedTab, setDisplayedTab] = useState<Specialty>("All");
  const [contentOpacity, setContentOpacity] = useState(1);

  function handleTabChange(tab: Specialty) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setContentOpacity(0);
    setTimeout(() => {
      setDisplayedTab(tab);
      setContentOpacity(1);
    }, 200);
  }

  const chip1Ref = useRef<HTMLDivElement>(null);
  const chip2Ref = useRef<HTMLDivElement>(null);
  const chip3Ref = useRef<HTMLDivElement>(null);
  const chip4Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;

      if (chip2Ref.current) chip2Ref.current.style.transform = `translateY(${y * -0.06}px)`;
      if (chip3Ref.current) chip3Ref.current.style.transform = `translateY(${y * -0.03}px)`;
      if (chip4Ref.current) chip4Ref.current.style.transform = `translateY(${y * -0.04}px)`;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background blobs */}
      <div className="glass-blob w-[700px] h-[700px] bg-sage -top-52 -left-72" />
      <div className="glass-blob w-[550px] h-[550px] bg-peach -bottom-32 -right-32" />
      <div className="glass-blob w-[450px] h-[450px] bg-sky top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/2" />

      {/* Nav */}
      <nav className="relative z-20 bg-background/80 backdrop-blur-md border-b border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg leading-none">💊</span>
            <span className="font-semibold text-sm text-foreground">BetterList</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/sign-in")}
              className="text-sm text-[#777] hover:text-[#333] transition-colors font-medium"
            >
              Log in
            </button>
            <button
              onClick={() => setSignInModalOpen(true)}
              className="text-sm font-semibold bg-foreground text-white px-3.5 py-1.5 rounded-lg hover:bg-[#333] transition-all"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-10 lg:pt-15 lg:pb-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

          {/* Left: Copy + CTA */}
          <div className="flex-1 max-w-xl text-center lg:text-left">
            <div className="flex items-center gap-2 justify-center lg:justify-start mb-7">
              <div className="inline-flex items-center gap-2 bg-white/70 border border-black/[0.08] backdrop-blur-sm px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block" />
                All specialties

              </div>
              <div className="inline-flex items-center gap-2 bg-white/70 border border-black/[0.08] backdrop-blur-sm px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-sky inline-block" />
                HIPAA compliant
              </div>
            </div>

            <h1 className="text-[38px] sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight leading-[1.06] mb-6 text-balance">
              Recommendations<br className="hidden sm:block" /> in seconds.
            </h1>

            <p className="text-[17px] sm:text-lg text-muted leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
              <span className="sm:hidden">Send patients one link to exactly what you recommend, at the best price, instantly. Better outcomes, no extra work.</span><span className="hidden sm:inline">Send patients one link to exactly what you recommend, instantly. We make sure it's the best price for them. Better outcomes, no extra work.</span>
             
              {/* Send patients a shoppable link to what you recommend, instantly. We'll make sure it's the best price for them. Better outcomes, no extra work.
              Send patients a shoppable link to exactly what you recommend, instantly. We’ll make sure it’s the best price. Better outcomes, no extra work.
             */}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <button
                onClick={() => router.push("/builder")}
                className="inline-flex items-center gap-2.5 bg-foreground text-white px-7 py-3.5 rounded-xl text-base font-semibold hover:bg-[#333] transition-all hover:-translate-y-px shadow-lg shadow-black/10"
              >
                {/* Browse catalog */}
                Start now
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              { <span className="text-sm text-muted">Free. No signup required.</span> }
            </div>
          </div>

          {/* Right: Mockup card */}
          <div className="flex-1 w-full flex justify-center lg:justify-end items-center">
            <div className="relative" style={{ padding: "48px 56px" }}>

              {/* Floating element 1: iMessage bubble — top left, above card */}
              <div ref={chip1Ref} className="absolute z-[1]" style={{ top: -22, left: -10 }}>
                <div>
                  <p className="text-[10px] text-muted font-medium mb-1 ml-3">BetterList</p>
                  <div className="relative">
                    <div className="bg-[#E5E5EA] rounded-2xl rounded-bl-sm px-3.5 shadow-lg whitespace-nowrap" style={{ paddingTop: 14, paddingBottom: 14 }}>
                      <p className="text-xs font-medium text-[#1C1C1E]">You received a recommendation</p>
                      <p className="text-[10px] text-[#8E8E93] mt-0.5">keystonehealth.com/r/sc-a8x2</p>
                    </div>
                    {/* iMessage tail */}
                    <div style={{
                      position: "absolute",
                      bottom: 0,
                      left: -5,
                      width: 10,
                      height: 10,
                      backgroundColor: "#E5E5EA",
                      clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                    }} />
                  </div>
                </div>
              </div>

              {/* Floating chip 2: Best price found — top right */}
              {/* <div ref={chip2Ref} className="absolute top-10 right-0 z-[3]">
                <div className="bg-white/90 backdrop-blur-sm border border-black/[0.06] rounded-2xl px-3.5 py-2 shadow-lg flex items-center gap-2 whitespace-nowrap" style={{ animation: "chipFloat 4s ease-in-out infinite" }}>
                 <span className="text-sage text-xs font-bold">✓</span>
                  <span className="text-xs font-semibold text-foreground">HSA eligible</span>
                </div>
              </div> */}

              {/* Floating chip 3: HSA eligible — mid right, between rows 3 and 4 */}
              <div ref={chip3Ref} className="absolute z-[3]" style={{ top: 173, right: -10 }}>
                <div className="bg-white/90 backdrop-blur-sm border border-black/[0.06] rounded-2xl px-3.5 py-2 shadow-lg flex items-center gap-2 whitespace-nowrap" style={{ animation: "chipFloat 5s ease-in-out infinite 0.9s" }}>
                  <span className="text-lg leading-none">🏷️</span>
                  <span className="text-xs font-semibold text-foreground">Best price found</span>
                 </div>
              </div>

              {/* Floating chip 4: Sent in seconds — bottom left, unchanged */}
              <div ref={chip4Ref} className="absolute bottom-5 left-2 z-[3]">
                <div className="bg-white/90 backdrop-blur-sm border border-black/[0.06] rounded-2xl px-3.5 py-2 shadow-lg flex items-center gap-2 whitespace-nowrap" style={{ animation: "chipFloat 4.5s ease-in-out infinite 1.7s" }}>
                  <span className="text-lg leading-none">⚡</span>
                  <span className="text-xs font-semibold text-foreground">Sent in seconds</span>
                </div>
              </div>

              {/* The recommendation card */}
              <div className="relative z-[2] bg-white rounded-3xl shadow-2xl border border-black/[0.06] overflow-hidden w-80">
                {/* Doctor header */}
                <div className="px-5 py-4 border-b border-black/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sage-100 flex items-center justify-center text-sage-700 font-bold text-sm flex-shrink-0">
                      SC
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground leading-tight">Dr. Sarah Chen recommends</p>
                      <p className="text-[11px] text-muted mt-0.5">4 products · for you personally</p>
                    </div>
                  </div>
                </div>

                {/* Product rows */}
                <div className="divide-y divide-black/[0.04]" style={{ opacity: contentOpacity, transition: "opacity 200ms ease" }}>
                  {CARD_PRODUCTS[displayedTab].map((p) => (
                    <div key={p.name} className="flex items-center gap-3 px-5 py-3">
                      <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center text-lg flex-shrink-0`}>
                        {p.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted truncate">{p.brand}</p>
                        <p className="text-sm font-medium text-foreground truncate leading-tight">{p.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {p.originalPrice && (
                          <span className="text-[11px] text-muted line-through">{p.originalPrice}</span>
                        )}
                        <span className="text-sm font-bold text-foreground">{p.price}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="px-5 py-4">
                  <div className="w-full bg-[#4A4A4A] text-white rounded-xl py-3 text-sm font-semibold text-center cursor-default">
                    View all & order →
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <BrandMarquee
        activeTab={activeTab}
        displayedTab={displayedTab}
        contentOpacity={contentOpacity}
        onTabChange={handleTabChange}
      />

      {/* Sign-in modal */}
      {signInModalOpen && (
        <SignInModal
          onClose={() => setSignInModalOpen(false)}
          onSuccess={() => {
            setSignInModalOpen(false);
            router.push("/builder");
          }}
        />
      )}
    </div>
  );
}
