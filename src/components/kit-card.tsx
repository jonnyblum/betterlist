"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { KitWithItems, KitProduct } from "@/lib/types/kit";

// Rotation angles for the thumbnail fan — applied in order to whichever products are in the kit
const FAN_ROTATIONS = [-6, -2, 3, 7];

// ─── Thumbnail fan ─────────────────────────────────────────────────────────────

function ThumbnailFan({ kit }: { kit: KitWithItems }) {
  const shown = kit.items.slice(0, 4);
  const extra = Math.max(0, kit.items.length - 4);
  const total = shown.length + (extra > 0 ? 1 : 0);
  // Each circle is 32px, overlap offset is 16px
  const containerWidth = total <= 1 ? 32 : (total - 1) * 16 + 32;

  return (
    <div className="relative mb-2" style={{ height: 40, width: containerWidth + 8 }}>
      {shown.map((item, i) => (
        <div
          key={item.id}
          className="absolute w-8 h-8 rounded-full bg-white border-2 border-[#EDE9E0] overflow-hidden shadow-sm flex items-center justify-center"
          style={{
            left: i * 16,
            top: 4,
            transform: `rotate(${FAN_ROTATIONS[i] ?? 0}deg)`,
            zIndex: i + 1,
          }}
        >
          {item.product.imageUrl ? (
            <Image
              src={item.product.imageUrl}
              alt={item.product.name}
              fill
              className="object-cover"
              sizes="32px"
            />
          ) : (
            <span className="text-[9px] font-bold text-[#9a9080] select-none leading-none">
              {item.product.brand.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      ))}
      {extra > 0 && (
        <div
          className="absolute w-8 h-8 rounded-full bg-[#d8d3c8] border-2 border-[#EDE9E0] flex items-center justify-center shadow-sm"
          style={{ left: shown.length * 16, top: 4, zIndex: shown.length + 1 }}
        >
          <span className="text-[9px] font-bold text-[#6b6358]">+{extra}</span>
        </div>
      )}
    </div>
  );
}

// ─── In-progress fan (builds up as products are selected) ─────────────────────

function InProgressFan({ products }: { products: KitProduct[] }) {
  const shown = products.slice(0, 4);
  const extra = Math.max(0, products.length - 4);
  const total = shown.length + (extra > 0 ? 1 : 0);
  const containerWidth = total <= 1 ? 32 : (total - 1) * 16 + 32;

  if (shown.length === 0) {
    return (
      <div className="relative mb-2" style={{ height: 40, width: 40 }}>
        <div
          className="absolute w-8 h-8 rounded-full bg-[#d8d3c8] border-2 border-dashed border-[#c4beb4] flex items-center justify-center"
          style={{ left: 0, top: 4 }}
        >
          <svg className="w-3 h-3 text-[#9a9080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-2" style={{ height: 40, width: containerWidth + 8 }}>
      {shown.map((product, i) => (
        <div
          key={product.id}
          className="absolute w-8 h-8 rounded-full bg-white border-2 border-[#EDE9E0] overflow-hidden shadow-sm flex items-center justify-center"
          style={{
            left: i * 16,
            top: 4,
            transform: `rotate(${FAN_ROTATIONS[i] ?? 0}deg)`,
            zIndex: i + 1,
          }}
        >
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="32px" />
          ) : (
            <span className="text-[9px] font-bold text-[#9a9080] select-none leading-none">
              {product.brand.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      ))}
      {extra > 0 && (
        <div
          className="absolute w-8 h-8 rounded-full bg-[#d8d3c8] border-2 border-[#EDE9E0] flex items-center justify-center shadow-sm"
          style={{ left: shown.length * 16, top: 4, zIndex: shown.length + 1 }}
        >
          <span className="text-[9px] font-bold text-[#6b6358]">+{extra}</span>
        </div>
      )}
    </div>
  );
}

// ─── Kit in-progress card (replaces NewKitCard during creation) ────────────────

export interface KitInProgressCardProps {
  kitName: string;
  onKitNameChange: (name: string) => void;
  selectedProducts: KitProduct[];
  onSave: () => void;
}

export function KitInProgressCard({
  kitName,
  onKitNameChange,
  selectedProducts,
  onSave,
}: KitInProgressCardProps) {
  const count = selectedProducts.length;

  return (
    <div
      className="flex-shrink-0 relative w-[170px] rounded-2xl p-2 select-none"
      style={{
        background: "#F5F2EC",
        boxShadow: "0 1px 0 2px #ede9e0, 0 2px 0 4px #e3dfd6, 0 2px 6px rgba(0,0,0,0.07)",
      }}
    >
      {/* Bookmark + count (top-right) */}
      <div className="absolute top-1.5 right-1.5 flex flex-col items-center gap-0 text-[#b0a898] pointer-events-none">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
        </svg>
        <span className="text-[9px] font-bold leading-none -mt-0.5">{count}</span>
      </div>

      {/* Live fan */}
      <InProgressFan products={selectedProducts} />

      {/* Name input */}
      <input
        type="text"
        value={kitName}
        onChange={(e) => onKitNameChange(e.target.value)}
        placeholder="Name this kit…"
        autoFocus
        onKeyDown={(e) => { if (e.key === "Enter" && kitName.trim() && count > 0) onSave(); }}
        className="w-full bg-transparent text-xs font-semibold text-[#3a3128] placeholder:text-[#b8b0a4] focus:outline-none pr-6 leading-snug border-b border-[#c9c4ba] pb-0.5"
      />
    </div>
  );
}

// ─── Kit card ──────────────────────────────────────────────────────────────────

interface KitCardProps {
  kit: KitWithItems;
  isNew?: boolean;
  isExpanded?: boolean;
  onExpand?: (kit: KitWithItems | null) => void;
  onLoad: (kit: KitWithItems) => void;
  onEdit: (kit: KitWithItems) => void;
  onDelete: (kit: KitWithItems) => void;
  onRemoveFavorite: (kit: KitWithItems) => void;
  onRename?: (kit: KitWithItems, newName: string) => void;
}

export function KitCard({ kit, isNew, isExpanded, onExpand, onLoad, onEdit, onDelete, onRename }: KitCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(kit.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const dotButtonRef = useRef<HTMLButtonElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click or scroll
  useEffect(() => {
    if (!menuOpen) return;
    function close() { setMenuOpen(false); }
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          dotButtonRef.current && !dotButtonRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("scroll", close, true);
    };
  }, [menuOpen]);

  // Focus rename input when entering rename mode
  useEffect(() => {
    if (isRenaming) {
      setRenameValue(kit.name);
      setTimeout(() => renameRef.current?.select(), 0);
    }
  }, [isRenaming, kit.name]);

  function submitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== kit.name) {
      onRename?.(kit, trimmed);
    }
    setIsRenaming(false);
  }

  return (
    <div className="relative flex-shrink-0 group">
      <div
        className={[
          "relative w-[170px] rounded-2xl p-2 overflow-hidden cursor-pointer select-none transition-transform active:scale-[0.97]",
          isNew ? "animate-kit-appear" : "",
          isExpanded ? "ring-2 ring-inset ring-[#9a9080]/40" : "",
        ].join(" ")}
        style={{
          background: "#F5F2EC",
          boxShadow: isExpanded
            ? "0 1px 0 2px #ede9e0, 0 2px 0 4px #e3dfd6, 0 2px 6px rgba(0,0,0,0.07)"
            : "0 0 0 1px #eae6dc, 0 1px 2px rgba(0,0,0,0.04)",
        }}
        onClick={() => { if (!isRenaming) onExpand?.(isExpanded ? null : kit); }}
      >
        {/* Bookmark + count — desktop only, fades out on hover */}
        <div className="absolute top-1.5 right-1.5 flex flex-col items-center gap-0 text-[#b0a898] pointer-events-none z-10 transition-opacity duration-150 hidden lg:flex lg:group-hover:opacity-0">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
          </svg>
          <span className="text-[9px] font-bold leading-none -mt-0.5">{kit.items.length}</span>
        </div>

        {/* Three-dot — mobile always (low opacity) + desktop on hover */}
        <div
          className="absolute right-1.5 z-20 transition-opacity duration-150 bottom-1.5 lg:bottom-auto lg:top-1.5 opacity-40 lg:opacity-0 lg:group-hover:opacity-100"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            ref={dotButtonRef}
            onClick={() => {
              if (!menuOpen && dotButtonRef.current) {
                const rect = dotButtonRef.current.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, left: rect.right - 144 });
              }
              setMenuOpen((o) => !o);
            }}
            className={[
              "w-5 h-5 rounded-md flex items-center justify-center transition-all",
              menuOpen ? "bg-[#d9d4c9] text-[#3a3128]" : "hover:bg-[#d9d4c9] text-[#8a7f72]",
            ].join(" ")}
            title="More options"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>

          {menuOpen && typeof document !== "undefined" && createPortal(
            <div
              ref={menuRef}
              className="fixed z-[9999] w-36 bg-white rounded-xl py-1 border border-black/[0.08] shadow-xl"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <button
                onClick={() => { setMenuOpen(false); onEdit(kit); }}
                className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-black/[0.04] transition-colors"
              >
                Edit kit
              </button>
              <button
                onClick={() => { setMenuOpen(false); setIsRenaming(true); }}
                className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-black/[0.04] transition-colors"
              >
                Rename
              </button>
              <div className="mx-2.5 my-0.5 border-t border-black/[0.06]" />
              <button
                onClick={() => { setMenuOpen(false); onDelete(kit); }}
                className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
              >
                Delete Kit
              </button>
            </div>,
            document.body
          )}
        </div>

        <ThumbnailFan kit={kit} />

        {/* Kit name — static or inline rename input */}
        {isRenaming ? (
          <input
            ref={renameRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") setIsRenaming(false);
              e.stopPropagation();
            }}
            onBlur={submitRename}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-xs font-semibold text-[#3a3128] focus:outline-none pr-6 leading-snug border-b border-[#a09080] pb-0.5"
          />
        ) : (
          <p className="text-xs font-semibold text-[#3a3128] leading-snug truncate pr-4">{kit.name}</p>
        )}

        {/* Add all — bottom-right corner, ~1/4 width × ~1/2 height of card */}
        <button
          className="absolute right-0 z-10 w-[65px] h-[32px] flex items-center justify-center whitespace-nowrap text-[11px] font-medium text-[#5a5148] bg-[#e3dfd6] hover:bg-[#d9d4c9] transition-all duration-150 top-0 lg:top-auto lg:bottom-0 rounded-bl-lg lg:rounded-bl-none lg:rounded-tl-lg opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onLoad(kit); }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Add all to recommendation"
        >
          Add all →
        </button>
      </div>
    </div>
  );
}

// ─── New kit card ──────────────────────────────────────────────────────────────

export function NewKitCard({ onNewKit }: { onNewKit: () => void }) {
  return (
    <button
      onClick={onNewKit}
      className="flex-shrink-0 w-[170px] rounded-2xl border-2 border-dashed border-[#c4beb4] flex flex-col items-center justify-center gap-1.5 hover:border-[#a09890] hover:bg-[#f5f2ec] transition-all active:scale-[0.97] cursor-pointer"
    >
      <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#c4beb4] flex items-center justify-center">
        <svg className="w-4 h-4 text-[#a09890]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <span className="text-xs font-medium text-[#a09890]">New Kit</span>
    </button>
  );
}
