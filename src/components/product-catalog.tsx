"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ProductCard } from "@/components/product-card";
import { KitCard, NewKitCard, KitInProgressCard } from "@/components/kit-card";
import { Input } from "@/components/ui/input";
import type { Product } from "@prisma/client";
import type { KitWithItems } from "@/lib/types/kit";

// ─── Category definitions ──────────────────────────────────────────────────────

const CATEGORY_DEFS: { value: string; label: string }[] = [
  { value: "SUPPLEMENTS", label: "Supplements" },
  { value: "DEVICES",     label: "Devices" },
  { value: "COSMETIC",    label: "Skincare" },
  { value: "DENTAL",      label: "Dental" },
  { value: "APPS",        label: "Apps" },
  { value: "WEARABLES",   label: "Wearables" },
  { value: "OTHER",       label: "Other" },
];

function categoryLabel(value: string): string {
  return CATEGORY_DEFS.find((c) => c.value === value)?.label ?? value;
}

// ─── Sortable row inside the popover ──────────────────────────────────────────

function SortableCategoryRow({
  id,
  label,
  checked,
  onToggle,
}: {
  id: string;
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-black/[0.03] select-none"
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#ccc] hover:text-[#aaa] flex-shrink-0 touch-none"
        aria-label="Drag to reorder"
      >
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
          <circle cx="2.5" cy="2.5" r="1.5" /><circle cx="7.5" cy="2.5" r="1.5" />
          <circle cx="2.5" cy="7" r="1.5" /><circle cx="7.5" cy="7" r="1.5" />
          <circle cx="2.5" cy="11.5" r="1.5" /><circle cx="7.5" cy="11.5" r="1.5" />
        </svg>
      </span>

      {/* Checkbox */}
      <input
        type="checkbox"
        id={`cat-${id}`}
        checked={checked}
        onChange={onToggle}
        className="w-3.5 h-3.5 rounded accent-foreground flex-shrink-0 cursor-pointer"
      />

      {/* Label */}
      <label
        htmlFor={`cat-${id}`}
        className="text-sm text-foreground cursor-pointer flex-1"
      >
        {label}
      </label>
    </div>
  );
}

// ─── Category popover ──────────────────────────────────────────────────────────

function CategoryPopover({
  visibleValues,
  availableValues,
  onChange,
  onClose,
  top,
  left,
}: {
  visibleValues: string[] | null;
  availableValues: string[];
  onChange: (categories: string[]) => void;
  onClose: () => void;
  top: number;
  left: number;
}) {
  // Local ordered list: checked items first (in their pill order), then unchecked
  const [orderedItems, setOrderedItems] = useState<string[]>(() => {
    const visible = visibleValues ?? availableValues;
    const rest = availableValues.filter((v) => !visible.includes(v));
    return [...visible.filter((v) => availableValues.includes(v)), ...rest];
  });

  // Which items are currently checked
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(visibleValues ?? availableValues)
  );

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click or scroll
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function onScroll() { onClose(); }
    document.addEventListener("mousedown", handler);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [onClose]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = orderedItems.indexOf(active.id as string);
    const newIdx = orderedItems.indexOf(over.id as string);
    const next = arrayMove(orderedItems, oldIdx, newIdx);
    setOrderedItems(next);
    onChange(next.filter((v) => checked.has(v)));
  }

  function handleToggle(value: string) {
    const next = new Set(checked);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setChecked(next);
    onChange(orderedItems.filter((v) => next.has(v)));
  }

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[9999] w-52 bg-white rounded-2xl shadow-lg border border-black/[0.08] py-2"
      style={{ top, left, minWidth: "13rem" }}
    >
      <p className="text-[11px] font-semibold text-muted uppercase tracking-wide px-3 pt-1 pb-1.5">
        Categories
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedItems} strategy={verticalListSortingStrategy}>
          {orderedItems.map((value) => (
            <SortableCategoryRow
              key={value}
              id={value}
              label={categoryLabel(value)}
              checked={checked.has(value)}
              onToggle={() => handleToggle(value)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>,
    document.body
  );
}

// ─── Bookmark kit-assignment dropdown ─────────────────────────────────────────

function BookmarkDropdown({
  productId,
  top,
  left,
  kits,
  pickedProductIds,
  onTogglePick,
  onKitAddProduct,
  onKitRemoveProduct,
  onClose,
}: {
  productId: string;
  top: number;
  left: number;
  kits: KitWithItems[];
  pickedProductIds: string[];
  onTogglePick: (productId: string) => void;
  onKitAddProduct?: (kit: KitWithItems, productId: string) => void;
  onKitRemoveProduct?: (kit: KitWithItems, productId: string) => void;
  onClose: () => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const allKits = kits;
  const isPicked = pickedProductIds.includes(productId);
  const inKitIds = new Set(
    allKits.filter((k) => k.items.some((i) => i.product.id === productId)).map((k) => k.id)
  );
  const inAnyKit = inKitIds.size > 0;
  const noKitChecked = isPicked && !inAnyKit;
  const noKitDisabled = inAnyKit;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function onScroll() { onClose(); }
    document.addEventListener("mousedown", handler);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [onClose]);

  const dropdownWidth = 200;
  const clampedLeft = typeof window !== "undefined"
    ? Math.min(left, window.innerWidth - dropdownWidth - 8)
    : left;

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white rounded-2xl shadow-xl border border-black/[0.08] py-1.5"
      style={{ top, left: clampedLeft, width: dropdownWidth }}
    >
      <p className="text-[11px] font-semibold text-muted uppercase tracking-wide px-3 pt-1 pb-1.5">
        Add to kit
      </p>
      {/* No specific kit */}
      <button
        disabled={noKitDisabled}
        onClick={() => {
          if (!noKitDisabled) {
            onTogglePick(productId);
            onClose();
          }
        }}
        className={[
          "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
          noKitDisabled ? "opacity-40 cursor-not-allowed" : "hover:bg-black/[0.03] cursor-pointer",
        ].join(" ")}
        style={{ padding: "5px 12px" }}
      >
        <div className={[
          "w-3.5 h-3.5 rounded flex-shrink-0 flex items-center justify-center border",
          noKitChecked ? "bg-foreground border-foreground" : "border-[rgba(0,0,0,0.2)] bg-white",
        ].join(" ")}>
          {noKitChecked && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className={`text-sm ${noKitDisabled ? "text-muted" : "text-foreground"}`}>
          No specific kit
        </span>
      </button>

      {allKits.length > 0 && (
        <>
          <div className="mx-2.5 my-0.5 border-t border-black/[0.06]" />
          <div className="overflow-y-auto" style={{ maxHeight: "154px" }}>
            {allKits.map((kit) => {
              const isInKit = inKitIds.has(kit.id);
              return (
                <button
                  key={kit.id}
                  onClick={() => {
                    if (isInKit) {
                      onKitRemoveProduct?.(kit, productId);
                    } else {
                      onKitAddProduct?.(kit, productId);
                    }
                    // Stay open for multi-select
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-black/[0.03] transition-colors cursor-pointer"
                >
                  <div className={[
                    "w-3.5 h-3.5 rounded flex-shrink-0 flex items-center justify-center border",
                    isInKit ? "bg-foreground border-foreground" : "border-[rgba(0,0,0,0.2)] bg-white",
                  ].join(" ")}>
                    {isInKit && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-foreground truncate">{kit.name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>,
    document.body
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface ProductCatalogProps {
  products: Product[];
  selectedProductIds: string[];
  selectedQuantities: Record<string, number>;
  onAddProduct: (product: Product) => void;
  pickedProductIds: string[];
  onTogglePick: (productId: string) => void;
  /** Which category values to show as pills. null/undefined = show all. */
  visibleCategoryValues?: string[] | null;
  /** Called when the clinician customises categories via the "+" popover. */
  onCategoriesChange?: (categories: string[]) => void;
  // ─── Kits ───────────────────────────────────────────────────────────────────
  kits?: KitWithItems[];
  newKitId?: string | null;
  onKitLoad?: (kit: KitWithItems) => void;
  onKitCreate?: () => void;
  onKitEdit?: (kit: KitWithItems) => void;
  onKitDelete?: (kit: KitWithItems) => void;
  onKitRemoveFavorite?: (kit: KitWithItems) => void;
  onKitRename?: (kit: KitWithItems, newName: string) => void;
  onKitRemoveProduct?: (kit: KitWithItems, productId: string) => void;
  onKitAddProduct?: (kit: KitWithItems, productId: string) => void;
  /** When true, the catalog enters kit-building mode */
  isKitCreating?: boolean;
  onKitCreatingChange?: (creating: boolean) => void;
  kitInitialProductIds?: string[];
  kitInitialName?: string;
  editingKitId?: string | null;
  onKitSave?: (name: string, productIds: string[]) => Promise<void>;
  /** When false, hides favorites pill, bookmark icons, and kits row */
  isSignedIn?: boolean;
  /** Called when a guest clicks the Favorites pill (e.g. redirect to sign-in) */
  onGuestFavoritesClick?: () => void;
}

export function ProductCatalog({
  products,
  selectedProductIds,
  selectedQuantities,
  onAddProduct,
  pickedProductIds,
  onTogglePick,
  visibleCategoryValues,
  onCategoriesChange,
  kits,
  newKitId,
  onKitLoad,
  onKitCreate,
  onKitEdit,
  onKitDelete,
  onKitRemoveFavorite,
  onKitRename,
  onKitRemoveProduct,
  onKitAddProduct,
  isKitCreating = false,
  onKitCreatingChange,
  kitInitialProductIds,
  kitInitialName,
  editingKitId,
  onKitSave,
  isSignedIn = true,
  onGuestFavoritesClick,
}: ProductCatalogProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [bookmarkMenu, setBookmarkMenu] = useState<{ productId: string; top: number; left: number } | null>(null);
  const [showMyPicks, setShowMyPicks] = useState(false);
  const [sortSnapshot, setSortSnapshot] = useState<string[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const plusRef = useRef<HTMLButtonElement>(null);

  // ─── Kit expansion (view kit items in product grid) ─────────────────────────
  const [expandedKitId, setExpandedKitId] = useState<string | null>(null);

  const expandedKit = useMemo(
    () => kits?.find((k) => k.id === expandedKitId) ?? null,
    [kits, expandedKitId]
  );

  function handleKitExpand(kit: KitWithItems | null) {
    setExpandedKitId(kit ? kit.id : null);
  }

  // ─── Kit creation local state ────────────────────────────────────────────────
  const [kitSelectedIds, setKitSelectedIds] = useState<Set<string>>(new Set());
  const [kitName, setKitName] = useState("");
  const [kitSaving, setKitSaving] = useState(false);

  // Sync kit creation state when entering creation mode
  const kitInitialProductIdsRef = useRef(kitInitialProductIds);
  kitInitialProductIdsRef.current = kitInitialProductIds;
  const kitInitialNameRef = useRef(kitInitialName);
  kitInitialNameRef.current = kitInitialName;

  useEffect(() => {
    if (isKitCreating) {
      setKitSelectedIds(new Set(kitInitialProductIdsRef.current ?? []));
      setKitName(kitInitialNameRef.current ?? "");
      setKitSaving(false);
      // Auto-expand the kit being edited so its items are shown below
      if (editingKitId) {
        setExpandedKitId(editingKitId);
      }
    }
  }, [isKitCreating, editingKitId]);

  function toggleKitProduct(productId: string) {
    setKitSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  async function handleKitSaveClick() {
    if (!kitName.trim() || kitSelectedIds.size === 0 || !onKitSave) return;
    setKitSaving(true);
    try {
      await onKitSave(kitName.trim(), Array.from(kitSelectedIds));
    } finally {
      setKitSaving(false);
    }
  }

  // Products selected for the in-progress kit card (maintains selection order)
  const kitSelectedProducts = useMemo(
    () =>
      Array.from(kitSelectedIds)
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => p != null)
        .map((p) => ({ id: p.id, name: p.name, brand: p.brand, imageUrl: p.imageUrl })),
    [kitSelectedIds, products]
  );

  function handleToggleFavoritesPill() {
    if (!showMyPicks) {
      setSearch("");
      setActiveCategory("ALL");
      setSortSnapshot([...pickedProductIds]);
    } else {
      // Leaving favorites — clear any expanded kit view
      setExpandedKitId(null);
    }
    setShowMyPicks((v) => !v);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (showMyPicks) setSortSnapshot([...pickedProductIds]);
  }

  function handleCategoryChange(value: string) {
    setActiveCategory(value);
    if (showMyPicks) setSortSnapshot([...pickedProductIds]);
  }

  // All categories that actually have at least one product
  const availableValues = useMemo(() => {
    const cats = new Set(products.map((p) => p.category as string));
    return CATEGORY_DEFS.filter((c) => cats.has(c.value)).map((c) => c.value);
  }, [products]);

  // The displayed pill categories: respect visibleCategoryValues ordering
  const displayedCategories = useMemo(() => {
    const visible = visibleCategoryValues;
    if (!visible || visible.length === 0) {
      // Show all available
      return CATEGORY_DEFS.filter((c) => availableValues.includes(c.value));
    }
    return visible
      .filter((v) => availableValues.includes(v))
      .map((v) => ({ value: v, label: categoryLabel(v) }));
  }, [availableValues, visibleCategoryValues]);

  const filtered = useMemo(() => {
    // When a kit is expanded, show only that kit's products (ignoring other filters)
    if (expandedKit) {
      const kitIds = new Set(expandedKit.items.map((i) => i.product.id));
      return products.filter((p) => kitIds.has(p.id));
    }

    let result = products;

    if (showMyPicks && !search.trim() && activeCategory === "ALL") {
      result = result.filter((p) => pickedProductIds.includes(p.id));
    } else {
      if (activeCategory !== "ALL") {
        result = result.filter((p) => (p.category as string) === activeCategory);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (showMyPicks && (search.trim() || activeCategory !== "ALL")) {
      const hasFavoritesInResults = result.some((p) => sortSnapshot.includes(p.id));
      if (hasFavoritesInResults) {
        result = [
          ...result.filter((p) => sortSnapshot.includes(p.id)),
          ...result.filter((p) => !sortSnapshot.includes(p.id)),
        ];
      }
    }

    return result;
  }, [products, search, activeCategory, showMyPicks, pickedProductIds, sortSnapshot, expandedKit]);

  const showFavoritesEmptyState =
    !expandedKit && showMyPicks && !search.trim() && activeCategory === "ALL" && pickedProductIds.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-4 sm:px-6 pt-4 pb-3">
        <Input
          type="text"
          placeholder={showMyPicks ? "Search to add favorites..." : "Search products, brands, or tags..."}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          rightElement={
            search ? (
              <button onClick={() => handleSearchChange("")} className="text-muted hover:text-foreground p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : undefined
          }
        />
      </div>

      {/* Filter row */}
      <div className="px-4 sm:px-6 pb-3">
        <div className="flex items-center gap-1.5">
          {/* Scrollable pills — flex-1 so the + More button stays pinned right */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 flex-1 min-w-0">
            {/* Favorites pill — always visible; guests are redirected to sign-in */}
            <button
                onClick={isSignedIn ? handleToggleFavoritesPill : onGuestFavoritesClick}
                className={[
                  "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  !isSignedIn
                    ? "bg-white border border-[rgba(0,0,0,0.08)] text-[#ccc] hover:text-[#aaa] hover:border-[rgba(0,0,0,0.14)]"
                    : showMyPicks
                    ? "bg-sky-500 text-white"
                    : pickedProductIds.length === 0
                    ? "bg-white border border-[rgba(0,0,0,0.08)] text-[#ccc] cursor-pointer"
                    : "bg-white border border-[rgba(0,0,0,0.08)] text-muted hover:text-foreground hover:border-foreground/20",
                ].join(" ")}
              >
                <svg className="w-3.5 h-3.5" fill={showMyPicks ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
                </svg>
                Favorites
                {isSignedIn && pickedProductIds.length > 0 && (
                  <span className={`text-xs ${showMyPicks ? "text-white/80" : "text-muted"}`}>
                    {pickedProductIds.length}
                  </span>
                )}
              </button>

            {/* Divider between Favorites pill and category pills */}
            <div className="flex-shrink-0 w-px h-4 bg-black/10 mx-0.5" />

            {/* "All" pill */}
            <button
              onClick={() => handleCategoryChange("ALL")}
              className={[
                "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                activeCategory === "ALL"
                  ? "bg-foreground text-white"
                  : "bg-white border border-[rgba(0,0,0,0.08)] text-muted hover:text-foreground hover:border-foreground/20",
              ].join(" ")}
            >
              All
            </button>

            {/* Dynamic category pills */}
            {displayedCategories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={[
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  activeCategory === cat.value
                    ? "bg-foreground text-white"
                    : "bg-white border border-[rgba(0,0,0,0.08)] text-muted hover:text-foreground hover:border-foreground/20",
                ].join(" ")}
              >
                {cat.label}
              </button>
            ))}

            {/* "+" pill — inside scroll row, dropdown renders via portal so it's never clipped */}
            {onCategoriesChange && (
              <button
                ref={plusRef}
                onClick={() => {
                  if (!popoverOpen && plusRef.current) {
                    const rect = plusRef.current.getBoundingClientRect();
                    setPopoverPos({ top: rect.bottom + 4, left: rect.right - 208 });
                  }
                  setPopoverOpen((o) => !o);
                }}
                className={[
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  popoverOpen
                    ? "bg-black/[0.07] text-foreground border border-black/10"
                    : "bg-white border border-[rgba(0,0,0,0.08)] text-muted hover:text-foreground hover:border-foreground/20",
                ].join(" ")}
                aria-label="Customise categories"
              >
                +
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category popover — portal so it renders above all overflow containers */}
      {popoverOpen && onCategoriesChange && (
        <CategoryPopover
          visibleValues={visibleCategoryValues ?? null}
          availableValues={availableValues}
          onChange={(cats) => {
            onCategoriesChange(cats);
            if (activeCategory !== "ALL" && !cats.includes(activeCategory)) {
              setActiveCategory("ALL");
            }
          }}
          onClose={() => setPopoverOpen(false)}
          top={popoverPos.top}
          left={popoverPos.left}
        />
      )}

      {/* Kits row — shown in favorites mode and during kit creation */}
      {(showMyPicks || isKitCreating) && onKitCreate && (
        <div className="px-4 sm:px-6 pb-2">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-1">Kits</p>
          {/* py-2 px-1 gives shadow room so cards don't get clipped by overflow */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-1">
            {kits?.map((kit) => {
              // While editing this specific kit, render KitInProgressCard in its position
              if (isKitCreating && editingKitId === kit.id) {
                return (
                  <KitInProgressCard
                    key={kit.id}
                    kitName={kitName}
                    onKitNameChange={setKitName}
                    selectedProducts={kitSelectedProducts}
                    onSave={handleKitSaveClick}
                  />
                );
              }
              return (
                <KitCard
                  key={kit.id}
                  kit={kit}
                  isNew={kit.id === newKitId}
                  isExpanded={kit.id === expandedKitId}
                  onExpand={handleKitExpand}
                  onLoad={onKitLoad!}
                  onEdit={onKitEdit!}
                  onDelete={onKitDelete!}
                  onRemoveFavorite={onKitRemoveFavorite!}
                  onRename={onKitRename}
                />
              );
            })}
            {/* New Kit slot — KitInProgressCard only for brand-new kits, not edits */}
            {isKitCreating && !editingKitId ? (
              <KitInProgressCard
                kitName={kitName}
                onKitNameChange={setKitName}
                selectedProducts={kitSelectedProducts}
                onSave={handleKitSaveClick}
              />
            ) : (
              <NewKitCard onNewKit={onKitCreate} />
            )}
          </div>
        </div>
      )}

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto">
        {showFavoritesEmptyState ? (
          <div className="px-4 sm:px-6 py-16 text-center">
            <svg className="w-8 h-8 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
            </svg>
            <p className="text-sm text-muted">Search for products to add to your favorites</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 sm:px-6 py-16 text-center">
            <p className="text-muted text-sm">No products found.</p>
            <button
              onClick={() => { handleSearchChange(""); handleCategoryChange("ALL"); }}
              className="mt-2 text-sm underline underline-offset-2 text-muted hover:text-foreground"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div
            className={expandedKit
              ? "mx-3 sm:mx-5 mt-1 mb-5 px-4 py-3 rounded-2xl"
              : "px-4 sm:px-6 pb-6"
            }
            style={expandedKit ? { background: "rgba(0,0,0,0.028)" } : undefined}
          >
            {expandedKit && (
              <div className="flex items-center gap-2 mb-3">
                <div className="group/kithdr flex items-center gap-1.5 flex-1 min-w-0">
                  <svg className="w-3.5 h-3.5 text-[#9a9080] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
                  </svg>
                  <span className="text-xs font-semibold text-[#3a3128] truncate">{expandedKit.name}</span>
                  <span className="text-xs text-muted">· {expandedKit.items.length} item{expandedKit.items.length !== 1 ? "s" : ""}</span>
                  {!isKitCreating && (
                    <button
                      onClick={() => onKitEdit?.(expandedKit)}
                      className="flex-shrink-0 text-muted hover:text-foreground transition-all ml-0.5 opacity-0 group-hover/kithdr:opacity-100"
                      title="Edit kit"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.862 4.487z" />
                      </svg>
                    </button>
                  )}
                </div>
                {isKitCreating ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onKitCreatingChange?.(false)}
                      className="text-xs text-muted hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleKitSaveClick}
                      disabled={!kitName.trim() || kitSelectedIds.size === 0 || kitSaving}
                      className="text-xs font-semibold text-foreground hover:text-foreground/70 disabled:opacity-40 transition-all"
                    >
                      {kitSaving ? "Saving…" : "Save"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setExpandedKitId(null)}
                    className="flex-shrink-0 text-xs text-muted hover:text-foreground transition-colors"
                  >
                    ✕ Close
                  </button>
                )}
              </div>
            )}
            {!isKitCreating && !expandedKit && (
              <p className="text-xs text-muted mb-3">
                {filtered.length} product{filtered.length !== 1 ? "s" : ""}
              </p>
            )}
            {isKitCreating && (
              <p className="text-xs text-muted mb-3">
                Tap products to add or remove from kit
              </p>
            )}
            <div
              className={isKitCreating ? "grid gap-3" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3"}
              style={isKitCreating ? { gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" } : undefined}
            >
              {filtered.map((product) => {
                const isNormalMode = !isKitCreating && !showMyPicks && !expandedKit;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={isKitCreating ? () => toggleKitProduct(product.id) : onAddProduct}
                    isAdded={isKitCreating ? false : selectedProductIds.includes(product.id)}
                    isInKit={isKitCreating ? kitSelectedIds.has(product.id) : false}
                    quantity={isKitCreating ? 1 : (selectedQuantities[product.id] ?? 0)}
                    isPicked={pickedProductIds.includes(product.id)}
                    onTogglePick={isSignedIn ? onTogglePick : undefined}
                    isFavoritesMode={isSignedIn && !isKitCreating && (showMyPicks || !!expandedKit)}
                    onBookmarkMenu={isSignedIn && (isNormalMode || !!expandedKit) && !isKitCreating && onKitAddProduct
                      ? (productId, rect) => setBookmarkMenu({ productId, top: rect.bottom + 4, left: rect.left })
                      : undefined
                    }
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bookmark kit-assignment dropdown */}
      {bookmarkMenu && kits && typeof document !== "undefined" && (
        <BookmarkDropdown
          productId={bookmarkMenu.productId}
          top={bookmarkMenu.top}
          left={bookmarkMenu.left}
          kits={kits}
          pickedProductIds={pickedProductIds}
          onTogglePick={onTogglePick}
          onKitAddProduct={onKitAddProduct}
          onKitRemoveProduct={onKitRemoveProduct}
          onClose={() => setBookmarkMenu(null)}
        />
      )}
    </div>
  );
}
