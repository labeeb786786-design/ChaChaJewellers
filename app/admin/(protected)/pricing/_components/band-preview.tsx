"use client";

import { useEffect, useState } from "react";

import { formatMoney } from "@/lib/money";
import type { BandApplies } from "@/lib/schemas/pricing";
import type { MetalEnum, PricingModeEnum } from "@/types/db";

const DEBOUNCE_MS = 400;

export type PreviewCandidate = { name: string; weightGrams: number; metal: MetalEnum; pricingMode: PricingModeEnum };

type Picked = { weightGrams: number; metal: MetalEnum; label: string; isRealProduct: boolean };

/**
 * Anchors the preview to a real product wherever one exists in the band's
 * range — "the resulting price on a real product," per the brief. Falls
 * back to a representative sample point just above the floor when nothing
 * does (true for 75g+ and bullion today, both still at 0% pending the
 * client): a plain midpoint breaks for an open-ended top band, since 9999g
 * is a database sentinel for "no ceiling," not a real weight.
 */
export function pickPreviewWeight(
  appliesTo: BandApplies,
  minWeightG: number,
  maxWeightG: number,
  candidates: PreviewCandidate[],
): Picked {
  const wantedMode: PricingModeEnum = appliesTo === "bullion" ? "dynamic_bullion" : "dynamic_jewellery";
  const match = candidates.find(
    (c) => c.pricingMode === wantedMode && c.weightGrams >= minWeightG && c.weightGrams < maxWeightG,
  );
  if (match) {
    return { weightGrams: match.weightGrams, metal: match.metal, label: match.name, isRealProduct: true };
  }

  const width = maxWeightG - minWeightG;
  const sample = width < 200 ? (minWeightG + maxWeightG) / 2 : minWeightG + 10;
  const rounded = Math.round(sample * 100) / 100;
  return { weightGrams: rounded, metal: "gold", label: `a sample ${rounded}g item`, isRealProduct: false };
}

type Outcome =
  | { status: "error"; message: string }
  | { status: "success"; picked: Picked; beforePence: number | null; afterPence: number };

/** Last settled fetch, tagged with the input key it was fetched for — "loading" is derived at render time by comparing this to the current key, the same pattern use-price-preview.ts uses, rather than a setState call in the effect body for a transition that isn't itself async. */
type LastFetch = { key: string; outcome: Outcome };

function inputKey(
  appliesTo: BandApplies,
  minWeightG: number,
  maxWeightG: number,
  markupPercent: number,
  vatPercent: number,
): string {
  return `${appliesTo}:${minWeightG}:${maxWeightG}:${markupPercent}:${vatPercent}`;
}

export function BandPreview({
  appliesTo,
  minWeightG,
  maxWeightG,
  markupPercent,
  vatPercent,
  candidates,
}: {
  appliesTo: BandApplies;
  minWeightG: number;
  maxWeightG: number;
  markupPercent: number;
  vatPercent: number;
  candidates: PreviewCandidate[];
}) {
  const [lastFetch, setLastFetch] = useState<LastFetch | null>(null);

  const validRange = Number.isFinite(minWeightG) && Number.isFinite(maxWeightG) && maxWeightG > minWeightG;
  const validPercents =
    Number.isFinite(markupPercent) && markupPercent >= 0 && Number.isFinite(vatPercent) && vatPercent >= 0;

  useEffect(() => {
    if (!validRange || !validPercents) return;

    const picked = pickPreviewWeight(appliesTo, minWeightG, maxWeightG, candidates);
    const key = inputKey(appliesTo, minWeightG, maxWeightG, markupPercent, vatPercent);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      let outcome: Outcome;
      try {
        const params = new URLSearchParams({
          metal: picked.metal,
          appliesTo,
          weightGrams: String(picked.weightGrams),
        });
        const response = await fetch(`/api/admin/price-preview?${params}`, { signal: controller.signal });
        const body = await response.json();

        if (!response.ok) {
          outcome = { status: "error", message: body.error ?? "Could not calculate the price." };
        } else if (body.rate === null) {
          outcome = { status: "error", message: "No gold rate has been recorded yet." };
        } else {
          // The one deliberate exception to "never reimplement the
          // markup/VAT arithmetic client-side" (lib/pricing.ts's
          // calculatePrice()): there is no saved band yet for these
          // typed-but-unsaved values, so no DB function can compute them.
          // "Before" always comes straight from
          // calculate_dynamic_price_pence, via the currently-saved band —
          // this mirrors that exact formula (rate x weight x (1+markup%) x
          // (1+vat%), rounded) purely to preview a hypothetical that
          // cannot exist in the database until Save is clicked, and is
          // never written anywhere.
          const metalCostPence = picked.weightGrams * body.rate;
          const beforeVatPence = metalCostPence * (1 + markupPercent / 100);
          const afterPence = Math.round(beforeVatPence * (1 + vatPercent / 100));
          outcome = { status: "success", picked, beforePence: body.totalPence, afterPence };
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        outcome = { status: "error", message: "Could not reach the server to calculate the price." };
      }

      setLastFetch({ key, outcome });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [appliesTo, minWeightG, maxWeightG, markupPercent, vatPercent, candidates, validRange, validPercents]);

  if (!validRange || !validPercents) {
    return <p className="text-xs text-admin-faint">Fill in the range and percentages to preview a price.</p>;
  }

  const currentKey = inputKey(appliesTo, minWeightG, maxWeightG, markupPercent, vatPercent);
  const isFresh = lastFetch?.key === currentKey;

  if (!isFresh) {
    return <p className="text-xs text-admin-muted">Calculating…</p>;
  }
  if (lastFetch.outcome.status === "error") {
    return <p className="text-xs text-admin-danger">{lastFetch.outcome.message}</p>;
  }

  const { picked, beforePence, afterPence } = lastFetch.outcome;
  const isLoss = beforePence !== null && afterPence < beforePence;

  return (
    <div className="rounded-admin-control bg-[#f5f3ee] px-3 py-2.5">
      <p className="text-xs text-admin-faint">
        Previewing{" "}
        {picked.isRealProduct ? (
          <>
            <strong className="font-medium text-admin-muted">{picked.label}</strong>, {picked.weightGrams}g
          </>
        ) : (
          <>no live product in this range yet — using {picked.label}</>
        )}
      </p>
      <div className="mt-1.5 flex items-baseline justify-between gap-3">
        <span className="font-admin-mono text-sm text-admin-muted">
          Before: {beforePence !== null ? formatMoney(beforePence) : "not currently priced"}
        </span>
        <span
          className={`font-admin-mono text-base font-semibold tabular-nums ${isLoss ? "text-admin-danger" : "text-admin-ink"}`}
        >
          After: {formatMoney(afterPence)}
        </span>
      </div>
    </div>
  );
}
