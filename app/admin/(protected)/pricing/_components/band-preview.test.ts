import { describe, expect, it } from "vitest";

import { pickPreviewWeight, type PreviewCandidate } from "./band-preview";

const candidates: PreviewCandidate[] = [
  { name: "Gold ring", weightGrams: 3.2, metal: "gold", pricingMode: "dynamic_jewellery" },
  { name: "Silver bangle", weightGrams: 12, metal: "silver", pricingMode: "dynamic_jewellery" },
  { name: "Gold coin", weightGrams: 31.1, metal: "gold", pricingMode: "dynamic_bullion" },
];

describe("pickPreviewWeight", () => {
  it("picks a real product whose weight falls inside the range", () => {
    const picked = pickPreviewWeight("jewellery", 0, 5, candidates);
    expect(picked).toEqual({
      weightGrams: 3.2,
      metal: "gold",
      label: "Gold ring",
      isRealProduct: true,
    });
  });

  it("only matches products of the right applies_to", () => {
    const picked = pickPreviewWeight("bullion", 0, 5, candidates);
    expect(picked.isRealProduct).toBe(false);
  });

  it("falls back to the midpoint for an ordinary-width range with no live product", () => {
    const picked = pickPreviewWeight("jewellery", 40, 60, candidates);
    expect(picked).toEqual({ weightGrams: 50, metal: "gold", label: "a sample 50g item", isRealProduct: false });
  });

  it("falls back to min+10 rather than the midpoint for an open-ended top band", () => {
    // 75g+ stored as (75, 9999) — the true midpoint would be a nonsense ~5037g.
    const picked = pickPreviewWeight("jewellery", 75, 9999, candidates);
    expect(picked.isRealProduct).toBe(false);
    expect(picked.weightGrams).toBe(85);
  });

  it("falls back to min+10 for bullion's wide-open 'all' band", () => {
    const picked = pickPreviewWeight("bullion", 0, 9999, []);
    expect(picked.weightGrams).toBe(10);
  });
});
