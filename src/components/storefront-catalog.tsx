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
  clinicianSlug: string;
  initialProducts: Product[];
  customCategories: string[];
}

function StorefrontCatalogContent({
  clinicianSlug,
  initialProducts,
  customCategories,
}: StorefrontCatalogProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isSignedIn = sessionStatus === "authenticated" && !!session?.user;

  const [products] = useState<Product[]>(initialProducts);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<CatalogProduct | null>(null);

  // After sign-in completes, trigger the pending "Get this" if any
  useEffect(() => {
    if (isSignedIn && pendingProduct) {
      const p = pendingProduct;
      setPendingProduct(null);
      handleGetThis(p);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  async function handleGetThis(product: CatalogProduct) {
    if (!isSignedIn) {
      // Save product, open sign-in modal; effect above will re-trigger after auth
      setPendingProduct(product);
      setSignInModalOpen(true);
      return;
    }

    try {
      const res = await fetch(`/api/storefront/${clinicianSlug}/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
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
    }
  }

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
        onGetThis={handleGetThis}
      />

      {signInModalOpen && (
        <SignInModal
          onClose={() => {
            setSignInModalOpen(false);
            setPendingProduct(null);
          }}
          onSuccess={() => {
            setSignInModalOpen(false);
            // pendingProduct will be picked up by the useEffect above
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
