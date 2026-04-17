"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProductCatalog } from "@/components/product-catalog";
import { SignInModal } from "@/components/sign-in-modal";
import { ToastProvider, useToast } from "@/components/ui/toast";
import type { Product } from "@prisma/client";
import type { CatalogProduct } from "@/lib/types/catalog";

interface StorefrontCatalogProps {
  clinicianSlug?: string;
  initialProducts: Product[];
  customCategories: string[];
  /** Demo mode: bag checkout shows sign-in gate then redirects to /builder instead of a receipt */
  isDemo?: boolean;
}

function StorefrontCatalogContent({
  clinicianSlug,
  initialProducts,
  customCategories,
  isDemo = false,
}: StorefrontCatalogProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isSignedIn = sessionStatus === "authenticated" && !!session?.user;

  const [products] = useState<Product[]>(initialProducts);
  const [signInModalOpen, setSignInModalOpen] = useState(false);

  // Bag state
  const [bag, setBag] = useState<CatalogProduct[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Pending checkout triggered before sign-in
  const [pendingCheckout, setPendingCheckout] = useState(false);

  const bagProductIds = bag.map((p) => p.id);

  function handleAddToBag(product: CatalogProduct) {
    setBag((prev) => {
      const already = prev.some((p) => p.id === product.id);
      if (already) return prev.filter((p) => p.id !== product.id);
      return [...prev, product];
    });
  }

  function handleRemoveFromBag(productId: string) {
    setBag((prev) => prev.filter((p) => p.id !== productId));
  }

  async function handleCheckout() {
    if (bag.length === 0) return;

    if (!isSignedIn) {
      setPendingCheckout(true);
      setSignInModalOpen(true);
      return;
    }

    // Demo mode: just redirect to builder after sign-in
    if (isDemo || !clinicianSlug) {
      router.push("/builder");
      return;
    }

    setCheckingOut(true);
    try {
      const res = await fetch(`/api/storefront/${clinicianSlug}/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: bag.map((p) => p.id) }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error ?? "Something went wrong. Please try again.", "error");
        return;
      }

      const { url } = await res.json();
      router.push(url);
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setCheckingOut(false);
    }
  }

  // After sign-in completes, trigger pending checkout
  useEffect(() => {
    if (isSignedIn && pendingCheckout) {
      setPendingCheckout(false);
      handleCheckout();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const bagTotal = bag.reduce((sum, p) => sum + (p.price ?? 0), 0);

  const visibleCategories =
    Array.isArray(customCategories) && customCategories.length > 0
      ? customCategories
      : null;

  return (
    <>
      <ProductCatalog
        products={products}
        selectedProductIds={[]}
        selectedQuantities={{}}
        onAddProduct={() => {}}
        pickedProductIds={[]}
        onTogglePick={() => {}}
        visibleCategoryValues={visibleCategories}
        isSignedIn={false}
        isStorefront={true}
        onAddToBag={handleAddToBag}
        bagProductIds={bagProductIds}
        bag={bag}
        bagTotal={bagTotal}
        onViewBag={() => setBagOpen(true)}
      />

      {/* Bag drawer */}
      {bagOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setBagOpen(false)}
          />

          {/* Panel — bottom sheet on mobile, right sidebar on desktop */}
          <div className="absolute bottom-0 left-0 right-0 sm:bottom-0 sm:top-0 sm:left-auto sm:w-96 bg-white rounded-t-3xl sm:rounded-none sm:rounded-l-3xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-none">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-black/[0.06]">
              <h2 className="text-lg font-bold text-foreground">Your Bag</h2>
              <button
                onClick={() => setBagOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-black/[0.04] transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
              {bag.map((product) => (
                <div key={product.id} className="flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-300">
                          {product.brand.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted font-medium leading-none mb-0.5">{product.brand}</p>
                    <p className="text-[13px] font-semibold text-foreground leading-tight line-clamp-2">{product.name}</p>
                    {product.price > 0 && (
                      <p className="text-[12px] text-muted mt-0.5">${product.price.toFixed(2)}</p>
                    )}
                  </div>
                  {/* Remove */}
                  <button
                    onClick={() => handleRemoveFromBag(product.id)}
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-black/[0.05] transition-all"
                    aria-label="Remove from bag"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-black/[0.06]">
              {bagTotal > 0 && (
                <div className="flex items-center justify-between mb-4 text-sm">
                  <span className="text-muted font-medium">Total</span>
                  <span className="font-bold text-foreground">${bagTotal.toFixed(2)}</span>
                </div>
              )}
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full bg-foreground text-white rounded-xl py-3.5 px-5 text-sm font-semibold hover:bg-[#222] transition-colors disabled:opacity-50 flex items-center justify-between"
              >
                <span>{checkingOut ? "Creating your list…" : "Get everything →"}</span>
                {!checkingOut && <span className="opacity-60 text-base">→</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {signInModalOpen && (
        <SignInModal
          defaultRole="PATIENT"
          onClose={() => {
            setSignInModalOpen(false);
            setPendingCheckout(false);
          }}
          onSuccess={() => {
            setSignInModalOpen(false);
            // pendingCheckout will be picked up by the useEffect above
          }}
        />
      )}
    </>
  );
}

export function StorefrontCatalog(props: StorefrontCatalogProps) {
  return (
    <ToastProvider>
      <StorefrontCatalogContent {...props} />
    </ToastProvider>
  );
}
