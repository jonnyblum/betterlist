"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductRows } from "@/components/recommendation-sidebar";
import { formatDate, formatPrice, getShareUrl } from "@/lib/utils";
import type { RecommendationStatus, OrderStatus } from "@prisma/client";
import type { CartItem } from "@/components/recommendation-sidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecommendationRow {
  id: string;
  token: string;
  patientIdentifier: string | null;
  status: RecommendationStatus;
  createdAt: string;
  viewedAt: string | null;
  purchasedAt: string | null;
  note: string | null;
  items: CartItem[];
}

interface OrderRow {
  id: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  recommendation: { patientIdentifier: string | null };
  items: { product: { name: string } }[];
}

interface FavoriteRow {
  productId: string;
  product: {
    id: string;
    name: string;
    brand: string;
    imageUrl: string | null;
  };
}

type Tab = "recommendations" | "orders" | "favorites";

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RecommendationStatus }) {
  if (status === "PURCHASED") return <Badge variant="success">Purchased</Badge>;
  if (status === "VIEWED") return <Badge variant="sky">Viewed</Badge>;
  return <Badge variant="default">Sent</Badge>;
}

// ─── Recommendation detail drawer ─────────────────────────────────────────────

function RecommendationDrawer({
  rec,
  onClose,
}: {
  rec: RecommendationRow;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getShareUrl(rec.token));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/25 z-40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm z-50 flex flex-col bg-background rounded-l-3xl shadow-2xl slide-from-right overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[rgba(0,0,0,0.05)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-semibold text-foreground truncate">
                  {rec.patientIdentifier ?? "Unknown patient"}
                </h2>
                <StatusBadge status={rec.status} />
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-black/[0.04] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-2.5 text-xs text-muted flex-wrap mt-2">
            <span>Sent {formatDate(rec.createdAt)}</span>
            {rec.viewedAt && (
              <>
                <span className="text-[rgba(0,0,0,0.15)]">·</span>
                <span>Viewed {formatDate(rec.viewedAt)}</span>
              </>
            )}
            {rec.purchasedAt && (
              <>
                <span className="text-[rgba(0,0,0,0.15)]">·</span>
                <span>Purchased {formatDate(rec.purchasedAt)}</span>
                <span className="text-[rgba(0,0,0,0.15)]">·</span>
                <span className="font-medium text-foreground">
                  {formatPrice(rec.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0))}
                </span>
              </>
            )}
          </div>

          {/* Note */}
          {rec.note && (
            <p className="mt-3 text-xs text-muted italic leading-relaxed bg-black/[0.025] rounded-xl px-3 py-2">
              &ldquo;{rec.note}&rdquo;
            </p>
          )}
        </div>

        {/* Product list — reused from sidebar */}
        <div className="flex-1 overflow-y-auto">
          <ProductRows items={rec.items} />
        </div>

        {/* Footer */}
        <div className="border-t border-[rgba(0,0,0,0.05)] px-5 py-4">
          <Button variant="outline" size="lg" fullWidth onClick={copyLink}>
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy link
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Recommendations tab ──────────────────────────────────────────────────────

function RecommendationsTab({
  rows,
  onSelect,
}: {
  rows: RecommendationRow[];
  onSelect: (rec: RecommendationRow) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted">No recommendations sent yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[rgba(0,0,0,0.04)]">
      {rows.map((rec) => (
        <button
          key={rec.id}
          onClick={() => onSelect(rec)}
          className="w-full flex items-center gap-4 py-3.5 text-left hover:bg-black/[0.02] transition-colors -mx-5 px-5"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {rec.patientIdentifier ?? "Unknown patient"}
            </p>
            <p className="text-xs text-muted mt-0.5">{formatDate(rec.createdAt)}</p>
          </div>
          <StatusBadge status={rec.status} />
          <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ─── Orders tab ───────────────────────────────────────────────────────────────

function OrdersTab({ rows }: { rows: OrderRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[rgba(0,0,0,0.04)]">
      {rows.map((order) => (
        <div key={order.id} className="flex items-center gap-4 py-3.5">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {order.items.map((i) => i.product.name).join(", ")}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {order.recommendation.patientIdentifier ?? "Unknown patient"} · {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-medium text-foreground">{formatPrice(order.total)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Favorites tab ────────────────────────────────────────────────────────────

function FavoritesTab({
  rows,
  onRemove,
}: {
  rows: FavoriteRow[];
  onRemove: (productId: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-20 text-center">
        <svg className="w-8 h-8 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
        </svg>
        <p className="text-sm text-muted">No favorites yet. Add products from the builder.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[rgba(0,0,0,0.04)]">
      {rows.map((row) => (
        <div key={row.productId} className="flex items-center gap-3 py-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
            {row.product.imageUrl ? (
              <Image src={row.product.imageUrl} alt={row.product.name} fill className="object-cover" sizes="40px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-300 select-none">
                  {row.product.brand.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{row.product.name}</p>
            <p className="text-xs text-muted">{row.product.brand}</p>
          </div>
          <button
            onClick={() => onRemove(row.productId)}
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-red-400 hover:bg-red-50 transition-all"
            title="Remove from favorites"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState<Tab>("recommendations");
  const [recs, setRecs] = useState<RecommendationRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRec, setSelectedRec] = useState<RecommendationRow | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [recsRes, ordersRes, picksRes, productsRes] = await Promise.all([
          fetch("/api/recommendations"),
          fetch("/api/orders"),
          fetch("/api/picks"),
          fetch("/api/products"),
        ]);

        if (recsRes.ok) {
          const data = await recsRes.json();
          setRecs(
            (data.recommendations ?? []).map((r: RecommendationRow & { items: { product: CartItem["product"]; quantity: number }[] }) => ({
              ...r,
              items: r.items.map((item) => ({
                product: item.product,
                quantity: item.quantity,
              })),
            }))
          );
        }

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data.orders ?? []);
        }

        if (picksRes.ok && productsRes.ok) {
          const [picksData, productsData] = await Promise.all([
            picksRes.json(),
            productsRes.json(),
          ]);
          const productMap = new Map<string, FavoriteRow["product"]>(
            (productsData.products ?? []).map((p: FavoriteRow["product"]) => [p.id, p])
          );
          setFavorites(
            (picksData.productIds ?? [])
              .map((id: string) => {
                const product = productMap.get(id);
                return product ? { productId: id, product } : null;
              })
              .filter((r: FavoriteRow | null): r is FavoriteRow => r !== null)
          );
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleRemoveFavorite(productId: string) {
    const previous = favorites;
    setFavorites((prev) => prev.filter((r) => r.productId !== productId));
    try {
      await fetch("/api/picks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    } catch {
      setFavorites(previous);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "recommendations", label: "Recommendations" },
    { key: "orders", label: "Orders" },
    { key: "favorites", label: "Product Favorites" },
  ];

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Tab pills */}
        <div className="flex items-center gap-1.5 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                "px-3.5 py-1.5 rounded-full text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-foreground text-white"
                  : "bg-white border border-[rgba(0,0,0,0.08)] text-muted hover:text-foreground hover:border-foreground/20",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content card */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] px-5">
            {activeTab === "recommendations" && (
              <RecommendationsTab rows={recs} onSelect={setSelectedRec} />
            )}
            {activeTab === "orders" && <OrdersTab rows={orders} />}
            {activeTab === "favorites" && (
              <FavoritesTab rows={favorites} onRemove={handleRemoveFavorite} />
            )}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedRec && (
        <RecommendationDrawer
          rec={selectedRec}
          onClose={() => setSelectedRec(null)}
        />
      )}
    </>
  );
}
