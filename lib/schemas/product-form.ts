import { z } from "zod";

import { parseMoney } from "@/lib/money";
import { metalSchema, pricingModeSchema, productTypeSchema, puritySchema } from "./product";

/**
 * The product form's own state shape — every field is a plain string (or
 * boolean) tied to a controlled input, not yet the numbers/enums the DB
 * wants. Kept separate from the DB-row schemas in ./product: this validates
 * what's on screen, not what Postgres will accept.
 */
export type ProductFormState = {
  name: string;
  categoryId: string;
  // Raw value from whichever size control the category's size_type shows
  // (a dropdown selection or a typed number) — resolved into size_label /
  // size_sort server-side via resolveCategorySizeFields (lib/size.ts),
  // never validated here since the category's size_type, not this form
  // state, decides what "valid" even means for it.
  sizeValue: string;
  stockQuantity: string;
  pricingMode: z.infer<typeof pricingModeSchema>;
  weightGrams: string;
  fixedPrice: string;
  shortDescription: string;
  description: string;
  purity: z.infer<typeof puritySchema>;
  metal: z.infer<typeof metalSchema>;
  productType: z.infer<typeof productTypeSchema>;
  leadTimeDays: string;
  isFeatured: boolean;
  sortOrder: string;
  tags: string;
};

export const defaultProductFormState: ProductFormState = {
  name: "",
  categoryId: "",
  sizeValue: "",
  stockQuantity: "1",
  pricingMode: "dynamic_jewellery",
  weightGrams: "",
  fixedPrice: "",
  shortDescription: "",
  description: "",
  purity: "22k",
  metal: "gold",
  productType: "in_stock",
  leadTimeDays: "",
  isFeatured: false,
  sortOrder: "0",
  tags: "",
};

const rawProductFormShape = z.object({
  name: z.string(),
  categoryId: z.string(),
  stockQuantity: z.string(),
  pricingMode: pricingModeSchema,
  weightGrams: z.string(),
  fixedPrice: z.string(),
  shortDescription: z.string(),
  description: z.string(),
  purity: puritySchema,
  metal: metalSchema,
  productType: productTypeSchema,
  leadTimeDays: z.string(),
  isFeatured: z.boolean(),
  sortOrder: z.string(),
  tags: z.string(),
});

/**
 * Every numeric/conditional field is validated by hand in superRefine
 * (rather than z.coerce.number()) so an emptied field reports "enter a
 * whole number" instead of silently coercing "" to 0 — that's exactly the
 * zero-stock trap the brief warns about.
 */
export const productFormSchema = rawProductFormShape.superRefine((values, ctx) => {
  if (!values.name.trim()) {
    ctx.addIssue({ code: "custom", path: ["name"], message: "Enter a product name." });
  }

  if (!values.categoryId) {
    ctx.addIssue({ code: "custom", path: ["categoryId"], message: "Choose a category." });
  }

  const stock = Number(values.stockQuantity);
  if (!values.stockQuantity.trim() || !Number.isInteger(stock) || stock < 0) {
    ctx.addIssue({
      code: "custom",
      path: ["stockQuantity"],
      message: "Enter a whole number of 0 or more.",
    });
  }

  if (values.pricingMode === "fixed") {
    try {
      const pence = parseMoney(values.fixedPrice.trim());
      if (pence <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["fixedPrice"],
          message: "Enter a price greater than £0.",
        });
      }
    } catch {
      ctx.addIssue({
        code: "custom",
        path: ["fixedPrice"],
        message: "Enter a plain number like 1295.00.",
      });
    }
  } else {
    const weight = Number(values.weightGrams);
    if (!values.weightGrams.trim() || Number.isNaN(weight)) {
      ctx.addIssue({ code: "custom", path: ["weightGrams"], message: "Enter the weight in grams." });
    } else if (weight <= 0) {
      ctx.addIssue({ code: "custom", path: ["weightGrams"], message: "Weight must be more than 0." });
    }
  }

  if (values.productType === "made_to_order") {
    const days = Number(values.leadTimeDays);
    if (!values.leadTimeDays.trim() || !Number.isInteger(days) || days <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["leadTimeDays"],
        message: "Enter how many days it takes to make.",
      });
    }
  }

  const sortOrder = Number(values.sortOrder);
  if (!values.sortOrder.trim() || !Number.isInteger(sortOrder)) {
    ctx.addIssue({ code: "custom", path: ["sortOrder"], message: "Enter a whole number." });
  }
});

export type ProductFormErrors = Partial<Record<keyof ProductFormState, string>>;

/** Runs the schema and keeps the first issue per field, keyed for inline display under each input. */
export function validateProductForm(values: ProductFormState): ProductFormErrors {
  const result = productFormSchema.safeParse(values);
  if (result.success) return {};

  const errors: ProductFormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof ProductFormState | undefined;
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

/** The DB-column-shaped fields a create/update writes — everything except slug/sku (generated with DB access) and is_active (its own action). */
export type ProductWriteFields = {
  name: string;
  category_id: string;
  stock_quantity: number;
  pricing_mode: z.infer<typeof pricingModeSchema>;
  // numeric in Postgres, so supabase-js wants a string on the way in too —
  // same reason it comes back as a string on the way out (brief trap #1).
  weight_grams: string | null;
  price_pence: number | null;
  short_description: string | null;
  description: string | null;
  purity: z.infer<typeof puritySchema>;
  metal: z.infer<typeof metalSchema>;
  product_type: z.infer<typeof productTypeSchema>;
  lead_time_days: number | null;
  is_featured: boolean;
  sort_order: number;
  tags: string[];
};

/**
 * Converts already-validated form state into the shape the DB wants, with
 * numeric fields coerced via z.coerce.number() rather than a raw Number()
 * call. Only call this after validateProductForm() returns no errors — it
 * assumes the strings are well-formed and doesn't re-check them.
 */
export function coerceProductFields(values: ProductFormState): ProductWriteFields {
  const isDynamic = values.pricingMode !== "fixed";

  return {
    name: values.name.trim(),
    category_id: values.categoryId,
    stock_quantity: z.coerce.number().int().parse(values.stockQuantity),
    pricing_mode: values.pricingMode,
    weight_grams: isDynamic ? String(z.coerce.number().parse(values.weightGrams)) : null,
    price_pence: isDynamic ? null : parseMoney(values.fixedPrice.trim()),
    short_description: values.shortDescription.trim() || null,
    description: values.description.trim() || null,
    purity: values.purity,
    metal: values.metal,
    product_type: values.productType,
    lead_time_days:
      values.productType === "made_to_order" ? z.coerce.number().int().parse(values.leadTimeDays) : null,
    is_featured: values.isFeatured,
    sort_order: z.coerce.number().int().parse(values.sortOrder),
    tags: values.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}
