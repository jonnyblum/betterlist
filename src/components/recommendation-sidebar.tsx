"use client";

import { INTRO_EFFECTS_ENABLED } from "@/lib/feature-flags";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidEmail, isValidPhone } from "@/lib/utils";
import type { Product } from "@prisma/client";

export interface CartItem {
  product: Product;
  quantity: number;
}

// ─── Shared product row (used in both edit and read-only modes) ────────────────

export function ProductRows({
  items,
  onRemoveItem,
}: {
  items: CartItem[];
  onRemoveItem?: (productId: string) => void;
}) {
  const readOnly = !onRemoveItem;

  if (items.length === 0 && !readOnly) {
    return (
      <div className="flex h-full flex-col items-center px-5 text-center">
        <div className="flex-[5]" />
        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="text-sm text-muted">Tap a product to add it here</p>
        <div className="flex-[7]" />
      </div>
    );
  }

  return (
    <div className="divide-y divide-[rgba(0,0,0,0.04)]">
      {items.map((item) => (
        <div key={item.product.id} className="flex items-start gap-3 px-5 py-3">
          {/* Image */}
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
            {item.product.imageUrl ? (
              <Image
                src={item.product.imageUrl}
                alt={item.product.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-300 select-none">
                  {item.product.brand.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted truncate">{item.product.brand}</p>
            <p className="text-sm font-medium text-foreground leading-tight truncate">
              {item.product.name}
            </p>
            {item.quantity > 1 && (
              <p className="text-xs text-muted">Qty {item.quantity}</p>
            )}
          </div>

          {/* Remove — only in edit mode */}
          {!readOnly && (
            <button
              onClick={() => onRemoveItem!(item.product.id)}
              className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-muted hover:bg-red-100 hover:text-red-500 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Full sidebar (edit mode) ─────────────────────────────────────────────────

interface RecommendationSidebarProps {
  items: CartItem[];
  note: string;
  patientIdentifier: string;
  onNoteChange: (note: string) => void;
  onPatientIdentifierChange: (value: string) => void;
  onRemoveItem: (productId: string) => void;
  onSend: () => void;
  sending: boolean;
  error: string;
  onSaveAsKit?: () => void;
  shimmerOnMount?: boolean;
}

function validateIdentifier(value: string): boolean {
  return isValidEmail(value) || isValidPhone(value);
}

export function RecommendationSidebar({
  items,
  note,
  patientIdentifier,
  onNoteChange,
  onPatientIdentifierChange,
  onRemoveItem,
  onSend,
  sending,
  error,
  onSaveAsKit,
  shimmerOnMount,
}: RecommendationSidebarProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const isValid = items.length > 0 && validateIdentifier(patientIdentifier);

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-[rgba(0,0,0,0.06)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Recommendation</h2>
          <div className="flex items-center gap-2">
            {/* Save as Kit bookmark — shown when 2+ items */}
            {items.length >= 2 && onSaveAsKit && (
              <button
                onClick={onSaveAsKit}
                title="Save as Kit"
                className="text-muted hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
                </svg>
              </button>
            )}
            {items.length > 0 && (
              <span className="bg-foreground text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable items */}
      <div className="flex-1 overflow-y-auto">
        <ProductRows items={items} onRemoveItem={onRemoveItem} />
      </div>

      {/* Footer: note + patient + send */}
      <div className="border-t border-[rgba(0,0,0,0.05)] px-5 py-4 space-y-3">
        {/* Note — collapsible, only shown when cart has items */}
        {items.length > 0 && <div>
          {!noteOpen ? (
            <button
              type="button"
              onClick={() => setNoteOpen(true)}
              className="flex items-center gap-2 text-sm text-muted w-full text-left hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {note ? <span className="truncate">{note}</span> : "Add note"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setNoteOpen(false)}
              className="flex items-center gap-1.5 text-sm font-medium text-foreground w-full text-left mb-2"
            >
              <svg className="w-3.5 h-3.5 text-muted rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              Note to patient
            </button>
          )}
          {noteOpen && (
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add a note (optional)..."
              rows={2}
              autoFocus
              className="w-full bg-white border border-[rgba(0,0,0,0.1)] rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-foreground resize-none"
            />
          )}
        </div>}

        {/* Patient identifier */}
        <Input
          type="text"
          label="Send to (phone or email)"
          placeholder="+1 201 555 0123 or email"
          value={patientIdentifier}
          onChange={(e) => onPatientIdentifierChange(e.target.value)}
          error={error}
        />

        {/* Send button */}
        <div className="relative overflow-hidden rounded-xl">
          <Button
            fullWidth
            size="lg"
            onClick={onSend}
            loading={sending}
            disabled={!isValid}
          >
            Send Recommendation
          </Button>
          {INTRO_EFFECTS_ENABLED && shimmerOnMount && (
            <div className="shimmer-sweep" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
}
