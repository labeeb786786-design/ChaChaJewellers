import { describe, expect, it } from "vitest";
import { pricingModeForCategorySlug } from "./pricing";

describe("pricingModeForCategorySlug", () => {
  it("maps bullion to dynamic_bullion", () => {
    expect(pricingModeForCategorySlug("bullion")).toBe("dynamic_bullion");
  });

  it("maps diamond to fixed", () => {
    expect(pricingModeForCategorySlug("diamond")).toBe("fixed");
  });

  it.each(["rings", "bangles", "necklaces", "chains", "earrings", "studs", "hoops", "kantai", "sets"])(
    "maps %s to dynamic_jewellery",
    (slug) => {
      expect(pricingModeForCategorySlug(slug)).toBe("dynamic_jewellery");
    },
  );

  it("defaults an unknown slug to dynamic_jewellery, not an error", () => {
    expect(pricingModeForCategorySlug("some-future-category")).toBe("dynamic_jewellery");
  });
});
