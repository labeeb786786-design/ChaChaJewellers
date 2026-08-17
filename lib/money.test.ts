import { describe, expect, it } from "vitest";
import { formatMoney, parseMoney } from "./money";

describe("parseMoney", () => {
  it("parses a plain pounds-and-pence string", () => {
    expect(parseMoney("1295.00")).toBe(129500);
  });

  it("parses a whole-pounds string with no decimal", () => {
    expect(parseMoney("1295")).toBe(129500);
  });

  it("strips a leading £ and thousands commas", () => {
    expect(parseMoney("£1,295.00")).toBe(129500);
  });

  it("pads a single decimal digit", () => {
    expect(parseMoney("10.1")).toBe(1010);
  });

  it("is exact for values that trip up float arithmetic", () => {
    expect(parseMoney("19.99")).toBe(1999);
    expect(parseMoney("0.05")).toBe(5);
    expect(parseMoney("0.10")).toBe(10);
  });

  it("trims surrounding whitespace", () => {
    expect(parseMoney("  129.50  ")).toBe(12950);
  });

  it.each(["abc", "-5", "5.999", "", "5.", "1..5", "1 2"])(
    "rejects %j",
    (input) => {
      expect(() => parseMoney(input)).toThrow();
    },
  );
});

describe("formatMoney", () => {
  it("formats pence as a £-prefixed amount", () => {
    expect(formatMoney(129500)).toBe("£1,295.00");
  });

  it("zero-pads pence under 10", () => {
    expect(formatMoney(5)).toBe("£0.05");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("£0.00");
  });

  it("groups thousands", () => {
    expect(formatMoney(123456789)).toBe("£1,234,567.89");
  });

  it("rejects negative pence", () => {
    expect(() => formatMoney(-1)).toThrow();
  });

  it("rejects a non-integer", () => {
    expect(() => formatMoney(129.5)).toThrow();
  });
});

describe("round trip", () => {
  it("parseMoney(formatMoney(x)) returns x", () => {
    for (const pence of [0, 5, 100, 12950, 129500, 123456789]) {
      expect(parseMoney(formatMoney(pence))).toBe(pence);
    }
  });
});
