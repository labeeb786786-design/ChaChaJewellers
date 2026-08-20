import { z } from "zod";

/**
 * Postgres `numeric` columns (weight_grams) arrive from supabase-js as
 * strings, never numbers — z.coerce.number() converts them at the data
 * boundary. .nullable() short-circuits on null before coercion runs, so a
 * genuinely absent weight stays null rather than becoming 0.
 */

export const pricingModeSchema = z.enum(["dynamic_jewellery", "dynamic_bullion", "fixed"]);
export const metalSchema = z.enum(["gold", "silver"]);
export const puritySchema = z.enum(["24k", "22k", "21k", "18k", "9k", "999", "925"]);
export const productTypeSchema = z.enum(["in_stock", "made_to_order"]);

/** One row of the admin product list — id, sku, name plus what the table shows. */
export const productListRowSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  pricing_mode: pricingModeSchema,
  weight_grams: z.coerce.number().nullable(),
  price_pence: z.number().nullable(),
  is_active: z.boolean(),
  size_label: z.string().nullable(),
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

/** A full product row, for the edit form to seed its initial values from. */
export const productDetailSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  slug: z.string(),
  short_description: z.string().nullable(),
  description: z.string().nullable(),
  category_id: z.string(),
  product_type: productTypeSchema,
  pricing_mode: pricingModeSchema,
  metal: metalSchema,
  purity: puritySchema,
  weight_grams: z.coerce.number().nullable(),
  price_pence: z.number().nullable(),
  stock_quantity: z.number(),
  lead_time_days: z.number().nullable(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  sort_order: z.number(),
  tags: z.array(z.string()),
  size_label: z.string().nullable(),
});
export type ProductDetail = z.infer<typeof productDetailSchema>;
