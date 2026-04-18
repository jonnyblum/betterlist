import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "BetterList — Recommended Products";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [interRegular, interSemiBold] = await Promise.all([
    readFile(join(process.cwd(), "src/app/fonts/Inter-Regular.ttf")),
    readFile(join(process.cwd(), "src/app/fonts/Inter-SemiBold.ttf")),
  ]);

  const pills = [
    { label: "Supplements", bg: "rgba(135, 168, 120, 0.18)", color: "#4a7a3a" },
    { label: "Skincare", bg: "rgba(232, 168, 124, 0.2)", color: "#a05a2c" },
    { label: "Dental", bg: "rgba(125, 185, 212, 0.2)", color: "#2a7a9a" },
    { label: "Fitness", bg: "rgba(135, 168, 120, 0.18)", color: "#4a7a3a" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#FAF9F7",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background blobs */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            left: "-120px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "rgba(135, 168, 120, 0.18)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-130px",
            right: "-80px",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            background: "rgba(125, 185, 212, 0.18)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "160px",
            right: "80px",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background: "rgba(232, 168, 124, 0.15)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            position: "relative",
          }}
        >
          {/* Pill capsule icon */}
          <div
            style={{
              width: "80px",
              height: "36px",
              borderRadius: "100px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "row",
              border: "2.5px solid rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ flex: 1, background: "#87A878", display: "flex" }} />
            <div style={{ flex: 1, background: "#7DB9D4", display: "flex" }} />
          </div>

          {/* Wordmark */}
          <div
            style={{
              fontSize: "76px",
              fontWeight: "600",
              color: "#1a1a1a",
              letterSpacing: "-3px",
              lineHeight: 1,
            }}
          >
            Betterlist
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "26px",
              color: "#6b7280",
              fontWeight: "400",
              letterSpacing: "-0.3px",
              lineHeight: 1.4,
            }}
          >
            Your doctor&apos;s curated product recommendations
          </div>

          {/* Pills */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "6px",
            }}
          >
            {pills.map(({ label, bg, color }) => (
              <div
                key={label}
                style={{
                  padding: "9px 22px",
                  borderRadius: "100px",
                  background: bg,
                  fontSize: "19px",
                  color,
                  fontWeight: "500",
                  letterSpacing: "-0.2px",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: interRegular, weight: 400 },
        { name: "Inter", data: interSemiBold, weight: 600 },
      ],
    }
  );
}
