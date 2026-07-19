import reviewsData from "@/lib/data/reviews.json";

export type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
  source: "google" | string;
  relativeTime?: string;
};

/**
 * Minimum star rating shown on the site. Reviews below this are filtered out.
 * (Future-proofing: current seed data is all 5-star, but live data may not be.)
 */
export const MIN_DISPLAY_RATING = 4;

/**
 * getReviews — single source of truth for customer reviews.
 *
 * Today this reads from a local JSON file (lib/data/reviews.json).
 *
 * PLANNED ENHANCEMENT: sync live from the Google Places API
 * (Place Details -> `reviews`, which Google caps at 5 reviews per place).
 * When that lands, only the body of this function changes — swap the JSON
 * import for a server-side fetch to the Places API using a secret API key,
 * then map the response into the `Review` shape below. Every consumer
 * (the marquee, etc.) keeps working unchanged.
 *
 * It is async on purpose so the local->remote swap needs no call-site changes.
 */
export async function getReviews(): Promise<Review[]> {
  const all = reviewsData as Review[];

  return all
    .filter((r) => r.rating >= MIN_DISPLAY_RATING)
    .sort((a, b) => b.rating - a.rating);
}
