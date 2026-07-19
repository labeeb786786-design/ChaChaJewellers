export type ProductCategory =
  | "rings"
  | "bangles"
  | "necklace-sets"
  | "earrings";

export type CategoryMeta = {
  slug: ProductCategory;
  name: string;
  tagline: string;
  gradient: [string, string];
};

/** The four headline collections shown on the homepage. */
export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "rings",
    name: "Rings",
    tagline: "Engagement, signet & bespoke",
    gradient: ["#7a1f2b", "#c9a227"],
  },
  {
    slug: "bangles",
    name: "Bangles",
    tagline: "Bhalia, kara & filigree",
    gradient: ["#5c1a1a", "#d4af37"],
  },
  {
    slug: "necklace-sets",
    name: "Necklace Sets",
    tagline: "Bridal, kundan & polki",
    gradient: ["#6b1f2a", "#b8860b"],
  },
  {
    slug: "earrings",
    name: "Earrings",
    tagline: "Jhumka, chandbali & studs",
    gradient: ["#8a2b2b", "#e0b84c"],
  },
];
