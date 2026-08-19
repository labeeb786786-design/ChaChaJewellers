import type { Metadata } from "next";
import { z } from "zod";

import { categoryOptionSchema } from "@/lib/schemas/category";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "../_components/product-form";

export const metadata: Metadata = {
  title: "Add product",
};

export default async function NewProductPage() {
  const supabase = await createClient();

  const { data: categoryRows, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    throw new Error(`Could not load categories: ${error.message}`);
  }

  const categories = z.array(categoryOptionSchema).parse(categoryRows ?? []);

  return <ProductForm categories={categories} />;
}
