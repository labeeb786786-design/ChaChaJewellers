import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";

import { findBlockedProductIds } from "@/lib/pricing";
import { categoryOptionSchema } from "@/lib/schemas/category";
import { productListRowSchema, productWeightRowSchema } from "@/lib/schemas/product";
import { createClient } from "@/lib/supabase/server";
import { BlockedBanner } from "./_components/blocked-banner";
import { ProductFilters } from "./_components/product-filters";
import { ProductTable, type DisplayProduct } from "./_components/product-table";

export const metadata: Metadata = {
  title: "Products",
};

const PAGE_SIZE = 25;
const NIL_UUID = "00000000-0000-0000-0000-000000000000";

type ProductsSearchParams = {
  q?: string;
  category?: string;
  status?: string;
  page?: string;
};

function buildHref(filters: { q: string; category: string; status: string }, targetPage: number) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  if (targetPage > 1) params.set("page", String(targetPage));

  const qs = params.toString();
  return `/admin/products${qs ? `?${qs}` : ""}`;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const q = (params.q ?? "").trim();
  const categoryId = params.category ?? "";
  const status =
    params.status === "live" || params.status === "draft" || params.status === "blocked" ? params.status : "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const filters = { q, category: categoryId, status };

  const [categoriesResult, totalCountResult, liveCountResult] = await Promise.all([
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("products").select("id", { count: "exact", head: true }).is("removed_at", null),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .is("removed_at", null),
  ]);
  if (categoriesResult.error) {
    throw new Error(`Could not load categories: ${categoriesResult.error.message}`);
  }
  if (totalCountResult.error || liveCountResult.error) {
    const message = (totalCountResult.error ?? liveCountResult.error)!.message;
    throw new Error(`Could not load product counts: ${message}`);
  }
  const categories = z.array(categoryOptionSchema).parse(categoriesResult.data ?? []);

  // Zero-markup guard, run across the whole catalogue (not just this page) so
  // the banner count and "Can't publish" pills agree no matter which page or
  // filter you're looking at — and so the "blocked" status filter below has
  // the full set to filter against, not just this page's slice. See
  // findBlockedProductIds in lib/pricing.ts.
  const { data: weightRows, error: weightError } = await supabase
    .from("products")
    .select("id, pricing_mode, weight_grams")
    .neq("pricing_mode", "fixed")
    .not("weight_grams", "is", null)
    .is("removed_at", null);
  if (weightError) {
    throw new Error(`Could not check pricing bands: ${weightError.message}`);
  }
  const blockedCandidates = z.array(productWeightRowSchema).parse(weightRows ?? []);
  const blockedIds = await findBlockedProductIds(
    supabase,
    blockedCandidates.map((row) => ({
      id: row.id,
      pricingMode: row.pricing_mode,
      weightGrams: row.weight_grams,
    })),
  );

  let productsQuery = supabase
    .from("products")
    .select(
      "id, sku, name, pricing_mode, weight_grams, price_pence, is_active, size_label, category:categories(name), product_images(storage_path)",
      { count: "exact" },
    )
    .eq("product_images.is_primary", true)
    .is("removed_at", null)
    .order("created_at", { ascending: false });

  if (q) {
    productsQuery = productsQuery.textSearch("search_vector", q, { type: "websearch" });
  }
  if (categoryId) {
    productsQuery = productsQuery.eq("category_id", categoryId);
  }
  if (status === "blocked") {
    // "blocked" isn't a column — filter to the ids the guard above already
    // found. An empty list would otherwise mean "no filter" to .in(), so
    // fall back to a uuid nothing can match rather than showing everything.
    productsQuery = productsQuery.in("id", blockedIds.size > 0 ? [...blockedIds] : [NIL_UUID]);
  } else if (status) {
    productsQuery = productsQuery.eq("is_active", status === "live");
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data: productRows, count: filteredCount, error } = await productsQuery.range(
    from,
    from + PAGE_SIZE - 1,
  );

  if (error) {
    throw new Error(`Could not load products: ${error.message}`);
  }

  const products = z.array(productListRowSchema).parse(productRows ?? []);

  const displayProducts: DisplayProduct[] = products.map((product) => {
    const primaryImagePath = product.product_images[0]?.storage_path;
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      categoryName: product.category?.name ?? "Uncategorised",
      weightGrams: product.weight_grams,
      sizeLabel: product.size_label,
      pricePence: product.price_pence,
      isActive: product.is_active,
      isBlocked: blockedIds.has(product.id),
      imageUrl: primaryImagePath
        ? supabase.storage.from("product-images").getPublicUrl(primaryImagePath).data.publicUrl
        : null,
    };
  });

  const totalCount = totalCountResult.count ?? 0;
  const liveProductCount = liveCountResult.count ?? 0;
  const filteredTotal = filteredCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const hasFilters = Boolean(q || categoryId || status);

  return (
    <div>
      <div className="mb-4.5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-admin-ink">Products</h1>
          <p className="mt-1 text-sm text-admin-muted">
            {totalCount} product{totalCount === 1 ? "" : "s"} · {liveProductCount} live on the site
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-admin-control bg-admin-ink px-3.5 py-2 text-sm font-medium text-white hover:bg-[#33312c]"
        >
          Add product
        </Link>
      </div>

      <BlockedBanner count={blockedIds.size} />

      <ProductFilters categories={categories} q={q} categoryId={categoryId} status={status} />

      {displayProducts.length === 0 ? (
        <div className="rounded-admin-card border border-admin-rule bg-admin-surface px-6 py-14 text-center">
          {totalCount === 0 ? (
            <>
              <p className="text-sm font-semibold text-admin-ink">No products yet</p>
              <p className="mt-1 text-sm text-admin-muted">
                Add your first product to start building the catalogue.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-admin-ink">No products match your search</p>
              <p className="mt-1 text-sm text-admin-muted">
                Try a different search term
                {hasFilters ? (
                  <>
                    {" "}
                    or{" "}
                    <Link
                      href="/admin/products"
                      className="text-admin-gold underline underline-offset-2"
                    >
                      clear the filters
                    </Link>
                  </>
                ) : null}
                .
              </p>
            </>
          )}
        </div>
      ) : (
        <ProductTable
          products={displayProducts}
          page={page}
          totalPages={totalPages}
          buildHref={(targetPage) => buildHref(filters, targetPage)}
        />
      )}
    </div>
  );
}
