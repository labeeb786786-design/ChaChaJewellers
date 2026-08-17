/**
 * Money is always an integer number of pence — 38880 means £388.80. Never
 * store a float, never do arithmetic on a formatted string. Parse and format
 * only through these two functions.
 */

/**
 * Parses a pounds string typed by an admin (e.g. "1295", "1,295.00", "£129.5")
 * into an integer number of pence. Parses digit-by-digit rather than via
 * parseFloat, so there's no floating-point rounding to worry about.
 */
export function parseMoney(input: string): number {
  const cleaned = input.trim().replace(/^£/, "").replace(/,/g, "");

  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    throw new Error(
      `"${input}" isn't a valid amount. Enter a plain number like 1295.00.`,
    );
  }

  const [poundsPart, penceRaw = ""] = cleaned.split(".");
  const pencePart = (penceRaw + "00").slice(0, 2);

  return parseInt(poundsPart, 10) * 100 + parseInt(pencePart, 10);
}

/** Formats an integer number of pence as a £-prefixed, comma-grouped string. */
export function formatMoney(pence: number): string {
  if (!Number.isInteger(pence) || pence < 0) {
    throw new Error(
      `formatMoney expects a non-negative integer number of pence, got ${pence}.`,
    );
  }

  const pounds = Math.floor(pence / 100);
  const remainder = (pence % 100).toString().padStart(2, "0");
  const groupedPounds = pounds.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `£${groupedPounds}.${remainder}`;
}
