import { z } from "zod";

import { sizeTypeSchema, type SizeType } from "./category";

/** Same web-address rule as products: `^[a-z0-9]+(-[a-z0-9]+)*$` — lowercase, digits, single hyphens. */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * The category form's own state shape — every field a plain string/boolean
 * tied to a controlled input, mirroring product-form.ts's split between
 * on-screen state and the DB-row shape. Unlike products, a category's slug
 * is a directly editable field, not a generated hint — see the addendum's
 * slug-change warning, which only makes sense because it's editable here.
 */
export type CategoryFormState = {
  name: string;
  slug: string;
  parentId: string; // "" = no parent (top level)
  sizeType: SizeType;
  description: string;
  metaTitle: string;
  metaDescription: string;
  sortOrder: string;
  isActive: boolean;
};

export const defaultCategoryFormState: CategoryFormState = {
  name: "",
  slug: "",
  parentId: "",
  sizeType: "none",
  description: "",
  metaTitle: "",
  metaDescription: "",
  sortOrder: "0",
  isActive: true,
};

const rawCategoryFormShape = z.object({
  name: z.string(),
  slug: z.string(),
  parentId: z.string(),
  sizeType: sizeTypeSchema,
  description: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  sortOrder: z.string(),
  isActive: z.boolean(),
});

export const categoryFormSchema = rawCategoryFormShape.superRefine((values, ctx) => {
  if (!values.name.trim()) {
    ctx.addIssue({ code: "custom", path: ["name"], message: "Enter a category name." });
  }

  const slug = values.slug.trim();
  if (!slug) {
    ctx.addIssue({ code: "custom", path: ["slug"], message: "Enter a web address." });
  } else if (!SLUG_PATTERN.test(slug)) {
    ctx.addIssue({
      code: "custom",
      path: ["slug"],
      message: "Lowercase letters, numbers and hyphens only, e.g. gold-bangles.",
    });
  }

  const sortOrder = Number(values.sortOrder);
  if (!values.sortOrder.trim() || !Number.isInteger(sortOrder)) {
    ctx.addIssue({ code: "custom", path: ["sortOrder"], message: "Enter a whole number." });
  }
});

export type CategoryFormErrors = Partial<Record<keyof CategoryFormState, string>>;

/** Runs the schema and keeps the first issue per field, keyed for inline display under each input. */
export function validateCategoryForm(values: CategoryFormState): CategoryFormErrors {
  const result = categoryFormSchema.safeParse(values);
  if (result.success) return {};

  const errors: CategoryFormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof CategoryFormState | undefined;
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export type CategoryWriteFields = {
  name: string;
  slug: string;
  parent_id: string | null;
  size_type: SizeType;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  sort_order: number;
  is_active: boolean;
};

/** Converts already-validated form state into the shape the DB wants. Only call after validateCategoryForm() returns no errors. */
export function coerceCategoryFields(values: CategoryFormState): CategoryWriteFields {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    parent_id: values.parentId || null,
    size_type: values.sizeType,
    description: values.description.trim() || null,
    meta_title: values.metaTitle.trim() || null,
    meta_description: values.metaDescription.trim() || null,
    sort_order: z.coerce.number().int().parse(values.sortOrder),
    is_active: values.isActive,
  };
}
