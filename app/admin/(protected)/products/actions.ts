"use server";

import { revalidatePath } from "next/cache";

import { AdminAuthError, requireAdmin } from "@/lib/auth";
import { friendlyUniqueViolationMessage } from "@/lib/db-errors";
import {
  appliesToForMode,
  calculateProductPrice,
  canPublish,
  findBand,
  resolvePriceWriteFields,
  type PricingBand,
} from "@/lib/pricing";
import { productWeightRowSchema } from "@/lib/schemas/product";
import {
  coerceProductFields,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormState,
} from "@/lib/schemas/product-form";
import { generateSku, generateSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T> = T | { error: string };
type FormActionResult<T> = T | { error: string } | { fieldErrors: ProductFormErrors };

const DUPLICATE_KEY_MESSAGES = {
  sku: "This code was used by a product you removed, please use a different one.",
  slug: "This web address was used by a product you removed, please use a different one.",
};

/**
 * Creates the minimal product row an image upload needs to attach to, when
 * the admin is still on the "new product" page and hasn't saved yet. See
 * image-uploader.tsx for why this exists instead of a temp-file scheme.
 *
 * is_active is false and every field the real save (step 8) hasn't been
 * asked for yet is left at its DB default — this row is a placeholder to
 * hang images off, not a finished product.
 */
export async function ensureDraftProduct(input: {
  name: string;
  categoryId: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  if (!input.categoryId) {
    return { error: "Choose a category before adding photos." };
  }

  const supabase = await createClient();
  const baseName = input.name.trim() || "Untitled product";

  try {
    const [slug, sku] = await Promise.all([
      generateSlug(baseName, supabase, "products"),
      generateSku(baseName, supabase),
    ]);

    const { data, error } = await supabase
      .from("products")
      .insert({ name: baseName, slug, sku, category_id: input.categoryId, is_active: false })
      .select("id")
      .single();

    if (error) {
      return { error: `Could not start this product: ${error.message}` };
    }

    return { id: data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start this product.";
    return { error: message };
  }
}

/**
 * Creates a genuinely new product row from a fully filled-in form — the
 * "no photo was ever added, straight to Save/Publish" path. When a photo
 * was added first, ensureDraftProduct() already made the row and the form
 * calls updateProduct() instead; product-form.tsx is what decides which one
 * to call, based on whether it's already holding an id.
 *
 * Re-validates server-side with the same productFormSchema the client
 * already ran — "a form-only check is bypassed by any future non-form
 * route" applies here too, not only to canPublish().
 */
export async function createProduct(
  values: ProductFormState,
): Promise<FormActionResult<{ id: string; slug: string }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const fieldErrors = validateProductForm(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const fields = coerceProductFields(values);

  try {
    const [slug, sku, priceFields] = await Promise.all([
      generateSlug(fields.name, supabase, "products"),
      generateSku(fields.name, supabase),
      resolvePriceWriteFields(supabase, {
        pricingMode: fields.pricing_mode,
        weightGrams: fields.weight_grams !== null ? Number(fields.weight_grams) : null,
        metal: fields.metal,
        fixedPricePence: fields.price_pence,
      }),
    ]);

    const { data, error } = await supabase
      .from("products")
      .insert({ ...fields, ...priceFields, slug, sku, is_active: false })
      .select("id, slug")
      .single();

    if (error) {
      const friendly = friendlyUniqueViolationMessage(error, DUPLICATE_KEY_MESSAGES);
      return { error: friendly ?? `Could not create this product: ${error.message}` };
    }

    revalidatePath("/admin/products");
    return { id: data.id, slug: data.slug };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create this product." };
  }
}

/**
 * Updates an existing product's fields — name, category, pricing, stock,
 * descriptions, More options. Never touches is_active; publishProduct() /
 * unpublishProduct() own that, independently, so a "Save as draft" click
 * can't accidentally publish something and a publish can't skip the
 * zero-markup guard by going through this action instead.
 */
export async function updateProduct(
  productId: string,
  values: ProductFormState,
): Promise<FormActionResult<{ id: string; slug: string }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const fieldErrors = validateProductForm(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const fields = coerceProductFields(values);

  const { data: existing, error: fetchError } = await supabase
    .from("products")
    .select("name, slug")
    .eq("id", productId)
    .is("removed_at", null)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "Could not find this product to update." };
  }

  try {
    // Regenerate the web address only when the name actually changed, so
    // editing anything else never silently moves it. The code (SKU) is
    // fixed at creation and never regenerates.
    const [slug, priceFields] = await Promise.all([
      existing.name === fields.name ? existing.slug : generateSlug(fields.name, supabase, "products"),
      resolvePriceWriteFields(supabase, {
        pricingMode: fields.pricing_mode,
        weightGrams: fields.weight_grams !== null ? Number(fields.weight_grams) : null,
        metal: fields.metal,
        fixedPricePence: fields.price_pence,
      }),
    ]);

    const { error } = await supabase
      .from("products")
      .update({ ...fields, ...priceFields, slug })
      .eq("id", productId);

    if (error) {
      const friendly = friendlyUniqueViolationMessage(error, DUPLICATE_KEY_MESSAGES);
      return { error: friendly ?? `Could not save this product: ${error.message}` };
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}/edit`);
    return { id: productId, slug };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save this product." };
  }
}

/**
 * Publishes a product — the one place is_active flips to true. Re-runs the
 * zero-markup guard against the database itself (never the client's last
 * price-preview response, which could be stale) so a future non-form
 * caller can't bypass it just by skipping the confirmation dialog.
 *
 * canPublish() only checks the band's markup — it says nothing about
 * whether a rate actually exists to price against. A valid, non-zero band
 * with no gold rate recorded yet would otherwise sail through that check
 * and go live with a null price_pence, so this recomputes (and stores) the
 * real price here too, and blocks publishing if that comes back empty.
 */
export async function publishProduct(productId: string): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const supabase = await createClient();

  const { data: row, error: fetchError } = await supabase
    .from("products")
    .select("pricing_mode, weight_grams, metal")
    .eq("id", productId)
    .is("removed_at", null)
    .maybeSingle();

  if (fetchError || !row) {
    return { error: "Could not find this product to publish." };
  }

  const product = productWeightRowSchema.parse({
    id: productId,
    pricing_mode: row.pricing_mode,
    weight_grams: row.weight_grams,
  });

  const appliesTo = appliesToForMode(product.pricing_mode);
  let band: PricingBand | null = null;

  if (appliesTo) {
    if (product.weight_grams === null) {
      return { error: "This product needs a weight before it can be published." };
    }
    band = await findBand(supabase, appliesTo, product.weight_grams);
  }

  if (!canPublish(product.pricing_mode, band)) {
    return {
      error: band
        ? `The ${band.label} band is set to 0% markup, so this can't go live yet. Fix the markup under Pricing first.`
        : "There's no pricing band for this weight, so it can't go live yet. Add one under Pricing first.",
    };
  }

  const calculated =
    product.pricing_mode === "fixed"
      ? null
      : await calculateProductPrice(supabase, {
          pricingMode: product.pricing_mode,
          weightGrams: product.weight_grams,
          metal: row.metal,
        });

  if (product.pricing_mode !== "fixed" && !calculated) {
    return { error: "There's no gold rate recorded yet, so this can't be published." };
  }

  const { error } = await supabase
    .from("products")
    .update({
      is_active: true,
      ...(calculated
        ? {
            price_pence: calculated.pricePence,
            price_calculated_at: calculated.priceCalculatedAt,
            price_source_log_id: calculated.priceSourceLogId,
          }
        : {}),
    })
    .eq("id", productId);
  if (error) {
    return { error: `Could not publish this product: ${error.message}` };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  return { ok: true };
}

/** The "Save as draft" half of publish/unpublish — no guard needed, going from live back to draft is always safe. */
export async function unpublishProduct(productId: string): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", productId)
    .is("removed_at", null);

  if (error) {
    return { error: `Could not save this as a draft: ${error.message}` };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  return { ok: true };
}

/**
 * "Remove" — the client experiences this as deletion, but the row survives:
 * order_items and price_locks hold foreign keys to it, and order_items'
 * link is ON DELETE SET NULL rather than RESTRICT, so that foreign key
 * would NOT stop a real DELETE — it would just null out historic orders'
 * link back to this product. Keeping the row, not the FK, is what protects
 * order history; a real DELETE was never actually blocked, it was just the
 * wrong call.
 *
 * is_active=false alone wouldn't distinguish this from an ordinary
 * unpublished draft, so removed_at is what actually keeps it out of every
 * admin list/detail view from here on (see the migration that added it).
 * Images are deleted for real, storage files included — nothing needs them
 * once the product is gone from view.
 */
export async function removeProduct(productId: string): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const supabase = await createClient();

  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", productId);

  if (imagesError) {
    return { error: `Could not remove this product: ${imagesError.message}` };
  }

  const storagePaths = (images ?? []).map((image) => image.storage_path);
  if (storagePaths.length > 0) {
    const admin = createAdminClient();
    const { error: storageError } = await admin.storage.from("product-images").remove(storagePaths);
    if (storageError) {
      // Same accepted-orphan-files stance as deleteProductImage() — the
      // rows are the source of truth for the admin panel; a leftover file
      // is for the fortnightly sweep, not a failure to surface here.
      console.error(`Could not delete storage files for product ${productId}:`, storageError.message);
    }
  }

  const { error: imagesDeleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);
  if (imagesDeleteError) {
    return { error: `Could not remove this product: ${imagesDeleteError.message}` };
  }

  const { error } = await supabase
    .from("products")
    .update({ is_active: false, removed_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) {
    return { error: `Could not remove this product: ${error.message}` };
  }

  revalidatePath("/admin/products");
  return { ok: true };
}

/**
 * Copies a product's fields as a starting point for a new one — not its
 * images (those are physical files; "starting point" means the data, the
 * admin adds fresh photos), and not the original's publish state or price
 * provenance: is_active is always false and removed_at always null
 * regardless of the source (duplicating a live product must never publish
 * the copy — no confirmation dialog ran, no canPublish() check happened),
 * and price_calculated_at / price_source_log_id are never copied since a
 * copied price_pence with no calculation behind it would be exactly the
 * silent-stale-price problem resolvePriceWriteFields() exists to avoid.
 * SKU and slug are regenerated from the name, not copied either, so the
 * duplicate never collides with the original.
 */
export async function duplicateProduct(productId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const supabase = await createClient();

  const { data: source, error: fetchError } = await supabase
    .from("products")
    .select(
      "name, short_description, description, category_id, product_type, pricing_mode, metal, purity, weight_grams, price_pence, stock_quantity, lead_time_days, is_featured, sort_order, tags",
    )
    .eq("id", productId)
    .is("removed_at", null)
    .maybeSingle();

  if (fetchError || !source) {
    return { error: "Could not find this product to duplicate." };
  }

  const newName = `${source.name} (copy)`;

  try {
    const [slug, sku, priceFields] = await Promise.all([
      generateSlug(newName, supabase, "products"),
      generateSku(newName, supabase),
      resolvePriceWriteFields(supabase, {
        pricingMode: source.pricing_mode,
        weightGrams: source.weight_grams !== null ? Number(source.weight_grams) : null,
        metal: source.metal,
        fixedPricePence: source.price_pence,
      }),
    ]);

    const { data, error } = await supabase
      .from("products")
      .insert({ ...source, ...priceFields, name: newName, slug, sku, is_active: false, removed_at: null })
      .select("id")
      .single();

    if (error) {
      const friendly = friendlyUniqueViolationMessage(error, DUPLICATE_KEY_MESSAGES);
      return { error: friendly ?? `Could not duplicate this product: ${error.message}` };
    }

    revalidatePath("/admin/products");
    return { id: data.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not duplicate this product." };
  }
}

/**
 * Swaps the primary image via the set_primary_product_image() DB function
 * (supabase/migrations/20260819100000_set_primary_product_image.sql) so the
 * clear-old/set-new pair runs as one transaction — never two separate
 * requests, which is exactly what the partial unique index
 * (product_images_one_primary_idx) is there to catch if done wrong.
 */
export async function setPrimaryImage(input: {
  productId: string;
  imageId: string;
}): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_primary_product_image", {
    p_product_id: input.productId,
    p_image_id: input.imageId,
  });

  if (error) {
    return { error: `Could not set the main photo: ${error.message}` };
  }

  return { ok: true };
}

/**
 * Removes the product_images row, then the storage file. That order, not
 * the reverse: if the row delete succeeds but the storage delete fails
 * afterwards, the result is an orphaned file the fortnightly sweep cleans
 * up — invisible to the admin. The reverse order risks a row that still
 * points at a file that's already gone, which shows up as a broken
 * thumbnail. Storage delete goes through the service-role client per the
 * brief — RLS's product_images_admin_delete policy would also allow an
 * authenticated admin to do this directly, but cleanup-on-delete is kept on
 * the service role deliberately, so it isn't coupled to that policy staying
 * correct.
 */
export async function deleteProductImage(input: {
  imageId: string;
  storagePath: string;
}): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const supabase = await createClient();
  const { error: deleteRowError } = await supabase.from("product_images").delete().eq("id", input.imageId);

  if (deleteRowError) {
    return { error: `Could not remove this photo: ${deleteRowError.message}` };
  }

  const admin = createAdminClient();
  const { error: storageError } = await admin.storage.from("product-images").remove([input.storagePath]);
  if (storageError) {
    // The row is already gone, which is what the UI reflects — log this
    // rather than surface it, per the accepted-orphan-files policy.
    console.error(`Could not delete storage file ${input.storagePath}:`, storageError.message);
  }

  return { ok: true };
}

/** Persists drag-to-reorder. Order within a product only, no cross-product effect, so no transaction needed. */
export async function reorderProductImages(input: {
  productId: string;
  orderedImageIds: string[];
}): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const supabase = await createClient();

  const results = await Promise.all(
    input.orderedImageIds.map((imageId, index) =>
      supabase
        .from("product_images")
        .update({ sort_order: index })
        .eq("id", imageId)
        .eq("product_id", input.productId),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return { error: `Could not save the new photo order: ${failed.error.message}` };
  }

  return { ok: true };
}
