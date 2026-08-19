"use client";

import { formatMoney, parseMoney } from "@/lib/money";
import type { PricingModeEnum } from "@/types/db";
import { Modal } from "./modal";
import type { PricePreview } from "./use-price-preview";

function priceSummary(pricingMode: PricingModeEnum, fixedPrice: string, preview: PricePreview): string | null {
  if (pricingMode === "fixed") {
    try {
      return formatMoney(parseMoney(fixedPrice.trim()));
    } catch {
      return null;
    }
  }
  return preview.status === "success" && preview.totalPence !== null ? formatMoney(preview.totalPence) : null;
}

/**
 * Shown when Publish is clicked, before anything is saved. The point isn't
 * ceremony — it's catching a mistyped weight (32g for 3.2g) at the moment
 * the price becomes real, per the addendum. "No, review pricing formula"
 * routes to Pricing rather than just closing, since a price that looks
 * wrong might mean the band's markup is wrong, not just the weight.
 */
export function PublishConfirmDialog({
  productName,
  pricingMode,
  fixedPrice,
  preview,
  isSubmitting,
  error,
  onConfirm,
  onReviewPricing,
  onCancel,
}: {
  productName: string;
  pricingMode: PricingModeEnum;
  fixedPrice: string;
  preview: PricePreview;
  isSubmitting: boolean;
  error: string | null;
  onConfirm: () => void;
  onReviewPricing: () => void;
  onCancel: () => void;
}) {
  const price = priceSummary(pricingMode, fixedPrice, preview);

  return (
    <Modal
      labelledBy="publish-dialog-title"
      onClose={() => {
        if (!isSubmitting) onCancel();
      }}
    >
      <h3 id="publish-dialog-title" className="mb-2 text-base font-bold text-admin-ink">
        Publish {productName.trim() || "this product"}?
      </h3>
      <p className="mb-3 text-sm text-admin-muted">
        Double check the weight is right — a mistyped weight (32g for 3.2g) becomes a real price the
        moment this goes live.
      </p>

      <div className="mb-3 rounded-admin-control bg-[#f5f3ee] px-3 py-2.5 text-center">
        <div className="font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
          Sells for
        </div>
        <div className="font-admin-mono text-2xl font-semibold tracking-tight text-admin-ink tabular-nums">
          {price ?? "—"}
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-admin-danger">{error}</p>}

      <div className="grid gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting || price === null}
          className="w-full rounded-admin-control bg-admin-ink px-3.5 py-2.5 text-sm font-medium text-white hover:bg-[#33312c] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Publishing…" : "Yes, publish"}
        </button>
        <button
          type="button"
          onClick={onReviewPricing}
          disabled={isSubmitting}
          className="w-full rounded-admin-control border border-admin-rule-strong bg-admin-surface px-3.5 py-2.5 text-sm font-medium text-admin-ink hover:bg-[#f5f3ee] disabled:cursor-not-allowed disabled:opacity-60"
        >
          No, review pricing formula
        </button>
      </div>
    </Modal>
  );
}
