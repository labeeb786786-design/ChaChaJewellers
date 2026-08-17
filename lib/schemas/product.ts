import { z } from "zod";

/**
 * Postgres `numeric` columns (weight_grams) arrive from supabase-js as
 * strings, never numbers — z.coerce.number() converts them at the data
 * boundary. .nullable() short-circuits on null before coercion runs, so a
 * genuinely absent weight stays null rather than becoming 0.
 */

export const pricingModeSchema = z.enum(["dynamic_jewellery", "dynamic_bullion", "fixed"]);

/** One row of the admin product list — id, sku, name plus what the table shows. */
export const productListRowSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  pricing_mode: pricingModeSchema,
  weight_grams: z.coerce.number().nullable(),
  price_pence: z.number().nullable(),
  is_active: z.boolean(),
  category: z.object({ name: z.string() }).nullable(),
  product_images: z.array(z.object({ storage_path: z.string() })),
});
export type ProductListRow = z.infer<typeof productListRowSchema>;

/** Just enough of a product row to run the zero-markup guard against it. */
export const productWeightRowSchema = z.object({
  id: z.string(),
  pricing_mode: pricingModeSchema,
  weight_grams: z.coerce.number().nullable(),
});
export type ProductWeightRow = z.infer<typeof productWeightRowSchema>;
