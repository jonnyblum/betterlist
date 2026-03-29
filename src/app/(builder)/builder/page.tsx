"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ProductCatalog } from "@/components/product-catalog";
import { RecommendationSidebar } from "@/components/recommendation-sidebar";
import { GuestSendModal } from "@/components/guest-send-modal";
import { SignInModal } from "@/components/sign-in-modal";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { normalizePhone, isValidPhone, getShareUrl } from "@/lib/utils";
import { getDefaultCategories } from "@/lib/specialty-categories";
import type { Product } from "@prisma/client";
import type { KitWithItems } from "@/lib/types/kit";

interface CartItem {
  product: Product;
  quantity: number;
}

function BuilderContent() {
  const { showToast } = useToast();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isSignedIn = sessionStatus === "authenticated" && !!session?.user;

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [note, setNote] = useState("");
  const [patientIdentifier, setPatientIdentifier] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [pickedProductIds, setPickedProductIds] = useState<string[]>([]);
  const [specialty, setSpecialty] = useState<string>("");
  const [customCategories, setCustomCategories] = useState<string[] | null>(null);
  const [kits, setKits] = useState<KitWithItems[]>([]);
  const [newKitId, setNewKitId] = useState<string | null>(null);
  const [isKitCreating, setIsKitCreating] = useState(false);
  const [editingKit, setEditingKit] = useState<KitWithItems | null>(null);
  const [kitCreationInitial, setKitCreationInitial] = useState<{ productIds: string[]; name: string }>({ productIds: [], name: "" });
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Load products (always); picks/profile/kits only when signed in
  useEffect(() => {
    if (sessionStatus === "loading") return;

    async function loadData() {
      try {
        const fetches: Promise<Response>[] = [fetch("/api/products")];
        if (isSignedIn) {
          fetches.push(fetch("/api/picks"), fetch("/api/profile"), fetch("/api/kits"));
        }
        const [productsRes, picksRes, profileRes, kitsRes] = await Promise.all(fetches);
        if (!productsRes.ok) throw new Error("Failed to load products");
        const productsData = await productsRes.json();
        setProducts(productsData.products ?? []);
        if (picksRes?.ok) {
          const picksData = await picksRes.json();
          setPickedProductIds(picksData.productIds ?? []);
        }
        if (profileRes?.ok) {
          const profileData = await profileRes.json();
          setSpecialty(profileData.specialty ?? "");
          setCustomCategories(
            Array.isArray(profileData.customCategories) && profileData.customCategories.length > 0
              ? profileData.customCategories
              : null
          );
        }
        if (kitsRes?.ok) {
          const kitsData = await kitsRes.json();
          setKits(kitsData.kits ?? []);
        }
      } catch {
        showToast("Failed to load products", "error");
      } finally {
        setLoadingProducts(false);
      }
    }
    loadData();
  // session?.user?.role is included so the effect re-runs when a new user
  // completes onboarding (role changes from null → CLINICIAN), loading their
  // freshly-seeded kits and picks without a full page reload.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, isSignedIn, session?.user?.role]);

  const handleTogglePick = useCallback(async (productId: string) => {
    const isPicked = pickedProductIds.includes(productId);
    setPickedProductIds((prev) =>
      isPicked ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    try {
      const res = await fetch("/api/picks", {
        method: isPicked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error("picks api error");
    } catch {
      setPickedProductIds((prev) =>
        isPicked ? [...prev, productId] : prev.filter((id) => id !== productId)
      );
    }
  }, [pickedProductIds]);

  const selectedProductIds = cartItems.map((i) => i.product.id);
  const selectedQuantities = Object.fromEntries(
    cartItems.map((i) => [i.product.id, i.quantity])
  );

  const handleAddProduct = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.filter((i) => i.product.id !== product.id);
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const handleRemoveItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const handleSend = useCallback(async () => {
    setSendError("");
    if (cartItems.length === 0) {
      setSendError("Add at least one product.");
      return;
    }
    if (!patientIdentifier.trim()) {
      setSendError("Enter the patient's phone or email.");
      return;
    }

    // Guests see the modal instead of sending directly
    if (!isSignedIn) {
      setGuestModalOpen(true);
      return;
    }

    const identifier = isValidPhone(patientIdentifier)
      ? normalizePhone(patientIdentifier)
      : patientIdentifier;

    setSending(true);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientIdentifier: identifier,
          productIds: cartItems.map((i) => i.product.id),
          quantities: Object.fromEntries(cartItems.map((i) => [i.product.id, i.quantity])),
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSendError(data.error ?? "Failed to send recommendation.");
        return;
      }

      showToast("Recommendation sent!", "success");

      try {
        await navigator.clipboard.writeText(getShareUrl(data.token));
        showToast("Link copied to clipboard", "info");
      } catch {
        // Clipboard not available in all contexts
      }

      setCartItems([]);
      setNote("");
      setPatientIdentifier("");
      setIsMobileSheetOpen(false);
    } catch {
      setSendError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }, [cartItems, patientIdentifier, note, isSignedIn, showToast]);

  const visibleCategoryValues = useMemo(() => {
    if (customCategories && customCategories.length > 0) return customCategories;
    return getDefaultCategories(specialty);
  }, [customCategories, specialty]);

  const handleCategoriesChange = useCallback((categories: string[]) => {
    const next = categories.length > 0 ? categories : null;
    setCustomCategories(next);
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customCategories: categories }),
    }).catch(() => {});
  }, []);

  // ─── Kit helpers ─────────────────────────────────────────────────────────────

  function loadKitIntoCart(kit: KitWithItems) {
    const newItems: CartItem[] = kit.items
      .map((item) => {
        const product = products.find((p) => p.id === item.product.id);
        return product ? { product, quantity: 1 } : null;
      })
      .filter((x): x is CartItem => x !== null);

    setCartItems((prev) => {
      const combined = [...prev];
      for (const item of newItems) {
        if (!combined.find((i) => i.product.id === item.product.id)) {
          combined.push(item);
        }
      }
      return combined;
    });
  }

  const handleKitLoad = useCallback((kit: KitWithItems) => {
    loadKitIntoCart(kit);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const handleNewKit = useCallback(() => {
    setEditingKit(null);
    setKitCreationInitial({ productIds: [], name: "" });
    setIsKitCreating(true);
  }, []);

  const handleEditKit = useCallback((kit: KitWithItems) => {
    setEditingKit(kit);
    setKitCreationInitial({ productIds: kit.items.map((i) => i.product.id), name: kit.name });
    setIsKitCreating(true);
  }, []);

  const handleKitDelete = useCallback(async (kit: KitWithItems) => {
    setKits((prev) => prev.filter((k) => k.id !== kit.id));
    try {
      const res = await fetch(`/api/kits/${kit.id}`, { method: "DELETE" });
      if (!res.ok) {
        setKits((prev) => [...prev, kit]);
        showToast("Failed to delete kit", "error");
      }
    } catch {
      setKits((prev) => [...prev, kit]);
      showToast("Failed to delete kit", "error");
    }
  }, [showToast]);

  const handleKitRemoveFavorite = useCallback(async (kit: KitWithItems) => {
    setKits((prev) => prev.filter((k) => k.id !== kit.id));
    try {
      const res = await fetch(`/api/kits/${kit.id}`, { method: "DELETE" });
      if (!res.ok) {
        setKits((prev) => [...prev, kit]);
        showToast("Failed to remove kit", "error");
      }
    } catch {
      setKits((prev) => [...prev, kit]);
      showToast("Failed to remove kit", "error");
    }
  }, [showToast]);

  const handleSaveAsKit = useCallback(() => {
    setEditingKit(null);
    setKitCreationInitial({ productIds: cartItems.map((i) => i.product.id), name: "" });
    setIsKitCreating(true);
  }, [cartItems]);

  const handleKitRemoveProduct = useCallback(async (kit: KitWithItems, productId: string) => {
    const newProductIds = kit.items.map((i) => i.product.id).filter((id) => id !== productId);
    setKits((prev) => prev.map((k) =>
      k.id === kit.id ? { ...k, items: k.items.filter((i) => i.product.id !== productId) } : k
    ));
    try {
      const res = await fetch(`/api/kits/${kit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: newProductIds }),
      });
      if (!res.ok) {
        setKits((prev) => prev.map((k) => k.id === kit.id ? kit : k));
        showToast("Failed to update kit", "error");
      } else {
        showToast(`Removed from ${kit.name}`, "info");
      }
    } catch {
      setKits((prev) => prev.map((k) => k.id === kit.id ? kit : k));
      showToast("Failed to update kit", "error");
    }
  }, [showToast]);

  const handleKitAddProduct = useCallback(async (kit: KitWithItems, productId: string) => {
    const newProductIds = [...kit.items.map((i) => i.product.id), productId];
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setKits((prev) => prev.map((k) =>
      k.id === kit.id
        ? { ...k, items: [...k.items, { id: `temp-${productId}`, order: k.items.length, product: { id: product.id, name: product.name, brand: product.brand, imageUrl: product.imageUrl } }] }
        : k
    ));
    const alreadyPicked = pickedProductIds.includes(productId);
    if (!alreadyPicked) setPickedProductIds((prev) => [...prev, productId]);
    try {
      const res = await fetch(`/api/kits/${kit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: newProductIds }),
      });
      if (!res.ok) {
        setKits((prev) => prev.map((k) => k.id === kit.id ? kit : k));
        if (!alreadyPicked) setPickedProductIds((prev) => prev.filter((id) => id !== productId));
        showToast("Failed to update kit", "error");
      } else {
        const data = await res.json();
        setKits((prev) => prev.map((k) => k.id === kit.id ? data.kit : k));
        showToast(`Added to ${kit.name}`, "success");
      }
    } catch {
      setKits((prev) => prev.map((k) => k.id === kit.id ? kit : k));
      if (!alreadyPicked) setPickedProductIds((prev) => prev.filter((id) => id !== productId));
      showToast("Failed to update kit", "error");
    }
  }, [products, pickedProductIds, showToast]);

  const handleKitRename = useCallback(async (kit: KitWithItems, newName: string) => {
    setKits((prev) => prev.map((k) => k.id === kit.id ? { ...k, name: newName } : k));
    try {
      const res = await fetch(`/api/kits/${kit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) {
        setKits((prev) => prev.map((k) => k.id === kit.id ? { ...k, name: kit.name } : k));
        showToast("Failed to rename kit", "error");
      }
    } catch {
      setKits((prev) => prev.map((k) => k.id === kit.id ? { ...k, name: kit.name } : k));
      showToast("Failed to rename kit", "error");
    }
  }, [showToast]);

  const handleKitSave = useCallback(async (name: string, productIds: string[]) => {
    if (editingKit) {
      const res = await fetch(`/api/kits/${editingKit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, productIds }),
      });
      if (!res.ok) { showToast("Failed to save kit", "error"); return; }
      const data = await res.json();
      setKits((prev) => prev.map((k) => k.id === editingKit.id ? data.kit : k));
    } else {
      const res = await fetch("/api/kits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, productIds }),
      });
      if (!res.ok) { showToast("Failed to save kit", "error"); return; }
      const data = await res.json();
      const newKit: KitWithItems = data.kit;
      setKits((prev) => [...prev, newKit]);
      setNewKitId(newKit.id);
      setTimeout(() => setNewKitId(null), 600);
    }
    setIsKitCreating(false);
    setEditingKit(null);
  }, [editingKit, showToast]);

  function handleGuestSuccess(token: string) {
    setGuestModalOpen(false);
    showToast("Recommendation sent!", "success");
    try {
      navigator.clipboard.writeText(getShareUrl(token));
      showToast("Link copied to clipboard", "info");
    } catch {
      // Clipboard not available
    }
    setCartItems([]);
    setNote("");
    setPatientIdentifier("");
    setIsMobileSheetOpen(false);
  }

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  if (loadingProducts || sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row">
      {/* Catalog */}
      <div className="flex-1 overflow-hidden">
        <ProductCatalog
          products={products}
          selectedProductIds={selectedProductIds}
          selectedQuantities={selectedQuantities}
          onAddProduct={handleAddProduct}
          pickedProductIds={pickedProductIds}
          onTogglePick={handleTogglePick}
          visibleCategoryValues={visibleCategoryValues}
          onCategoriesChange={handleCategoriesChange}
          kits={isSignedIn ? kits : undefined}
          newKitId={isSignedIn ? newKitId : null}
          onKitLoad={isSignedIn ? handleKitLoad : undefined}
          onKitCreate={isSignedIn ? handleNewKit : undefined}
          onKitEdit={isSignedIn ? handleEditKit : undefined}
          onKitDelete={isSignedIn ? handleKitDelete : undefined}
          onKitRemoveFavorite={isSignedIn ? handleKitRemoveFavorite : undefined}
          onKitRename={isSignedIn ? handleKitRename : undefined}
          onKitRemoveProduct={isSignedIn ? handleKitRemoveProduct : undefined}
          onKitAddProduct={isSignedIn ? handleKitAddProduct : undefined}
          isKitCreating={isKitCreating}
          onKitCreatingChange={setIsKitCreating}
          kitInitialProductIds={kitCreationInitial.productIds}
          kitInitialName={kitCreationInitial.name}
          editingKitId={editingKit?.id ?? null}
          onKitSave={handleKitSave}
          isSignedIn={isSignedIn}
          onGuestFavoritesClick={!isSignedIn ? () => setSignInModalOpen(true) : undefined}
        />
      </div>

      {/* Desktop sidebar — hidden while building a kit */}
      {!isKitCreating && (
        <div className="hidden lg:flex w-80 xl:w-96 p-4 flex-col">
          <RecommendationSidebar
            items={cartItems}
            note={note}
            patientIdentifier={patientIdentifier}
            onNoteChange={setNote}
            onPatientIdentifierChange={setPatientIdentifier}
            onRemoveItem={handleRemoveItem}
            onSend={handleSend}
            sending={sending}
            error={sendError}
            onSaveAsKit={isSignedIn && cartItems.length >= 2 ? handleSaveAsKit : undefined}
          />
        </div>
      )}

      {/* Mobile: floating cart button */}
      {!isMobileSheetOpen && (
        <div className="lg:hidden fixed bottom-6 right-4 left-4 z-30">
          <button
            onClick={() => setIsMobileSheetOpen(true)}
            className="w-full bg-foreground text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-xl active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-peach-400 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="font-semibold">
                {cartCount === 0 ? "Your recommendation" : `${cartCount} item${cartCount !== 1 ? "s" : ""}`}
              </span>
            </div>
            <span className="text-sm text-white/70">Review & send →</span>
          </button>
        </div>
      )}

      {/* Mobile: bottom sheet */}
      {isMobileSheetOpen && (
        <>
          <div
            ref={overlayRef}
            className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setIsMobileSheetOpen(false)}
          />
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 h-[85vh] slide-from-bottom">
            <div className="bg-background rounded-t-3xl h-full flex flex-col overflow-hidden shadow-2xl">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              <div className="flex-1 overflow-hidden p-4">
                <RecommendationSidebar
                  items={cartItems}
                  note={note}
                  patientIdentifier={patientIdentifier}
                  onNoteChange={setNote}
                  onPatientIdentifierChange={setPatientIdentifier}
                  onRemoveItem={handleRemoveItem}
                  onSend={handleSend}
                  sending={sending}
                  error={sendError}
                  onSaveAsKit={isSignedIn && cartItems.length >= 2 ? handleSaveAsKit : undefined}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sign-in modal — triggered by Favorites pill, Activity nav, or Create Account (for guests) */}
      {signInModalOpen && (
        <SignInModal
          onClose={() => setSignInModalOpen(false)}
          onSuccess={() => {
            setSignInModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {/* Guest send modal */}
      {guestModalOpen && (
        <GuestSendModal
          cartItems={cartItems}
          patientIdentifier={patientIdentifier}
          note={note}
          onClose={() => setGuestModalOpen(false)}
          onSuccess={handleGuestSuccess}
          onSignedIn={(kitsData, picksData) => {
            if (kitsData) setKits(kitsData);
            if (picksData) setPickedProductIds(picksData);
          }}
        />
      )}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <ToastProvider>
      <BuilderContent />
    </ToastProvider>
  );
}
