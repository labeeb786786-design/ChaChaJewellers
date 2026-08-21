import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { categoryOptionSchema, categoryRowSchema } from "@/lib/schemas/category";
import type { CategoryFormState } from "@/lib/schemas/category-form";
import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "../../_components/category-form";

export const metadata: Metadata = {
  title: "Edit category",
};

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [categoryResult, parentOptionsResult, productCountResult, childCountResult] = await Promise.all([
    supabase
      .from("categories")
      .select(
        "id, name, slug, description, meta_title, meta_description, sort_order, is_active, parent_id, size_type",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name").is("parent_id", null).neq("id", id).order("name"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id),
    supabase.from("categories").select("id", { count: "exact", head: true }).eq("parent_id", id),
  ]);

  if (categoryResult.error) {
    throw new Error(`Could not load this category: ${categoryResult.error.message}`);
  }
  if (!categoryResult.data) {
    notFound();
  }
  if (parentOptionsResult.error) {
    throw new Error(`Could not load categories: ${parentOptionsResult.error.message}`);
  }
  if (productCountResult.error || childCountResult.error) {
    const message = (productCountResult.error ?? childCountResult.error)!.message;
    throw new Error(`Could not load this category: ${message}`);
  }

  const category = categoryRowSchema.parse(categoryResult.data);
  const parentOptions = z.array(categoryOptionSchema).parse(parentOptionsResult.data ?? []);

  const initialValues: CategoryFormState = {
    name: category.name,
    slug: category.slug,
    parentId: category.parent_id ?? "",
    sizeType: category.size_type,
    description: category.description ?? "",
    metaTitle: category.meta_title ?? "",
    metaDescription: category.meta_description ?? "",
    sortOrder: String(category.sort_order),
    isActive: category.is_active,
  };

  return (
    <CategoryForm
      categoryId={category.id}
      initialValues={initialValues}
      parentOptions={parentOptions}
      hasChildren={(childCountResult.count ?? 0) > 0}
      productCount={productCountResult.count ?? 0}
    />
  );
}
