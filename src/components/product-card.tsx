"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { CatalogProduct } from "@/lib/types/catalog";

interface ProductCardProps {
  product: CatalogProduct;
  onAdd: (product: CatalogProduct) => void;
  isAdded: boolean;
  quantity?: number;
  isPicked?: boolean;
  onTogglePick?: (productId: string) => void;
  isFavoritesMode?: boolean;
  /** In normal (non-favorites) mode: open kit-assignment dropdown anchored to bookmark button */
  onBookmarkMenu?: (productId: string, rect: DOMRect) => void;
  /** Show a filled bookmark (instead of black checkmark) to indicate product is in the kit being edited */
  isInKit?: boolean;
  /** Storefront mode: hide + button and bookmarks, show "Add to bag" per card */
  isStorefront?: boolean;
  /** Called when patient taps "Get this →" on a storefront card (kept for internal use) */
  onGetThis?: (product: CatalogProduct) => void;
  /** Called when patient taps "Add to bag" on a storefront card */
  onAddToBag?: (product: CatalogProduct) => void;
  /** Whether this product is already in the bag */
  isInBag?: boolean;
}

export function ProductCard({
  product,
  onAdd,
  isAdded,
  quantity = 0,
  isPicked = false,
  onTogglePick,
  isFavoritesMode = false,
  onBookmarkMenu,
  isInKit = false,
  isStorefront = false,
  onGetThis,
  onAddToBag,
  isInBag = false,
}: ProductCardProps) {
  function handleBookmarkClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (onBookmarkMenu) {
      const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
      onBookmarkMenu(product.id, rect);
    } else {
      onTogglePick?.(product.id);
    }
  }

  return (
    <div
      className={[
        "group relative bg-white rounded-2xl border transition-all duration-200 select-none",
        isStorefront ? "cursor-default" : "cursor-pointer",
        "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        isAdded || isInKit
          ? "border-foreground/20 ring-2 ring-foreground/10"
          : "border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.1)]",
      ].join(" ")}
      onClick={isStorefront ? undefined : () => onAdd(product)}
    >
      {/* Kit membership indicator — bookmark replaces checkmark during kit edit */}
      {isInKit && (
        <div className="absolute top-2 right-2 z-10 flex flex-col items-center text-sky-400 animate-pop">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
          </svg>
        </div>
      )}

      {/* Added indicator — only shown outside kit-edit mode */}
      {isAdded && !isInKit && (
        <div className="absolute top-2.5 right-2.5 z-10 w-6 h-6 bg-foreground rounded-full flex items-center justify-center animate-pop">
          {quantity > 1 ? (
            <span className="text-white text-xs font-bold">{quantity}</span>
          ) : (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}

      {/* HSA/FSA badge */}
      {/* {product.hsaFsaEligible && (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10">
          <Badge variant="sage" className="text-[10px] px-1.5">HSA/FSA</Badge>
        </div>
      )} */}

      {/* Bookmark badge — in favorites mode (toggle pick) or normal mode (open kit dropdown); hidden in storefront */}
      {!isStorefront && (isFavoritesMode || !!onBookmarkMenu) && (
        <button
          onClick={handleBookmarkClick}
          className={[
            "absolute top-1.5 left-1.5 z-20 w-7 h-7 rounded-full",
            "flex items-center justify-center bg-white shadow-md",
            "transition-all active:scale-90",
            isPicked
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-40",
          ].join(" ")}
          aria-label={isPicked ? "Remove from favorites" : "Add to favorites"}
        >
          <svg
            className={`w-3.5 h-3.5 transition-colors ${isPicked ? "text-sky-400" : "text-gray-400"}`}
            fill={isPicked ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
          </svg>
        </button>
      )}

      {/* Product image */}
      <div className="relative aspect-square rounded-xl overflow-hidden m-3 mb-0 bg-gray-50">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <span className="text-2xl font-semibold text-gray-200 select-none">
              {product.brand.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

      </div>

      {/* Product info */}
      <div className="px-3 pt-2 pb-3">
        <p className="text-[11px] text-muted font-medium leading-none mb-1">{product.brand}</p>
        {isStorefront ? (
          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-[12px] text-foreground leading-tight line-clamp-2">
              {product.name}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onAddToBag) {
                  onAddToBag(product);
                } else {
                  onGetThis?.(product);
                }
              }}
              className={[
                "w-full text-[11px] font-semibold py-1.5 rounded-lg transition-all",
                isInBag
                  ? "bg-foreground text-white"
                  : "bg-black/[0.05] text-foreground hover:bg-black/[0.1]",
              ].join(" ")}
            >
              {isInBag ? "✓ In bag" : "Add to bag"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-[12px] text-foreground leading-tight line-clamp-2 flex-1">
              {product.name}
            </h3>
            <div
              className={[
                "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all",
                isInKit
                  ? "bg-sky-400 text-white"
                  : isAdded
                  ? "bg-foreground text-white"
                  : "bg-gray-100 text-muted group-hover:bg-[#888] group-hover:text-white",
              ].join(" ")}
            >
              {isAdded || isInKit ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
