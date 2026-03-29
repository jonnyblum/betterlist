import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BetterList — Recommended Products",
    template: "%s | BetterList",
  },
  description:
    "Your doctor's curated product recommendations, delivered to you personally.",
  keywords: ["doctor recommendations", "medical products", "healthcare", "supplements"],
  authors: [{ name: "BetterList" }],
  openGraph: {
    type: "website",
    siteName: "BetterList",
    title: "BetterList — Recommended Products",
    description: "Your doctor's curated product recommendations.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FAF9F7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
