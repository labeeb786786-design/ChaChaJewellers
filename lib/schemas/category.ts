import { z } from "zod";

/** id + name — enough to populate a simple category filter, no hierarchy needed there. */
export const categoryOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type CategoryOption = z.infer<typeof categoryOptionSchema>;

export const sizeTypeSchema = z.enum(["ring_letter", "length_inches", "bangle_diameter", "hoop_mm", "none"]);
export type SizeType = z.infer<typeof sizeTypeSchema>;

/**
 * id + name + hierarchy + size_type — what the product form's category
 * picker needs. slug is included so the client can mirror
 * pricingModeForCategorySlug() for immediate UI feedback (locking the mode
 * picker, showing the right card) — the server re-derives it independently
 * from the same slug and never trusts what the client computed.
 */
export const categoryFormOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  parent_id: z.string().nullable(),
  size_type: sizeTypeSchema,
});
export type CategoryFormOption = z.infer<typeof categoryFormOptionSchema>;
