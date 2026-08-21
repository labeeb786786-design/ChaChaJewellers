import { z } from "zod";

/**
 * A gold_price_log row, filtered/ordered the same way the current_metal_prices
 * view resolves "the latest rate" — but read from the table directly rather
 * than the view, because we also need `id` to store as products.price_source_log_id.
 * The view omits it deliberately ("safe for public read"); this goes through
 * gold_price_log's own admin-only RLS policy instead.
 *
 * Numeric columns arrive as strings — coerced here, not with a raw Number().
 */
export const metalRateSourceSchema = z.object({
  id: z.string(),
  gold_per_gram_24k_pence: z.coerce.number().nullable(),
  silver_per_gram_999_pence: z.coerce.number().nullable(),
});
export type MetalRateSource = z.infer<typeof metalRateSourceSchema>;

export const bandAppliesToSchema = z.enum(["jewellery", "bullion"]);
export type BandApplies = z.infer<typeof bandAppliesToSchema>;

/** A pricing_bands row as returned by find_pricing_band() — coerced before any arithmetic. */
export const pricingBandSchema = z.object({
  id: z.string(),
  applies_to: bandAppliesToSchema,
  label: z.string(),
  min_weight_g: z.coerce.number(),
  max_weight_g: z.coerce.number(),
  markup_percent: z.coerce.number(),
  vat_percent: z.coerce.number(),
  is_active: z.boolean(),
});
export type PricingBandParsed = z.infer<typeof pricingBandSchema>;

/** The full pricing_bands row, for the admin Pricing page's CRUD list. */
export const pricingBandRowSchema = z.object({
  id: z.string(),
  applies_to: bandAppliesToSchema,
  label: z.string(),
  min_weight_g: z.coerce.number(),
  max_weight_g: z.coerce.number(),
  markup_percent: z.coerce.number(),
  vat_percent: z.coerce.number(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type PricingBandRow = z.infer<typeof pricingBandRowSchema>;
