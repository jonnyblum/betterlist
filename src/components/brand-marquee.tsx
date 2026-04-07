"use client";

import { useRef } from "react";

export type Specialty = "All" | "Dermatology" | "Dental" | "Cardiology" | "Primary";

export const SPECIALTY_TABS: Specialty[] = ["All", "Dermatology", "Dental", "Cardiology", "Primary"];

const BRANDS: Record<Specialty, string[]> = {
  All: ["CeraVe", "La Roche-Posay", "Nordic Naturals", "OMRON", "Philips", "Oral-B", "Waterpik", "Vital Proteins", "Nature Made", "Neutrogena", "Calm", "Whoop", "Oura", "Fitbit", "Garmin", "Goli", "Thorne", "Sensodyne", "Colgate", "AliveCor", "Withings", "Aveeno", "Garden of Life", "Ritual"],
  Dermatology: ["CeraVe", "La Roche-Posay", "EltaMD", "Neutrogena", "Vital Proteins", "Calm", "Nordic Naturals", "Nature Made", "Oura", "Aveeno", "Vanicream", "SkinCeuticals", "Differin", "Bioderma", "The Ordinary", "Eucerin"],
  Dental: ["Oral-B", "Waterpik", "Philips", "Crest", "Listerine", "Calm", "Strava", "Fitbit", "Colgate", "Sensodyne", "Quip", "TheraBreath", "ACT"],
  Cardiology: ["OMRON", "Nordic Naturals", "Nature Made", "Innovo", "Whoop", "Garmin", "Oura", "Calm", "MyFitnessPal", "AliveCor", "Withings", "Polar", "Qunol"],
  "Primary": ["Nature Made", "Nordic Naturals", "Vital Proteins", "OMRON", "Calm", "Headspace", "MyFitnessPal", "Noom", "Garmin", "Whoop", "Thorne", "Garden of Life", "Ritual", "NOW Foods", "Centrum"],
};

const MASK_H = "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)";
const MASK_V = "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)";

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 6;

interface BrandMarqueeProps {
  activeTab: Specialty;
  displayedTab: Specialty;
  contentOpacity: number;
  onTabChange: (tab: Specialty) => void;
}

export function BrandMarquee({ activeTab, displayedTab, contentOpacity, onTabChange }: BrandMarqueeProps) {
  const marqueeHRef = useRef<HTMLDivElement>(null);

  function handleMouseEnter() {
    if (marqueeHRef.current) marqueeHRef.current.style.animationPlayState = "paused";
  }

  function handleMouseLeave() {
    if (marqueeHRef.current) marqueeHRef.current.style.animationPlayState = "running";
  }

  const brands = BRANDS[displayedTab];
  const itemsH = [...brands, ...brands];
  const itemsV = [...brands, ...brands];
  const verticalDuration = `${Math.max(brands.length * 1.5, 10)}s`;

  return (
    <div className="pt-0 sm:pt-4 pb-10">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header row */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap gap-y-3">
          <span className="text-[18px] sm:text-[15px] font-semibold text-foreground sm:text-muted sm:font-medium">We find your favorite brands</span>

          {/* Specialty tabs */}
          <div className="flex items-center gap-0 sm:gap-1 flex-wrap">
            {SPECIALTY_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={[
                  "text-[12px] px-2 py-1 sm:px-2.5 rounded-full transition-all",
                  activeTab === tab
                    ? "bg-[#EBEBEB] text-foreground font-medium"
                    : "text-muted hover:text-foreground",
                ].join(" ")}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Desktop: horizontal marquee ── */}
        <div
          className="hidden sm:block overflow-hidden"
          style={{ maskImage: MASK_H, WebkitMaskImage: MASK_H }}
        >
          <div
            ref={marqueeHRef}
            style={{
              display: "flex",
              width: "max-content",
              animation: "marqueeScroll 35s linear infinite",
              opacity: contentOpacity,
              transition: "opacity 200ms ease",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {itemsH.map((brand, i) => (
              <span key={i} className="inline-flex items-center whitespace-nowrap">
                <span className="text-[14px] font-normal" style={{ color: "#AAAAAA" }}>{brand}</span>
                <span className="mx-5 text-[14px]" style={{ color: "#CCCCCC" }}>·</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Mobile: vertical marquee ── */}
        <div
          className="block sm:hidden overflow-hidden"
          style={{
            height: ITEM_HEIGHT * VISIBLE_ITEMS,
            maskImage: MASK_V,
            WebkitMaskImage: MASK_V,
          }}
        >
          <div
            style={{
              animation: `marqueeScrollVertical ${verticalDuration} linear infinite`,
              opacity: contentOpacity,
              transition: "opacity 200ms ease",
            }}
          >
            {itemsV.map((brand, i) => (
              <div key={i} className="flex items-center" style={{ height: ITEM_HEIGHT }}>
                <span className="text-[15px] font-normal" style={{ color: "#AAAAAA" }}>{brand}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
