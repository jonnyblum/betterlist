"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatPrice,
  formatDate,
  isValidEmail,
  isValidPhone,
  normalizePhone,
} from "@/lib/utils";
import type { RecommendationWithDetails } from "@/types";
import type { RetailerPriceData } from "@/lib/fulfillment";

// ─── Constants (mirrored from fulfillment.ts) ─────────────────────────────────

const AMAZON_FREE_SHIPPING_THRESHOLD = 25;
const FLAT_SHIPPING_RATE = 5.99;

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecommendationReceiptProps {
  recommendation: RecommendationWithDetails;
  /** All available retailer prices per product (Amazon + Walmart where available) */
  allPricesByProductId: Record<string, RetailerPriceData[]>;
  handlingFee: number;
  amazonAffiliateTag: string;
  initialPurchased: boolean;
}

// ─── Avatar color palette ─────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  { bg: "rgba(135,168,120,0.16)", text: "#3a6b2f", pillBg: "rgba(135,168,120,0.11)", gradTop: "rgba(135,168,120,0.10)" }, // sage
  { bg: "rgba(110,175,210,0.18)", text: "#1e6f95", pillBg: "rgba(110,175,210,0.11)", gradTop: "rgba(110,175,210,0.10)" }, // sky
  { bg: "rgba(240,162,125,0.18)", text: "#a84f25", pillBg: "rgba(240,162,125,0.11)", gradTop: "rgba(240,162,125,0.10)" }, // peach
  { bg: "rgba(172,148,218,0.18)", text: "#5c38a0", pillBg: "rgba(172,148,218,0.11)", gradTop: "rgba(172,148,218,0.10)" }, // lavender
  { bg: "rgba(242,204,80,0.22)",  text: "#8a6600", pillBg: "rgba(242,204,80,0.14)",  gradTop: "rgba(242,204,80,0.12)"  }, // warm yellow
  { bg: "rgba(238,108,100,0.15)", text: "#a82420", pillBg: "rgba(238,108,100,0.10)", gradTop: "rgba(238,108,100,0.08)" }, // coral
  { bg: "rgba(100,188,155,0.18)", text: "#26775a", pillBg: "rgba(100,188,155,0.11)", gradTop: "rgba(100,188,155,0.10)" }, // teal
  { bg: "rgba(212,145,182,0.18)", text: "#88226a", pillBg: "rgba(212,145,182,0.11)", gradTop: "rgba(212,145,182,0.10)" }, // rose
];

function getDoctorColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

// ─── Identifier normalization (phone or email matching) ───────────────────────

function normalizeIdentifier(id: string): string {
  const s = id.trim().toLowerCase();
  const digits = s.replace(/\D/g, "");
  // If it has enough digits to be a phone number, compare by last 10 digits
  if (digits.length >= 7) return digits.slice(-10);
  return s; // email
}

function identifierMatches(a: string, b: string): boolean {
  if (!a || !b) return false;
  return normalizeIdentifier(a) === normalizeIdentifier(b);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RecommendationReceipt({
  recommendation,
  allPricesByProductId,
  handlingFee,
  amazonAffiliateTag,
  initialPurchased,
}: RecommendationReceiptProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  // ── Purchase state ──
  const order = recommendation.order;
  const isPurchased =
    initialPurchased ||
    order?.status === "PAID" ||
    order?.status === "SHIPPED" ||
    order?.status === "DELIVERED";

  // ── Categorize items ──
  const physicalItems = recommendation.items.filter(
    (i) => i.product.fulfillmentType === "PHYSICAL"
  );
  const nonPhysicalItems = recommendation.items.filter(
    (i) => i.product.fulfillmentType !== "PHYSICAL"
  );
  const hasMix = physicalItems.length > 0 && nonPhysicalItems.length > 0;
  const isAllPhysical = nonPhysicalItems.length === 0 && physicalItems.length > 0;

  // ── Item selection state (all physical checked by default) ──
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    () => new Set(physicalItems.map((i) => i.product.id))
  );

  // ── UI state ──
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // ── Gate state ──
  const [gateVisible, setGateVisible] = useState(true);
  const [blurLifting, setBlurLifting] = useState(false);
  const [wrongIdentifier, setWrongIdentifier] = useState(false);

  function liftGate() {
    setWrongIdentifier(false);
    setBlurLifting(true);
    setTimeout(() => setGateVisible(false), 300);
  }

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setGateVisible(true);
      setBlurLifting(false);
      setWrongIdentifier(false);
      return;
    }
    // Authenticated — check if this user matches the recommendation's patient
    const pid = recommendation.patientIdentifier;
    if (!pid) { liftGate(); return; }
    const userPhone = session?.user?.phone ?? "";
    const userEmail = session?.user?.email ?? "";
    if (identifierMatches(pid, userPhone) || identifierMatches(pid, userEmail)) {
      liftGate();
    } else {
      setWrongIdentifier(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.phone, session?.user?.email]);

  // ── Auth state ──
  const [authTab, setAuthTab] = useState<"phone" | "email">("phone");
  const [phoneValue, setPhoneValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const doctor = recommendation.doctorProfile;
  const practice = doctor?.practice ?? null;
  const color = getDoctorColor(doctor?.displayName ?? "Anonymous");

  // ── Live total calculation ──
  const checkedPhysicalItems = physicalItems.filter((i) =>
    checkedItems.has(i.product.id)
  );
  const noneChecked = checkedPhysicalItems.length === 0;

  function getBestPrice(item: (typeof physicalItems)[number]): number {
    const prices = allPricesByProductId[item.product.id] ?? [];
    if (prices.length === 0) return item.product.price;
    return Math.min(...prices.map((p) => p.price));
  }

  const checkedSubtotal = checkedPhysicalItems.reduce(
    (sum, i) => sum + getBestPrice(i) * i.quantity,
    0
  );

  const shipping =
    checkedSubtotal > 0
      ? checkedSubtotal >= AMAZON_FREE_SHIPPING_THRESHOLD
        ? 0
        : FLAT_SHIPPING_RATE
      : 0;

  const docPickTotal = noneChecked ? 0 : checkedSubtotal + shipping + handlingFee;

  // ── Amazon cart URL (only if ALL checked items have an amazon entry with ASIN) ──
  const canShowAmazonCart =
    !noneChecked &&
    checkedPhysicalItems.every((i) => {
      const asinEntry = allPricesByProductId[i.product.id]?.find(
        (p) => p.retailer === "amazon"
      );
      return !!asinEntry?.retailerProductId;
    });

  const amazonCartUrl = canShowAmazonCart
    ? "https://www.amazon.com/gp/aws/cart/add.html?" +
      checkedPhysicalItems
        .map((item, idx) => {
          const asin = allPricesByProductId[item.product.id]?.find(
            (p) => p.retailer === "amazon"
          )?.retailerProductId;
          return `ASIN.${idx + 1}=${asin}&Qty.${idx + 1}=${item.quantity}`;
        })
        .join("&") +
      (amazonAffiliateTag ? `&tag=${amazonAffiliateTag}` : "")
    : null;

  // ── Checkout handler ──
  async function handleDocPickCheckout() {
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId: recommendation.id,
          selectedProductIds: [...checkedItems],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error ?? "Failed to start checkout.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutError("Something went wrong. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  // ── Auth handlers ──
  async function handlePhoneSend(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhone(phoneValue)) {
      setAuthError("Please enter a valid phone number.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    try {
      const normalized = normalizePhone(phoneValue);
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "Failed to send code.");
        return;
      }
      setOtpStep(true);
    } catch {
      setAuthError("Failed to send code. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setAuthError("Please enter the 6-digit code.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    try {
      const normalized = normalizePhone(phoneValue);
      const result = await signIn("phone-otp", {
        phone: normalized,
        code: otpCode,
        redirect: false,
      });
      if (result?.error) setAuthError("Invalid or expired code.");
    } catch {
      setAuthError("Verification failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(emailValue)) {
      setAuthError("Please enter a valid email.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    try {
      await signIn("resend", { email: emailValue, redirect: false });
      setEmailSent(true);
    } catch {
      setAuthError("Failed to send link. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Sub-renderers
  // ─────────────────────────────────────────────────────────────────────────────

  function ProductRow({
    item,
    showPrice,
  }: {
    item: (typeof recommendation.items)[number];
    showPrice: boolean;
  }) {
    const productId = item.product.id;
    const isChecked = checkedItems.has(productId);
    const prices = allPricesByProductId[productId] ?? [];
    const bestPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : item.product.price;
    const displayPrice = bestPrice * item.quantity;

    const isDigital = item.product.fulfillmentType === "DIGITAL";
    const isAffiliate = item.product.fulfillmentType === "AFFILIATE";
    const hasLink = !!item.product.affiliateUrl;
    const ctaLabel = item.product.ctaLabel ?? (isDigital ? "View" : "Shop");

    function toggleCheck() {
      setCheckedItems((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });
    }

    return (
      <div
        className={[
          "bg-white rounded-2xl border overflow-hidden transition-opacity",
          isChecked || !showPrice
            ? "border-[rgba(0,0,0,0.06)]"
            : "border-[rgba(0,0,0,0.04)] opacity-50",
        ].join(" ")}
      >
        {/* Main row — tappable to toggle when showPrice */}
        <div
          className="p-4 flex gap-3 items-start select-none"
          onClick={showPrice ? toggleCheck : undefined}
          role={showPrice ? "button" : undefined}
          style={showPrice ? { cursor: "pointer" } : undefined}
        >
          {/* Thumbnail */}
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
            {item.product.imageUrl ? (
              <Image
                src={item.product.imageUrl}
                alt={item.product.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-300">
                  {item.product.brand.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted">{item.product.brand}</p>
            <h3 className="font-semibold text-sm text-foreground leading-tight mt-0.5">
              {item.product.name}
            </h3>
            {item.product.description && (
              <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
                {item.product.description}
              </p>
            )}
            {item.quantity > 1 && (
              <div className="mt-1.5">
                <span className="text-xs text-muted">Qty: {item.quantity}</span>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col items-end justify-between flex-shrink-0 self-stretch">
            <div className="flex flex-col items-end gap-1.5">
              {/* Price — physical items */}
              {showPrice && (
                <span
                  className={[
                    "font-bold text-sm text-foreground transition-all duration-500",
                    !isAuthenticated ? "price-blur select-none" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {formatPrice(displayPrice)}
                </span>
              )}

              {/* Price — affiliate items with a fixed price */}
              {isAffiliate && item.product.price > 0 && (
                <span className="font-bold text-sm text-foreground">
                  {formatPrice(item.product.price)}
                </span>
              )}

              {/* CTA — digital / affiliate */}
              {(isDigital || isAffiliate) && hasLink && (
                <a
                  href={isAuthenticated ? item.product.affiliateUrl! : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    "inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
                    isAuthenticated
                      ? "border-foreground text-foreground hover:bg-foreground/5"
                      : "border-gray-200 text-gray-400 cursor-not-allowed select-none",
                  ].join(" ")}
                  onClick={!isAuthenticated ? (e) => e.preventDefault() : undefined}
                >
                  {!isAuthenticated && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1C8.676 1 6 3.676 6 7v1H4a1 1 0 00-1 1v13a1 1 0 001 1h16a1 1 0 001-1V9a1 1 0 00-1-1h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 110 4 2 2 0 010-4z" />
                    </svg>
                  )}
                  {ctaLabel}
                </a>
              )}
            </div>

            {/* Circle selection toggle — bottom right, physical items only */}
            {showPrice && (
              <div
                className={[
                  "w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all duration-150",
                  isChecked
                    ? "bg-[#87A878] border-[#87A878]"
                    : "bg-white border-gray-300",
                ].join(" ")}
              >
                {isChecked && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    );
  }

  function CheckoutBlock() {
    if (physicalItems.length === 0 || !isAuthenticated || isPurchased)
      return null;

    return (
      <div className="mt-3 space-y-3">
        {/* Best price + handling fee row */}
        {!noneChecked && (
          <div className="flex items-center justify-between text-xs text-muted">
            <span>We found you the best price ✓</span>
            <span>+ {formatPrice(handlingFee)} handling</span>
          </div>
        )}

        {/* Primary buy button */}
        <Button
          fullWidth
          size="lg"
          onClick={handleDocPickCheckout}
          loading={checkoutLoading}
          disabled={noneChecked}
          className={noneChecked ? "opacity-50 cursor-not-allowed" : ""}
        >
          {noneChecked
            ? "Select items you'd like to buy"
            : `Buy via BetterList — ${formatPrice(docPickTotal)}`}
        </Button>
        {checkoutError && (
          <p className="text-xs text-red-500 mt-1.5 text-center">
            {checkoutError}
          </p>
        )}

        {/* Amazon fallback — only if some items at Amazon have ASINs */}
        {amazonCartUrl && (
          <div className="text-center">
            <a
              href={amazonCartUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              or buy on Amazon →
            </a>
            {/* <p className="text-[11px] text-muted/60 mt-0.5">
              You&apos;ll need an account
            </p> */}
          </div>
        )}
      </div>
    );
  }

  function OrderConfirmation() {
    return (
      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">Your order is placed</p>
            <p className="text-xs text-muted mt-0.5">
              We&apos;ll send you updates as it ships
            </p>
          </div>
        </div>

        {order?.estimatedDelivery && (
          <p className="text-sm text-muted border-t border-[rgba(0,0,0,0.05)] pt-3 mt-3">
            Estimated delivery:{" "}
            <span className="font-medium text-foreground">
              {formatDate(order.estimatedDelivery.toString())}
            </span>
          </p>
        )}

        {order?.trackingUrl && (
          <a
            href={order.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-xs font-medium text-sky-600 hover:underline block"
          >
            Track your package →
          </a>
        )}

        <Link
          href="/dashboard"
          className="mt-3 text-xs font-medium text-muted hover:text-foreground transition-colors block"
        >
          View your orders →
        </Link>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Background blobs */}
      <div className="fixed glass-blob w-96 h-96 bg-sage top-[-120px] right-[-120px] opacity-30" />
      <div className="fixed glass-blob w-72 h-72 bg-sky bottom-20 left-[-80px] opacity-25" />
      <div className="fixed glass-blob w-64 h-64 bg-peach bottom-[-60px] right-[-60px] opacity-20" />

      <div className="max-w-lg mx-auto px-4 pt-8">

        {/* ── Doctor header ── */}
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-4">
            {doctor ? (
              <>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0"
                  style={{ background: color.bg, color: color.text }}
                >
                  {doctor.displayName
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  {practice && (
                    <p className="text-xs text-muted font-medium">{practice.name}</p>
                  )}
                  <h1 className="leading-snug mt-0.5">
                    <span className="font-bold text-lg text-foreground">{doctor.displayName}</span>{" "}
                    <span className="font-normal text-[15px] text-foreground/60"><span className="sm:hidden">has some recommendations</span><span className="hidden sm:inline">has some recommendations for you</span></span>
                  </h1>
                </div>
              </>
            ) : (
              <div>
                <h1 className="leading-snug">
                  <span className="font-normal text-[15px] text-foreground/60">Your provider has some recommendations for you</span>
                </h1>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {doctor?.specialty && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{ background: color.pillBg, color: color.text }}
              >
                {doctor.specialty}
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/[0.05] text-muted">
              {formatDate(recommendation.createdAt)}
            </span>
          </div>
        </div>

        {/* ── Order confirmation ── */}
        {isPurchased && <OrderConfirmation />}

        {/* ── Doctor's note ── */}
        {recommendation.note && (
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] p-4 mb-5">
            <p className="text-xs text-muted font-medium mb-1">
              {doctor ? "Note from your doctor" : "Note"}
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {recommendation.note}
            </p>
          </div>
        )}

        {/* ── Products count — always visible ── */}
        <h2 className="font-semibold text-foreground mb-3">
          {recommendation.items.length} product
          {recommendation.items.length !== 1 ? "s" : ""} recommended
        </h2>

        {/* ── Gated zone: real content + blur overlay + gate card ── */}
        <div className={["relative overflow-hidden", gateVisible ? "min-h-[62vh]" : ""].join(" ")}>

          {/* Real product content — always rendered */}
          <div>
            {hasMix ? (
              <>
                <div className="space-y-3">
                  {nonPhysicalItems.map((item) => (
                    <ProductRow key={item.id} item={item} showPrice={false} />
                  ))}
                </div>
                <p className="text-[11px] font-medium text-muted uppercase tracking-widest mt-7 mb-2">
                  Ships to you
                </p>
                <div className="space-y-3">
                  {physicalItems.map((item) => (
                    <ProductRow key={item.id} item={item} showPrice={true} />
                  ))}
                </div>
                {!isPurchased && <CheckoutBlock />}
              </>
            ) : isAllPhysical ? (
              <>
                <div className="space-y-3">
                  {physicalItems.map((item) => (
                    <ProductRow key={item.id} item={item} showPrice={true} />
                  ))}
                </div>
                {!isPurchased && <CheckoutBlock />}
              </>
            ) : (
              <div className="space-y-3">
                {nonPhysicalItems.map((item) => (
                  <ProductRow key={item.id} item={item} showPrice={false} />
                ))}
              </div>
            )}

            {isAuthenticated && (
              <div className="mt-14 text-center">
                <Link
                  href="/dashboard"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  View all of my recommendations ✦
                </Link>
              </div>
            )}
            <div className="h-8" />
          </div>

          {/* Blur overlay */}
          {gateVisible && (
            <div
              className="absolute z-10"
              style={{
                top: 0,
                bottom: 0,
                left: "calc(-50vw + 50%)",
                right: "calc(-50vw + 50%)",
                backdropFilter: "blur(3px)",
                WebkitBackdropFilter: "blur(3px)",
                backgroundColor: "rgba(255,255,255,0.18)",
                maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
                opacity: blurLifting ? 0 : 1,
                transition: "opacity 300ms ease",
                pointerEvents: blurLifting ? "none" : "auto",
              }}
            />
          )}

          {/* Gate card */}
          {gateVisible && !blurLifting && (
            <div className="absolute inset-0 z-20 flex justify-center pt-5 px-2 pointer-events-none">
              <div
                className="w-full max-w-[320px] bg-white rounded-2xl px-6 pt-6 pb-5 pointer-events-auto"
                style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)" }}
              >
                {wrongIdentifier ? (
                  /* Wrong identity card */
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                    </div>
                    <p className="font-bold text-[17px] text-foreground mb-1">Wrong account</p>
                    <p className="text-sm text-muted leading-relaxed mb-5">
                      This recommendation was sent to a different phone number or email. Try signing in with the right one.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        await signOut({ redirect: false });
                        setWrongIdentifier(false);
                        setPhoneValue("");
                        setEmailValue("");
                        setOtpStep(false);
                        setOtpCode("");
                        setAuthError("");
                        setAuthTab("phone");
                      }}
                      className="w-full py-3 rounded-full bg-foreground text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Try a different number →
                    </button>
                  </div>
                ) : (
                  /* Sign-in card */
                  <>
                    {/* Lock icon */}
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>

                    {authTab === "email" ? (
                      emailSent ? (
                        <div className="text-center">
                          <p className="font-bold text-[17px] text-foreground mb-1">Check your email</p>
                          <p className="text-sm text-muted leading-relaxed mb-4">
                            We sent a magic link to <strong>{emailValue}</strong>
                          </p>
                          <button
                            type="button"
                            onClick={() => { setEmailSent(false); setEmailValue(""); setAuthError(""); }}
                            className="text-sm text-muted hover:text-foreground transition-colors"
                          >
                            Use a different email
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="font-bold text-[17px] text-foreground mb-1 text-center">Sign in to view</p>
                          <p className="text-sm text-muted text-center leading-relaxed mb-5">
                            Enter your email to receive a magic link
                          </p>
                          <form onSubmit={handleEmailSubmit} className="space-y-3">
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              value={emailValue}
                              onChange={(e) => setEmailValue(e.target.value)}
                              error={authError}
                              autoComplete="email"
                            />
                            <Button type="submit" fullWidth loading={authLoading}>
                              Send link →
                            </Button>
                          </form>
                          <div className="text-center mt-4">
                            <button
                              type="button"
                              onClick={() => { setAuthTab("phone"); setAuthError(""); }}
                              className="text-sm text-muted hover:text-foreground transition-colors"
                            >
                              or use phone number →
                            </button>
                          </div>
                        </>
                      )
                    ) : otpStep ? (
                      <>
                        <p className="font-bold text-[17px] text-foreground mb-1 text-center">Enter your code</p>
                        <p className="text-sm text-muted text-center leading-relaxed mb-5">
                          We sent a 6-digit code to {phoneValue}
                        </p>
                        <form onSubmit={handleOtpVerify} className="space-y-3">
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            placeholder="000000"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                            error={authError}
                            className="text-center tracking-widest font-mono"
                            autoFocus
                          />
                          <Button type="submit" fullWidth loading={authLoading}>
                            Verify →
                          </Button>
                        </form>
                        <div className="text-center mt-4">
                          <button
                            type="button"
                            onClick={() => { setOtpStep(false); setOtpCode(""); setAuthError(""); }}
                            className="text-sm text-muted hover:text-foreground transition-colors"
                          >
                            ← back
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-[17px] text-foreground mb-1 text-center">Sign in to view</p>
                        <p className="text-sm text-muted text-center leading-relaxed mb-5">
                          Verify your phone number to view details.
                        </p>
                        <form onSubmit={handlePhoneSend} className="space-y-3">
                          <Input
                            type="tel"
                            placeholder="+1 (201) 555-0123"
                            value={phoneValue}
                            onChange={(e) => setPhoneValue(e.target.value)}
                            error={authError}
                            autoComplete="tel"
                          />
                          <Button type="submit" fullWidth loading={authLoading}>
                            Send code →
                          </Button>
                        </form>
                        <div className="text-center mt-4">
                          <button
                            type="button"
                            onClick={() => { setAuthTab("email"); setAuthError(""); }}
                            className="text-sm text-muted hover:text-foreground transition-colors"
                          >
                            or sign in with email →
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
