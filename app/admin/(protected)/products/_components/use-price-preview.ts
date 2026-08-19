"use client";

import { useEffect, useState } from "react";

import { appliesToForMode } from "@/lib/pricing";
import type { MetalEnum, PricingModeEnum } from "@/types/db";

const DEBOUNCE_MS = 400;

export type PricePreviewBand = { label: string; markupPercent: number; vatPercent: number };

export type PricePreview =
  | { status: "empty" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      weight: number;
      metal: MetalEnum;
      appliesTo: "jewellery" | "bullion";
      rate: number | null;
      band: PricePreviewBand | null;
      totalPence: number | null;
    };

type PreviewOutcome =
  | { status: "error"; message: string }
  | { status: "success"; rate: number | null; band: PricePreviewBand | null; totalPence: number | null };

/**
 * The last fetch's outcome, tagged with the inputs it was fetched for.
 * "Loading" isn't stored as a status here — it's derived at render time by
 * comparing this to the current inputs, so the fetch effect never needs to
 * setState just to announce "started" (React's set-state-in-effect lint
 * rule flags exactly that).
 */
type LastFetch = {
  weight: number;
  metal: MetalEnum;
  appliesTo: "jewellery" | "bullion";
  outcome: PreviewOutcome;
};

/**
 * Debounced live price lookup against /api/admin/price-preview, shared by
 * the price breakdown panel (display) and product-form.tsx (the Publish
 * button's disabled state and the publish-confirmation dialog) — one fetch,
 * one source of truth, not two independent copies drifting apart.
 *
 * For fixed pricing this always returns "empty" (appliesToForMode returns
 * null for "fixed") — callers treat that as "not applicable," fixed-mode
 * products price from what was typed, not a live lookup.
 */
export function usePricePreview(
  pricingMode: PricingModeEnum,
  metal: MetalEnum,
  weightGrams: string,
): PricePreview {
  const appliesTo = appliesToForMode(pricingMode);
  const parsedWeight = Number(weightGrams);
  const hasValidWeight = weightGrams.trim() !== "" && Number.isFinite(parsedWeight) && parsedWeight > 0;

  const [lastFetch, setLastFetch] = useState<LastFetch | null>(null);

  useEffect(() => {
    if (!appliesTo || !hasValidWeight) return;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      let outcome: PreviewOutcome;
      try {
        const params = new URLSearchParams({
          metal,
          appliesTo,
          weightGrams: String(parsedWeight),
        });
        const response = await fetch(`/api/admin/price-preview?${params}`, {
          signal: controller.signal,
        });
        const body = await response.json();

        outcome = response.ok
          ? { status: "success", rate: body.rate, band: body.band, totalPence: body.totalPence }
          : { status: "error", message: body.error ?? "Could not calculate the price." };
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        outcome = { status: "error", message: "Could not reach the server to calculate the price." };
      }

      setLastFetch({ weight: parsedWeight, metal, appliesTo, outcome });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [appliesTo, hasValidWeight, parsedWeight, metal]);

  if (!appliesTo || !hasValidWeight) return { status: "empty" };

  const isFresh =
    lastFetch !== null &&
    lastFetch.weight === parsedWeight &&
    lastFetch.metal === metal &&
    lastFetch.appliesTo === appliesTo;

  if (!isFresh) return { status: "loading" };
  if (lastFetch.outcome.status === "error") return lastFetch.outcome;

  return {
    status: "success",
    weight: parsedWeight,
    metal,
    appliesTo,
    rate: lastFetch.outcome.rate,
    band: lastFetch.outcome.band,
    totalPence: lastFetch.outcome.totalPence,
  };
}
