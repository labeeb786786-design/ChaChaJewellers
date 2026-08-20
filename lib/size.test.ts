import { describe, expect, it } from "vitest";
import {
  BANGLE_DIAMETER_OPTIONS,
  resolveSizeFields,
  RING_LETTER_OPTIONS,
  sizeLabelToInputValue,
} from "./size";

describe("RING_LETTER_OPTIONS", () => {
  it("interleaves each letter with its half size, A to Z", () => {
    expect(RING_LETTER_OPTIONS.slice(0, 4)).toEqual(["A", "A½", "B", "B½"]);
    expect(RING_LETTER_OPTIONS.at(-1)).toBe("Z½");
    expect(RING_LETTER_OPTIONS).toHaveLength(52);
  });
});

describe("resolveSizeFields", () => {
  it("returns nulls for size_type none regardless of input", () => {
    expect(resolveSizeFields("none", "anything")).toEqual({ sizeLabel: null, sizeSort: null });
  });

  it("returns nulls for an empty input", () => {
    expect(resolveSizeFields("ring_letter", "  ")).toEqual({ sizeLabel: null, sizeSort: null });
  });

  describe("ring_letter", () => {
    it("sorts a plain letter as its alphabet position", () => {
      expect(resolveSizeFields("ring_letter", "A")).toEqual({ sizeLabel: "A", sizeSort: 1 });
    });

    it("sorts a half size 0.5 above its letter — N½ sorts as 14.5", () => {
      expect(resolveSizeFields("ring_letter", "N½")).toEqual({ sizeLabel: "N½", sizeSort: 14.5 });
    });

    it("rejects a label that isn't a single letter (+ optional half)", () => {
      expect(resolveSizeFields("ring_letter", "AB")).toEqual({ sizeLabel: null, sizeSort: null });
    });
  });

  describe("bangle_diameter", () => {
    // The brief example set, verified against the exact conversions given:
    // 2.2->2.125, 2.4->2.25, 2.6->2.375, 2.8->2.5, 2.10->2.625, 2.12->2.75
    it.each([
      ["2.2", 2.125],
      ["2.4", 2.25],
      ["2.6", 2.375],
      ["2.8", 2.5],
      ["2.10", 2.625],
      ["2.12", 2.75],
    ])("converts %s (sixteenths) to %s (true measurement)", (label, expected) => {
      expect(resolveSizeFields("bangle_diameter", label)).toEqual({ sizeLabel: label, sizeSort: expected });
    });

    it("sorts 2.10 above 2.8, unlike decimal ordering", () => {
      const a = resolveSizeFields("bangle_diameter", "2.8").sizeSort!;
      const b = resolveSizeFields("bangle_diameter", "2.10").sizeSort!;
      expect(b).toBeGreaterThan(a);
    });

    it("every dropdown option resolves to a sortable value", () => {
      for (const option of BANGLE_DIAMETER_OPTIONS) {
        expect(resolveSizeFields("bangle_diameter", option).sizeSort).not.toBeNull();
      }
    });
  });

  describe("length_inches", () => {
    it("appends an inch mark to the label and keeps the plain number as the sort value", () => {
      expect(resolveSizeFields("length_inches", "18")).toEqual({ sizeLabel: '18"', sizeSort: 18 });
    });

    it("rejects a non-numeric input", () => {
      expect(resolveSizeFields("length_inches", "long")).toEqual({ sizeLabel: null, sizeSort: null });
    });
  });

  describe("hoop_mm", () => {
    it("appends mm to the label and keeps the plain number as the sort value", () => {
      expect(resolveSizeFields("hoop_mm", "25")).toEqual({ sizeLabel: "25mm", sizeSort: 25 });
    });
  });
});

describe("sizeLabelToInputValue", () => {
  it("strips the inch mark back off for length_inches", () => {
    expect(sizeLabelToInputValue("length_inches", '18"')).toBe("18");
  });

  it("strips mm back off for hoop_mm", () => {
    expect(sizeLabelToInputValue("hoop_mm", "25mm")).toBe("25");
  });

  it("returns the label as-is for ring_letter and bangle_diameter", () => {
    expect(sizeLabelToInputValue("ring_letter", "N½")).toBe("N½");
    expect(sizeLabelToInputValue("bangle_diameter", "2.10")).toBe("2.10");
  });

  it("returns an empty string for a null label", () => {
    expect(sizeLabelToInputValue("length_inches", null)).toBe("");
  });
});
