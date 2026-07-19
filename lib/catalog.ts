import catalogData from "@/lib/data/catalog.json";
import { formatGBP } from "@/lib/gold";

/**
 * Real shop catalogue for the preview (products added by the client).
 *
 * Each product's `image` is a path under /public — drop the photo file there
 * with the matching name (e.g. public/products/bangles.png). Until the file
 * exists, the card shows a branded gold gradient fallback with the product
 * name, so the page never looks broken.
 *
 * Ranges: some pieces are sold as a "from–to" (e.g. a bracelet at 5–5.6 g,
 * £650–750). For those, set the optional `weightMaxGrams` / `priceMaxGBP`
 * fields — `weightGrams` / `priceGBP` are then the lower bound. Fixed-value
 * pieces just omit the max fields. Length/size ranges go straight into the
 * `measure.value` string (e.g. "7 – 7.5 inches").
 */
export type ShopProduct = {
  slug: string;
  name: string;
  category: string;
  image: string;
  priceGBP: number;
  priceMaxGBP?: number;
  weightGrams: number;
  weightMaxGrams?: number;
  /** Gold purity, e.g. "24k". Optional — some pieces may be added before it's confirmed. */
  karat?: string;
  /** A single measurement that varies by piece type, e.g. { label: "Size", value: "2.4" } or { label: "Length", value: "16 inches" }. */
  measure?: { label: string; value: string };
  gradient: [string, string];
  description: string;
};

export function getShopProducts(): ShopProduct[] {
  return catalogData as ShopProduct[];
}

export function getShopProductBySlug(slug: string): ShopProduct | undefined {
  return getShopProducts().find((p) => p.slug === slug);
}

/** Display label for price — a single value or a "from – to" range. */
export function priceLabel(p: ShopProduct): string {
  return p.priceMaxGBP
    ? `${formatGBP(p.priceGBP, 0)} – ${formatGBP(p.priceMaxGBP, 0)}`
    : formatGBP(p.priceGBP, 0);
}

/** Display label for weight — a single value or a "from – to" range, in grams. */
export function weightLabel(p: ShopProduct): string {
  return p.weightMaxGrams
    ? `${p.weightGrams} – ${p.weightMaxGrams} g`
    : `${p.weightGrams} g`;
}
