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

/** Shop categories customers browse first. Each product's `category` matches a slug below. */
export type Category = {
  slug: string;
  name: string;
  tagline: string;
  gradient: [string, string];
};

export const CATEGORIES: Category[] = [
  {
    slug: "rings",
    name: "Rings",
    tagline: "Everyday & occasion rings",
    gradient: ["#7a1f2b", "#c9a227"],
  },
  {
    slug: "bracelets",
    name: "Bracelets",
    tagline: "Delicate gold for the wrist",
    gradient: ["#8a2b2b", "#e0b84c"],
  },
  {
    slug: "studs-earrings",
    name: "Studs & Earrings",
    tagline: "Studs, jhumkas & drops",
    gradient: ["#701c28", "#caa53d"],
  },
  {
    slug: "necklaces",
    name: "Necklaces",
    tagline: "Chains & statement pieces",
    gradient: ["#6b1f2a", "#b8860b"],
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getProductsByCategory(slug: string): ShopProduct[] {
  return getShopProducts().filter((p) => p.category === slug);
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
