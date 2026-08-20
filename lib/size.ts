import type { SizeTypeEnum } from "@/types/db";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** A, A½, B, B½, ... Z, Z½ — every ring size the dropdown offers, in order. */
export const RING_LETTER_OPTIONS: string[] = ALPHABET.split("").flatMap((letter) => [letter, `${letter}½`]);

/** The certified bangle diameters the dropdown offers, in order. */
export const BANGLE_DIAMETER_OPTIONS: string[] = ["2.2", "2.4", "2.6", "2.8", "2.10", "2.12"];

/**
 * "2.10" means two inches and ten SIXTEENTHS of an inch (2.625"), not the
 * decimal 2.10 (2.1"). Sorted as decimals, "2.10" would wrongly land before
 * "2.8" (two and a half, 2.5"). This computes the true measurement from the
 * label rather than a lookup table, so it stays correct if more certified
 * sizes are ever added.
 */
function bangleDiameterSort(label: string): number | null {
  const match = /^(\d+)\.(\d+)$/.exec(label);
  if (!match) return null;
  const whole = Number(match[1]);
  const sixteenths = Number(match[2]);
  return whole + sixteenths / 16;
}

/** A=1 ... Z=26, with a half size adding 0.5 — "N½" (the 14th letter) sorts as 14.5. */
function ringLetterSort(label: string): number | null {
  const isHalf = label.endsWith("½");
  const letter = (isHalf ? label.slice(0, -1) : label).toUpperCase();
  if (letter.length !== 1 || letter < "A" || letter > "Z") return null;
  const base = letter.charCodeAt(0) - "A".charCodeAt(0) + 1;
  return base + (isHalf ? 0.5 : 0);
}

export type ResolvedSize = { sizeLabel: string | null; sizeSort: number | null };

/**
 * Turns whatever's in the size control into what gets stored: size_label is
 * what the admin sees, size_sort is the true measurement filtering/ordering
 * actually uses — always computed here, never typed directly. An input that
 * doesn't parse for the given size type resolves to null rather than
 * storing a garbage sort value.
 */
export function resolveSizeFields(sizeType: SizeTypeEnum, rawInput: string): ResolvedSize {
  const trimmed = rawInput.trim();
  if (sizeType === "none" || !trimmed) {
    return { sizeLabel: null, sizeSort: null };
  }

  if (sizeType === "ring_letter") {
    const sizeSort = ringLetterSort(trimmed);
    return sizeSort === null ? { sizeLabel: null, sizeSort: null } : { sizeLabel: trimmed, sizeSort };
  }

  if (sizeType === "bangle_diameter") {
    const sizeSort = bangleDiameterSort(trimmed);
    return sizeSort === null ? { sizeLabel: null, sizeSort: null } : { sizeLabel: trimmed, sizeSort };
  }

  // length_inches, hoop_mm — a plain typed number, displayed with its unit.
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { sizeLabel: null, sizeSort: null };
  }
  return sizeType === "length_inches"
    ? { sizeLabel: `${trimmed}"`, sizeSort: value }
    : { sizeLabel: `${trimmed}mm`, sizeSort: value };
}

/** The reverse of resolveSizeFields — seeds the size control from a stored size_label when editing. */
export function sizeLabelToInputValue(sizeType: SizeTypeEnum, sizeLabel: string | null): string {
  if (!sizeLabel) return "";
  if (sizeType === "length_inches") return sizeLabel.replace(/"$/, "");
  if (sizeType === "hoop_mm") return sizeLabel.replace(/mm$/, "");
  return sizeLabel;
}

export type SizeWriteFields = { size_label: string | null; size_sort: string | null };
