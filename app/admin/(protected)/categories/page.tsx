import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";

import { categoryRowSchema, type CategoryRow } from "@/lib/schemas/category";
import { createClient } from "@/lib/supabase/server";
import { DeleteCategoryDialog } from "./_components/delete-category-dialog";

export const metadata: Metadata = {
  title: "Categories",
};

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const [categoriesResult, productCategoryIdsResult] = await Promise.all([
    supabase
      .from("categories")
      .select(
        "id, name, slug, description, meta_title, meta_description, sort_order, is_active, parent_id, size_type",
      )
      .order("sort_order"),
    // The count used to decide whether a category can be deleted has to match
    // what actually blocks the delete at the database level — every product
    // row pointing at this category, not just the ones currently live or
    // draft — so this deliberately doesn't filter out removed_at products.
    supabase.from("products").select("category_id"),
  ]);

  if (categoriesResult.error) {
    throw new Error(`Could not load categories: ${categoriesResult.error.message}`);
  }
  if (productCategoryIdsResult.error) {
    throw new Error(`Could not load product counts: ${productCategoryIdsResult.error.message}`);
  }

  const categories = z.array(categoryRowSchema).parse(categoriesResult.data ?? []);

  const productCountByCategory = new Map<string, number>();
  for (const row of productCategoryIdsResult.data ?? []) {
    const categoryId = row.category_id as string | null;
    if (!categoryId) continue;
    productCountByCategory.set(categoryId, (productCountByCategory.get(categoryId) ?? 0) + 1);
  }

  const topLevel = categories.filter((category) => category.parent_id === null);
  const childrenByParent = new Map<string, CategoryRow[]>();
  for (const category of categories) {
    if (!category.parent_id) continue;
    const siblings = childrenByParent.get(category.parent_id) ?? [];
    siblings.push(category);
    childrenByParent.set(category.parent_id, siblings);
  }

  type Row = { category: CategoryRow; isChild: boolean };
  const rows: Row[] = [];
  for (const parent of topLevel) {
    rows.push({ category: parent, isChild: false });
    for (const child of childrenByParent.get(parent.id) ?? []) {
      rows.push({ category: child, isChild: true });
    }
  }

  return (
    <div>
      <div className="mb-4.5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-admin-ink">Categories</h1>
          <p className="mt-1 text-sm text-admin-muted">Group products so customers can browse by type.</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="rounded-admin-control bg-admin-ink px-3.5 py-2 text-sm font-medium text-white hover:bg-[#33312c]"
        >
          Add category
        </Link>
      </div>

      <div className="overflow-hidden rounded-admin-card border border-admin-rule bg-admin-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-165 border-collapse">
            <thead>
              <tr className="border-b border-admin-rule">
                <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                  Category
                </th>
                <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                  Web address
                </th>
                <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                  Products
                </th>
                <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                  Visible
                </th>
                <th className="px-3.5 py-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ category, isChild }) => {
                const productCount = productCountByCategory.get(category.id) ?? 0;
                const childCount = isChild ? 0 : (childrenByParent.get(category.id)?.length ?? 0);
                const blockReason =
                  productCount > 0
                    ? `${productCount} product${productCount === 1 ? "" : "s"}`
                    : childCount > 0
                      ? "Has subcategories"
                      : null;

                return (
                  <tr key={category.id} className="border-b border-admin-rule last:border-b-0 hover:bg-[#fcfbf8]">
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-1.5" style={isChild ? { paddingLeft: "1.5rem" } : undefined}>
                        {isChild && (
                          <span aria-hidden className="text-admin-faint">
                            └
                          </span>
                        )}
                        <span className="text-sm font-semibold text-admin-ink">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 font-admin-mono text-sm text-admin-faint">/{category.slug}</td>
                    <td className="px-3.5 py-3 font-admin-mono text-sm tabular-nums text-admin-ink">
                      {productCount}
                    </td>
                    <td className="px-3.5 py-3">
                      {category.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-admin-ok-soft px-2 py-0.75 text-xs font-semibold text-admin-ok">
                          <span className="h-1.25 w-1.25 rounded-full bg-current" aria-hidden />
                          Visible
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#f1efe9] px-2 py-0.75 text-xs font-semibold text-admin-muted">
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/categories/${category.id}/edit`}
                          className="rounded-admin-control border border-admin-rule-strong bg-admin-surface px-2.5 py-1.25 text-xs font-medium text-admin-ink hover:bg-[#f5f3ee]"
                        >
                          Edit
                        </Link>
                        {blockReason ? (
                          <span
                            className="rounded-admin-control border border-admin-rule px-2.5 py-1.25 text-xs font-medium text-admin-faint"
                            title={
                              productCount > 0
                                ? "Move or remove its products before deleting it."
                                : "Remove its subcategories before deleting it."
                            }
                          >
                            {blockReason}
                          </span>
                        ) : (
                          <DeleteCategoryDialog categoryId={category.id} categoryName={category.name} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
