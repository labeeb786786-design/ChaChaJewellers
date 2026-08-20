import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { pricingModeForCategorySlug } from "@/lib/pricing";
import { categoryFormOptionSchema, type CategoryFormOption } from "@/lib/schemas/category";
import { productDetailSchema, type ProductDetail } from "@/lib/schemas/product";
import { productImageRowSchema, type UploadedImage } from "@/lib/schemas/product-image";
import type { ProductFormState } from "@/lib/schemas/product-form";
import { sizeLabelToInputValue } from "@/lib/size";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "../../_components/product-form";

export const metadata: Metadata = {
  title: "Edit product",
};

function toFormState(product: ProductDetail, categories: CategoryFormOption[]): ProductFormState {
  const category = categories.find((c) => c.id === product.category_id);
  // Shows the category's true mode from the moment the page loads, not
  // whatever's stored — if they've drifted (legacy data, a category
  // reassigned some other way), the picker would otherwise show a mode
  // that contradicts the locked, non-interactive cards next to it. Falls
  // back to the stored value only if the category can't be found at all
  // (e.g. deactivated since), same edge case sizeValue below already
  // handles the same way.
  const pricingMode = category ? pricingModeForCategorySlug(category.slug) : product.pricing_mode;

  return {
    name: product.name,
    categoryId: product.category_id,
    sizeValue: sizeLabelToInputValue(category?.size_type ?? "none", product.size_label),
    stockQuantity: String(product.stock_quantity),
    pricingMode,
    weightGrams: product.weight_grams !== null ? String(product.weight_grams) : "",
    fixedPrice: product.price_pence !== null ? (product.price_pence / 100).toFixed(2) : "",
    shortDescription: product.short_description ?? "",
    description: product.description ?? "",
    purity: product.purity,
    metal: product.metal,
    productType: product.product_type,
    leadTimeDays: product.lead_time_days !== null ? String(product.lead_time_days) : "",
    isFeatured: product.is_featured,
    sortOrder: String(product.sort_order),
    tags: product.tags.join(", "),
  };
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [productResult, categoriesResult, imagesResult] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).is("removed_at", null).maybeSingle(),
    supabase
      .from("categories")
      .select("id, name, slug, parent_id, size_type")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("product_images")
      .select("id, product_id, storage_path, is_primary, sort_order")
      .eq("product_id", id)
      .order("sort_order"),
  ]);

  if (productResult.error) {
    throw new Error(`Could not load this product: ${productResult.error.message}`);
  }
  if (categoriesResult.error) {
    throw new Error(`Could not load categories: ${categoriesResult.error.message}`);
  }
  if (imagesResult.error) {
    throw new Error(`Could not load this product's photos: ${imagesResult.error.message}`);
  }
  if (!productResult.data) {
    notFound();
  }

  const product = productDetailSchema.parse(productResult.data);
  const categories = z.array(categoryFormOptionSchema).parse(categoriesResult.data ?? []);
  const imageRows = z.array(productImageRowSchema).parse(imagesResult.data ?? []);
  const images: UploadedImage[] = imageRows.map((row) => ({
    id: row.id,
    storagePath: row.storage_path,
    url: supabase.storage.from("product-images").getPublicUrl(row.storage_path).data.publicUrl,
    isPrimary: row.is_primary,
    sortOrder: row.sort_order,
  }));

  return (
    <ProductForm
      productId={product.id}
      categories={categories}
      initialValues={toFormState(product, categories)}
      initialImages={images}
    />
  );
}
