"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { parseMoney } from "@/lib/money";
import { pricingModeForCategorySlug } from "@/lib/pricing";
import type { CategoryFormOption, SizeType } from "@/lib/schemas/category";
import type { UploadedImage } from "@/lib/schemas/product-image";
import {
  defaultProductFormState,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormState,
} from "@/lib/schemas/product-form";
import { BANGLE_DIAMETER_OPTIONS, RING_LETTER_OPTIONS } from "@/lib/size";
import { slugify, suggestSku } from "@/lib/slug";
import type { MetalEnum, ProductTypeEnum, PurityEnum } from "@/types/db";
import { createProduct, publishProduct, unpublishProduct, updateProduct } from "../actions";
import { ImageUploader } from "./image-uploader";
import { PriceBreakdown } from "./price-breakdown";
import { PricingModePicker } from "./pricing-mode-picker";
import { PublishConfirmDialog } from "./publish-confirm-dialog";
import { usePricePreview } from "./use-price-preview";

const inputClasses =
  "w-full rounded-admin-control border border-admin-rule-strong bg-admin-surface px-2.75 py-2 text-sm text-admin-ink outline-none focus:border-admin-gold focus:outline-2 focus:-outline-offset-1 focus:outline-admin-gold";
const readonlyClasses = "!bg-[#f5f3ee] !text-admin-muted";
const errorInputClasses = "!border-admin-danger focus:!border-admin-danger focus:!outline-admin-danger";

const PURITY_OPTIONS: PurityEnum[] = ["24k", "22k", "21k", "18k", "9k", "999", "925"];
const METAL_OPTIONS: Array<{ value: MetalEnum; label: string }> = [
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
];
const PRODUCT_TYPE_OPTIONS: Array<{ value: ProductTypeEnum; label: string }> = [
  { value: "in_stock", label: "In stock" },
  { value: "made_to_order", label: "Made to order" },
];

const SIZE_FIELD_LABEL: Record<Exclude<SizeType, "none">, string> = {
  ring_letter: "Ring size",
  bangle_diameter: "Bangle size",
  length_inches: "Length",
  hoop_mm: "Hoop size",
};
const SIZE_FIELD_HINT: Record<Exclude<SizeType, "none">, string> = {
  ring_letter: "UK letter size",
  bangle_diameter: "Certified diameter",
  length_inches: "In inches",
  hoop_mm: "In millimetres",
};

/**
 * Mirrors pricingModeForCategorySlug() (lib/pricing.ts) in words, for the
 * line under the now-locked mode picker — the admin should understand the
 * rule, not just find the control dead. This is display copy only; the
 * server derives and enforces the actual mode independently.
 */
function pricingModeExplanation(category: CategoryFormOption | undefined): string {
  if (!category) return "Choose a category — it sets the pricing mode for you.";
  if (category.slug === "bullion") return "Bullion is always priced from the live gold rate.";
  if (category.slug === "diamond") return "Diamond is always a fixed price.";
  return "This category is priced from the live gold rate, so the mode is set for you.";
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.25 block text-sm font-medium text-admin-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-admin-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-admin-faint">{hint}</p>
      ) : null}
    </div>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3.5 font-admin-mono text-[10px] font-semibold tracking-[0.12em] text-admin-faint uppercase">
      {children}
    </div>
  );
}

export function ProductForm({
  productId: initialProductId,
  categories,
  initialValues,
  initialImages,
}: {
  productId?: string;
  categories: CategoryFormOption[];
  initialValues?: ProductFormState;
  initialImages?: UploadedImage[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormState>(initialValues ?? defaultProductFormState);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  // Starts null for a brand-new product. The image uploader creates a draft
  // row the first time a photo is added (nothing to attach images to
  // otherwise) and reports its id back up here — see onProductCreated below.
  const [productId, setProductId] = useState<string | null>(initialProductId ?? null);
  const isEditing = productId !== null;
  // Fixed at mount, unlike isEditing above: true for the whole life of a
  // "new product" session even after a photo upload silently creates a
  // draft row and isEditing flips true. Gates "Save and add another," which
  // only makes sense while creating products in a row, not while editing
  // one that already existed when the page loaded.
  const isNewProductFlow = initialProductId === undefined;

  const [pendingAction, setPendingAction] = useState<"draft" | "publish" | "addAnother" | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  // Bumped on "Save and add another" so ImageUploader (which owns its own
  // upload/thumbnail state internally) fully remounts for the next product
  // instead of carrying the previous one's photos over.
  const [formGeneration, setFormGeneration] = useState(0);

  function set<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // Categories with children (currently only Earrings) become a
  // non-selectable optgroup header in the dropdown below — the admin must
  // pick a child. size_type comes from whichever category is selected, and
  // drives which size control (if any) renders.
  const topLevelCategories = categories.filter((category) => category.parent_id === null);
  const childCategoriesByParent = new Map<string, CategoryFormOption[]>();
  for (const category of categories) {
    if (!category.parent_id) continue;
    const siblings = childCategoriesByParent.get(category.parent_id) ?? [];
    siblings.push(category);
    childCategoriesByParent.set(category.parent_id, siblings);
  }

  const selectedCategory = categories.find((category) => category.id === values.categoryId);
  const sizeType: SizeType = selectedCategory?.size_type ?? "none";
  // No category means no valid pricing mode and no size type — the weight
  // and price inputs stay disabled, the size field stays hidden (already
  // true, since sizeType above falls back to "none"), and the price
  // breakdown shows an explanatory message instead of calculating. This
  // also covers the Earrings group header: it's never a selectable
  // categoryId to begin with, so it can never make hasCategory true.
  const hasCategory = values.categoryId !== "";

  // Switching category resets the size value only when the size type
  // actually changes — e.g. Rings -> Diamond (both ring_letter) keeps
  // whatever was entered; Rings -> Bangles clears it, since an "N½" ring
  // letter isn't a valid bangle diameter. Pricing mode is set from the
  // category every time, one-to-one — never left for the admin to pick;
  // see pricingModeForCategorySlug in lib/pricing.ts, re-derived
  // server-side from the same rule and never trusted from this state.
  function handleCategoryChange(newCategoryId: string) {
    const newCategory = categories.find((category) => category.id === newCategoryId);
    const newSizeType = newCategory?.size_type ?? "none";
    const sizeTypeChanged = newSizeType !== sizeType;

    setValues((prev) => ({
      ...prev,
      categoryId: newCategoryId,
      pricingMode: newCategory ? pricingModeForCategorySlug(newCategory.slug) : prev.pricingMode,
      sizeValue: sizeTypeChanged ? "" : prev.sizeValue,
    }));
    setErrors((prev) => {
      if (!prev.categoryId) return prev;
      const next = { ...prev };
      delete next.categoryId;
      return next;
    });
  }

  const slugPreview = slugify(values.name) || "your-product-name";
  const skuPreview = useMemo(() => suggestSku(values.name), [values.name]);

  const isDynamic = values.pricingMode !== "fixed";
  const preview = usePricePreview(values.pricingMode, values.metal, values.weightGrams);

  const canPublishNow = isDynamic
    ? preview.status === "success" &&
      preview.band !== null &&
      preview.band.markupPercent > 0 &&
      preview.totalPence !== null
    : (() => {
        try {
          return parseMoney(values.fixedPrice.trim()) > 0;
        } catch {
          return false;
        }
      })();

  // The uploader calls this once it's created a draft row for a brand-new
  // product (see ImageUploader / ensureDraftProduct). Swapping the URL to
  // the edit route means a refresh from here on finds the same product
  // instead of landing back on a blank "new" page.
  function handleProductCreated(id: string) {
    setProductId(id);
    router.replace(`/admin/products/${id}/edit`);
  }

  /**
   * create-or-update, shared by every button below. Returns the result
   * directly rather than relying on callers reading saveError right after —
   * state updates aren't synchronous, so a caller reading saveError in the
   * same async function right after calling this would see last render's
   * value, not the one just set.
   */
  async function saveFields(): Promise<{ id: string } | { error: string } | null> {
    const fieldErrors = validateProductForm(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return null;

    setSaveError(null);
    const result = productId ? await updateProduct(productId, values) : await createProduct(values);

    if ("fieldErrors" in result) {
      setErrors(result.fieldErrors);
      return null;
    }
    if ("error" in result) {
      setSaveError(result.error);
      return { error: result.error };
    }

    if (!productId) {
      setProductId(result.id);
      router.replace(`/admin/products/${result.id}/edit`);
    }
    return { id: productId ?? result.id };
  }

  async function handleSaveDraft() {
    setPendingAction("draft");
    const saved = await saveFields();
    if (saved && "id" in saved) {
      const result = await unpublishProduct(saved.id);
      if ("error" in result) setSaveError(result.error);
    }
    setPendingAction(null);
  }

  function handlePublishClick() {
    const fieldErrors = validateProductForm(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;
    setPublishError(null);
    setIsPublishDialogOpen(true);
  }

  async function handleConfirmPublish() {
    setPendingAction("publish");
    setPublishError(null);

    const saved = await saveFields();
    if (!saved) {
      setPublishError("Some fields need fixing — check the form.");
      setPendingAction(null);
      return;
    }
    if ("error" in saved) {
      setPublishError(saved.error);
      setPendingAction(null);
      return;
    }

    const result = await publishProduct(saved.id);
    if ("error" in result) {
      setPublishError(result.error);
      setPendingAction(null);
      return;
    }

    setIsPublishDialogOpen(false);
    setPendingAction(null);
    router.push("/admin/products");
  }

  function handleReviewPricing() {
    setIsPublishDialogOpen(false);
    router.push("/admin/pricing");
  }

  async function handleSaveAndAddAnother() {
    setPendingAction("addAnother");
    const saved = await saveFields();
    if (!saved || "error" in saved) {
      setPendingAction(null);
      return;
    }

    const result = await unpublishProduct(saved.id);
    if ("error" in result) {
      setSaveError(result.error);
      setPendingAction(null);
      return;
    }

    setValues({ ...defaultProductFormState, categoryId: values.categoryId, pricingMode: values.pricingMode });
    setErrors({});
    setSaveError(null);
    setProductId(null);
    setFormGeneration((generation) => generation + 1);
    router.replace("/admin/products/new");
    setPendingAction(null);
  }

  return (
    <div>
      <div className="mb-4.5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-admin-ink">
            {isEditing ? "Edit product" : "Add product"}
          </h1>
          <p className="mt-1 text-sm text-admin-muted">Nothing appears on the site until you publish it</p>
        </div>
        <Link
          href="/admin/products"
          className="rounded-admin-control border border-admin-rule-strong bg-admin-surface px-3.5 py-2 text-sm font-medium text-admin-ink hover:bg-[#f5f3ee]"
        >
          Back to products
        </Link>
      </div>

      <div className="grid items-start gap-4.5 min-[820px]:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="rounded-admin-card border border-admin-rule bg-admin-surface">
          <div className="space-y-3.5 border-b border-admin-rule p-4.5">
            <Legend>The basics</Legend>

            <div>
              <label htmlFor="pf-name" className="mb-1.25 block text-sm font-medium text-admin-ink">
                Product name
              </label>
              <input
                id="pf-name"
                type="text"
                value={values.name}
                onChange={(event) => set("name", event.target.value)}
                className={`${inputClasses} ${errors.name ? errorInputClasses : ""}`}
              />
              {errors.name ? (
                <p className="mt-1 text-xs text-admin-danger">{errors.name}</p>
              ) : (
                <p className="mt-1 font-admin-mono text-xs text-admin-faint">
                  Web address:{" "}
                  <code className="rounded-[3px] bg-[#f3f1eb] px-1 py-0.5">/products/{slugPreview}</code>
                  {" · "}
                  Code:{" "}
                  <code className="rounded-[3px] bg-[#f3f1eb] px-1 py-0.5">
                    {skuPreview || "generated from the name"}
                  </code>
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Category" htmlFor="pf-category" error={errors.categoryId}>
                <select
                  id="pf-category"
                  value={values.categoryId}
                  onChange={(event) => handleCategoryChange(event.target.value)}
                  className={`${inputClasses} ${errors.categoryId ? errorInputClasses : ""}`}
                >
                  <option value="">Choose a category</option>
                  {topLevelCategories.map((category) => {
                    const children = childCategoriesByParent.get(category.id);
                    if (children && children.length > 0) {
                      return (
                        <optgroup key={category.id} label={category.name}>
                          {children.map((child) => (
                            <option key={child.id} value={child.id}>
                              {category.name} › {child.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    }
                    return (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    );
                  })}
                </select>
              </Field>
              <Field
                label="How many in stock"
                htmlFor="pf-stock"
                hint="One-off piece? Leave it at 1"
                error={errors.stockQuantity}
              >
                <input
                  id="pf-stock"
                  type="number"
                  min={0}
                  step={1}
                  value={values.stockQuantity}
                  onChange={(event) => set("stockQuantity", event.target.value)}
                  className={`${inputClasses} ${errors.stockQuantity ? errorInputClasses : ""}`}
                />
              </Field>
            </div>

            {sizeType !== "none" && (
              <Field label={SIZE_FIELD_LABEL[sizeType]} htmlFor="pf-size" hint={SIZE_FIELD_HINT[sizeType]}>
                {sizeType === "ring_letter" || sizeType === "bangle_diameter" ? (
                  <select
                    id="pf-size"
                    value={values.sizeValue}
                    onChange={(event) => set("sizeValue", event.target.value)}
                    className={inputClasses}
                  >
                    <option value="">Choose a size</option>
                    {(sizeType === "ring_letter" ? RING_LETTER_OPTIONS : BANGLE_DIAMETER_OPTIONS).map(
                      (option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ),
                    )}
                  </select>
                ) : (
                  <input
                    id="pf-size"
                    type="number"
                    min={0}
                    step={sizeType === "hoop_mm" ? 1 : 0.1}
                    value={values.sizeValue}
                    onChange={(event) => set("sizeValue", event.target.value)}
                    className={inputClasses}
                  />
                )}
              </Field>
            )}
          </div>

          <div className="space-y-3.5 border-b border-admin-rule p-4.5">
            <Legend>How this is priced</Legend>

            <PricingModePicker value={hasCategory ? values.pricingMode : null} />
            <p className="text-xs text-admin-faint">{pricingModeExplanation(selectedCategory)}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              {isDynamic ? (
                <>
                  <Field
                    label="Weight in grams"
                    htmlFor="pf-weight"
                    hint={hasCategory ? "From your scale, to 2 decimal places" : "Choose a category first"}
                    error={errors.weightGrams}
                  >
                    <input
                      id="pf-weight"
                      type="number"
                      step="0.01"
                      min={0}
                      disabled={!hasCategory}
                      value={values.weightGrams}
                      onChange={(event) => set("weightGrams", event.target.value)}
                      className={`${inputClasses} ${!hasCategory ? readonlyClasses : ""} ${errors.weightGrams ? errorInputClasses : ""}`}
                    />
                  </Field>
                  <Field label="Price" htmlFor="pf-calc-price" hint="Worked out for you, updates twice daily">
                    <input
                      id="pf-calc-price"
                      type="text"
                      readOnly
                      value="Calculated when you save"
                      className={`${inputClasses} ${readonlyClasses}`}
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field
                    label="Price"
                    htmlFor="pf-fixed-price"
                    hint={hasCategory ? "In pounds, e.g. 1295.00" : "Choose a category first"}
                    error={errors.fixedPrice}
                  >
                    <input
                      id="pf-fixed-price"
                      type="text"
                      inputMode="decimal"
                      placeholder="1295.00"
                      disabled={!hasCategory}
                      value={values.fixedPrice}
                      onChange={(event) => set("fixedPrice", event.target.value)}
                      className={`${inputClasses} ${!hasCategory ? readonlyClasses : ""} ${errors.fixedPrice ? errorInputClasses : ""}`}
                    />
                  </Field>
                  <Field
                    label="Weight in grams"
                    htmlFor="pf-weight-unused"
                    hint="Fixed-price items don't need a weight"
                  >
                    <input
                      id="pf-weight-unused"
                      type="text"
                      readOnly
                      value="Not used"
                      className={`${inputClasses} ${readonlyClasses}`}
                    />
                  </Field>
                </>
              )}
            </div>
          </div>

          <div className="border-b border-admin-rule p-4.5">
            <Legend>Photos</Legend>
            <ImageUploader
              key={formGeneration}
              productId={productId}
              categoryId={values.categoryId}
              productName={values.name}
              initialImages={initialImages ?? []}
              onProductCreated={handleProductCreated}
            />
          </div>

          <div className="space-y-3.5 border-b border-admin-rule p-4.5">
            <Field
              label="Short description"
              htmlFor="pf-short-description"
              hint="A one-line summary shown in listings"
            >
              <input
                id="pf-short-description"
                type="text"
                value={values.shortDescription}
                onChange={(event) => set("shortDescription", event.target.value)}
                className={inputClasses}
              />
            </Field>
            <Field label="Full description" htmlFor="pf-description" hint="Shown on the product page">
              <textarea
                id="pf-description"
                rows={4}
                value={values.description}
                onChange={(event) => set("description", event.target.value)}
                className={inputClasses}
              />
            </Field>
          </div>

          <details className="group p-4.5">
            <summary className="cursor-pointer list-none font-admin-mono text-[10px] font-semibold tracking-[0.12em] text-admin-faint uppercase [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1.5">
                More options
                <span aria-hidden className="text-[9px] transition-transform group-open:rotate-90">
                  ▶
                </span>
              </span>
            </summary>

            <div className="mt-3.5 space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Purity" htmlFor="pf-purity">
                  <select
                    id="pf-purity"
                    value={values.purity}
                    onChange={(event) => set("purity", event.target.value as PurityEnum)}
                    className={inputClasses}
                  >
                    {PURITY_OPTIONS.map((purity) => (
                      <option key={purity} value={purity}>
                        {purity}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Metal" htmlFor="pf-metal">
                  <select
                    id="pf-metal"
                    value={values.metal}
                    onChange={(event) => set("metal", event.target.value as MetalEnum)}
                    className={inputClasses}
                  >
                    {METAL_OPTIONS.map((metal) => (
                      <option key={metal.value} value={metal.value}>
                        {metal.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Product type" htmlFor="pf-product-type">
                  <select
                    id="pf-product-type"
                    value={values.productType}
                    onChange={(event) => set("productType", event.target.value as ProductTypeEnum)}
                    className={inputClasses}
                  >
                    {PRODUCT_TYPE_OPTIONS.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </Field>
                {values.productType === "made_to_order" && (
                  <Field
                    label="Lead time (days)"
                    htmlFor="pf-lead-time"
                    hint="How many days until it's ready"
                    error={errors.leadTimeDays}
                  >
                    <input
                      id="pf-lead-time"
                      type="number"
                      min={1}
                      step={1}
                      value={values.leadTimeDays}
                      onChange={(event) => set("leadTimeDays", event.target.value)}
                      className={`${inputClasses} ${errors.leadTimeDays ? errorInputClasses : ""}`}
                    />
                  </Field>
                )}
                <Field
                  label="Display order"
                  htmlFor="pf-sort-order"
                  hint="Lower numbers show first"
                  error={errors.sortOrder}
                >
                  <input
                    id="pf-sort-order"
                    type="number"
                    step={1}
                    value={values.sortOrder}
                    onChange={(event) => set("sortOrder", event.target.value)}
                    className={`${inputClasses} ${errors.sortOrder ? errorInputClasses : ""}`}
                  />
                </Field>
                <Field label="Tags" htmlFor="pf-tags" hint="Comma-separated, e.g. bridal, statement, gift">
                  <input
                    id="pf-tags"
                    type="text"
                    value={values.tags}
                    onChange={(event) => set("tags", event.target.value)}
                    className={inputClasses}
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2 text-sm text-admin-ink">
                <input
                  type="checkbox"
                  checked={values.isFeatured}
                  onChange={(event) => set("isFeatured", event.target.checked)}
                  className="h-4 w-4 rounded border-admin-rule-strong text-admin-gold focus:outline-admin-gold"
                />
                Feature this product
              </label>
            </div>
          </details>
        </div>

        <div className="sticky top-4.5">
          <PriceBreakdown
            pricingMode={values.pricingMode}
            fixedPrice={values.fixedPrice}
            preview={preview}
            hasCategory={hasCategory}
          />

          {saveError && (
            <div className="mt-3.5 rounded-admin-control border border-[#efcfcf] bg-admin-danger-soft px-3 py-2.5 text-sm text-[#7a2020]">
              {saveError}
            </div>
          )}

          <div className="mt-3.5 grid gap-2">
            <button
              type="button"
              onClick={handlePublishClick}
              disabled={pendingAction !== null || !canPublishNow}
              className="w-full rounded-admin-control bg-admin-ink px-3.5 py-2.5 text-center text-sm font-medium text-white hover:bg-[#33312c] disabled:cursor-not-allowed disabled:bg-admin-rule-strong"
            >
              Publish to the site
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={pendingAction !== null}
              className="w-full rounded-admin-control border border-admin-rule-strong bg-admin-surface px-3.5 py-2.5 text-center text-sm font-medium text-admin-ink hover:bg-[#f5f3ee] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingAction === "draft" ? "Saving…" : "Save as draft"}
            </button>
            {isNewProductFlow && (
              <button
                type="button"
                onClick={handleSaveAndAddAnother}
                disabled={pendingAction !== null}
                className="w-full rounded-admin-control border border-admin-rule-strong bg-admin-surface px-3.5 py-2.5 text-center text-sm font-medium text-admin-ink hover:bg-[#f5f3ee] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingAction === "addAnother" ? "Saving…" : "Save and add another"}
              </button>
            )}
          </div>
        </div>
      </div>

      {isPublishDialogOpen && (
        <PublishConfirmDialog
          productName={values.name}
          pricingMode={values.pricingMode}
          fixedPrice={values.fixedPrice}
          preview={preview}
          isSubmitting={pendingAction === "publish"}
          error={publishError}
          onConfirm={handleConfirmPublish}
          onReviewPricing={handleReviewPricing}
          onCancel={() => setIsPublishDialogOpen(false)}
        />
      )}
    </div>
  );
}
