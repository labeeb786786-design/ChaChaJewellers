"use server";

import { revalidatePath } from "next/cache";

import { AdminAuthError, requireAdmin } from "@/lib/auth";
import { friendlyUniqueViolationMessage } from "@/lib/db-errors";
import {
  coerceCategoryFields,
  validateCategoryForm,
  type CategoryFormErrors,
  type CategoryFormState,
} from "@/lib/schemas/category-form";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T> = T | { error: string };
type FormActionResult<T> = T | { error: string } | { fieldErrors: CategoryFormErrors };

const DUPLICATE_KEY_MESSAGES = {
  name: "A category already has this name — choose a different one.",
  slug: "A category already uses this web address — choose a different one.",
};

export async function createCategory(values: CategoryFormState): Promise<FormActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const fieldErrors = validateCategoryForm(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const fields = coerceCategoryFields(values);
  const supabase = await createClient();

  const { data, error } = await supabase.from("categories").insert(fields).select("id").single();

  if (error) {
    const friendly = friendlyUniqueViolationMessage(error, DUPLICATE_KEY_MESSAGES);
    return { error: friendly ?? `Could not create this category: ${error.message}` };
  }

  revalidatePath("/admin/categories");
  return { id: data.id };
}

/**
 * Re-validates and writes every field, including slug and size_type — the
 * client-side confirmation dialogs (slug change) and inline warning
 * (size_type change) are UI gates only, per the addendum ("warn, don't
 * block" for size_type; "warn explicitly before allowing" for slug, not
 * "prevent"). Nothing here re-checks product counts, because neither
 * warning is actually a write-time constraint — both changes are always
 * valid to save, just risky, and the risk was already surfaced client-side.
 */
export async function updateCategory(
  categoryId: string,
  values: CategoryFormState,
): Promise<FormActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const fieldErrors = validateCategoryForm(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const fields = coerceCategoryFields(values);
  const supabase = await createClient();

  const { error } = await supabase.from("categories").update(fields).eq("id", categoryId);

  if (error) {
    const friendly = friendlyUniqueViolationMessage(error, DUPLICATE_KEY_MESSAGES);
    return { error: friendly ?? `Could not save this category: ${error.message}` };
  }

  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${categoryId}/edit`);
  return { id: categoryId };
}

/**
 * Pre-checks the two things that would otherwise surface as a raw Postgres
 * RESTRICT error (products.category_id NOT NULL + FK, categories.parent_id
 * ON DELETE RESTRICT) and returns a friendly message instead of attempting
 * a delete that's known to fail. The categories page already renders these
 * same reasons inline (so a blocked category never shows an enabled Delete
 * button in the first place) — this is the defensive re-check for the
 * Server Action itself, since a page render can go stale between load and
 * click.
 */
export async function deleteCategory(categoryId: string): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const supabase = await createClient();

  const [productCountResult, childCountResult] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", categoryId),
    supabase.from("categories").select("id", { count: "exact", head: true }).eq("parent_id", categoryId),
  ]);

  if (productCountResult.error || childCountResult.error) {
    const message = (productCountResult.error ?? childCountResult.error)!.message;
    return { error: `Could not check whether this category can be removed: ${message}` };
  }

  const productCount = productCountResult.count ?? 0;
  const childCount = childCountResult.count ?? 0;

  if (productCount > 0) {
    return {
      error: `This category has ${productCount} product${productCount === 1 ? "" : "s"} in it. Move or remove them first.`,
    };
  }
  if (childCount > 0) {
    return { error: "This category has subcategories. Remove them first." };
  }

  const { error } = await supabase.from("categories").delete().eq("id", categoryId);

  if (error) {
    if (error.code === "23503") {
      return { error: "This category is still in use elsewhere and can't be removed." };
    }
    return { error: `Could not remove this category: ${error.message}` };
  }

  revalidatePath("/admin/categories");
  return { ok: true };
}
