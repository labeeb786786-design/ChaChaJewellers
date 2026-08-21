import type { Metadata } from "next";
import { z } from "zod";

import { categoryOptionSchema } from "@/lib/schemas/category";
import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "../_components/category-form";

export const metadata: Metadata = {
  title: "Add category",
};

export default async function NewCategoryPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("categories").select("id, name").is("parent_id", null).order("name");
  if (error) {
    throw new Error(`Could not load categories: ${error.message}`);
  }

  const parentOptions = z.array(categoryOptionSchema).parse(data ?? []);

  return <CategoryForm parentOptions={parentOptions} />;
}
