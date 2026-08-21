"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CategoryOption, SizeType } from "@/lib/schemas/category";
import {
  defaultCategoryFormState,
  validateCategoryForm,
  type CategoryFormErrors,
  type CategoryFormState,
} from "@/lib/schemas/category-form";
import { createCategory, updateCategory } from "../actions";
import { Modal } from "../../products/_components/modal";

const inputClasses =
  "w-full rounded-admin-control border border-admin-rule-strong bg-admin-surface px-2.75 py-2 text-sm text-admin-ink outline-none focus:border-admin-gold focus:outline-2 focus:-outline-offset-1 focus:outline-admin-gold";
const readonlyClasses = "!bg-[#f5f3ee] !text-admin-muted";
const errorInputClasses = "!border-admin-danger focus:!border-admin-danger focus:!outline-admin-danger";

const SIZE_TYPE_LABELS: Record<SizeType, string> = {
  none: "No sizing",
  ring_letter: "Ring size (letter)",
  bangle_diameter: "Bangle size (diameter)",
  length_inches: "Length (inches)",
  hoop_mm: "Hoop size (mm)",
};

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

export function CategoryForm({
  categoryId,
  initialValues,
  parentOptions,
  hasChildren = false,
  productCount = 0,
}: {
  categoryId?: string;
  initialValues?: CategoryFormState;
  parentOptions: CategoryOption[];
  hasChildren?: boolean;
  productCount?: number;
}) {
  const router = useRouter();
  const isEditing = categoryId !== undefined;
  const original = initialValues ?? defaultCategoryFormState;

  const [values, setValues] = useState<CategoryFormState>(original);
  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSlugConfirmOpen, setIsSlugConfirmOpen] = useState(false);

  function set<K extends keyof CategoryFormState>(key: K, value: CategoryFormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const slugChanged = isEditing && values.slug.trim() !== original.slug.trim();
  const sizeTypeChanged = isEditing && values.sizeType !== original.sizeType;
  // pricingModeForCategorySlug() (lib/pricing.ts) matches these two literal
  // slugs — renaming either category away from them silently reclassifies
  // every product under it as ordinary dynamic_jewellery pricing.
  const originalSlugDrivesPricing = original.slug === "bullion" || original.slug === "diamond";

  async function doSave() {
    setIsSaving(true);
    setSaveError(null);

    const result = categoryId ? await updateCategory(categoryId, values) : await createCategory(values);

    if ("fieldErrors" in result) {
      setErrors(result.fieldErrors);
      setIsSaving(false);
      setIsSlugConfirmOpen(false);
      return;
    }
    if ("error" in result) {
      setSaveError(result.error);
      setIsSaving(false);
      setIsSlugConfirmOpen(false);
      return;
    }

    setIsSaving(false);
    setIsSlugConfirmOpen(false);
    router.push("/admin/categories");
    router.refresh();
  }

  function handleSaveClick() {
    const fieldErrors = validateCategoryForm(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    if (slugChanged && productCount > 0) {
      setIsSlugConfirmOpen(true);
      return;
    }
    void doSave();
  }

  return (
    <div>
      <div className="mb-4.5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-admin-ink">
            {isEditing ? "Edit category" : "Add category"}
          </h1>
          <p className="mt-1 text-sm text-admin-muted">Nothing changes on the site until you save.</p>
        </div>
        <Link
          href="/admin/categories"
          className="rounded-admin-control border border-admin-rule-strong bg-admin-surface px-3.5 py-2 text-sm font-medium text-admin-ink hover:bg-[#f5f3ee]"
        >
          Back to categories
        </Link>
      </div>

      <div className="max-w-160 rounded-admin-card border border-admin-rule bg-admin-surface p-4.5">
        <div className="space-y-3.5">
          <Field label="Name" htmlFor="cf-name" error={errors.name}>
            <input
              id="cf-name"
              type="text"
              value={values.name}
              onChange={(event) => set("name", event.target.value)}
              className={`${inputClasses} ${errors.name ? errorInputClasses : ""}`}
            />
          </Field>

          <Field
            label="Web address"
            htmlFor="cf-slug"
            hint="Lowercase letters, numbers and hyphens only, e.g. gold-bangles"
            error={errors.slug}
          >
            <input
              id="cf-slug"
              type="text"
              value={values.slug}
              onChange={(event) => set("slug", event.target.value)}
              className={`${inputClasses} ${errors.slug ? errorInputClasses : ""}`}
            />
          </Field>

          {slugChanged && productCount > 0 && (
            <p className="rounded-admin-control bg-admin-warn-soft px-3 py-2.5 text-xs text-[#6b4514]">
              {originalSlugDrivesPricing
                ? `This category prices ${productCount} product${productCount === 1 ? "" : "s"} from its web address specifically. Changing it will silently switch them to standard gold-jewellery pricing.`
                : `${productCount} product${productCount === 1 ? "" : "s"} are in this category — their web pages will move to the new address.`}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Parent category"
              htmlFor="cf-parent"
              hint={hasChildren ? "Has subcategories, so it can't sit under another category." : "Optional"}
            >
              <select
                id="cf-parent"
                value={values.parentId}
                disabled={hasChildren}
                onChange={(event) => set("parentId", event.target.value)}
                className={`${inputClasses} ${hasChildren ? readonlyClasses : ""}`}
              >
                <option value="">No parent (top level)</option>
                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Sizing" htmlFor="cf-size-type" hint="What size control products show, if any">
              <select
                id="cf-size-type"
                value={values.sizeType}
                onChange={(event) => set("sizeType", event.target.value as SizeType)}
                className={inputClasses}
              >
                {(Object.keys(SIZE_TYPE_LABELS) as SizeType[]).map((sizeType) => (
                  <option key={sizeType} value={sizeType}>
                    {SIZE_TYPE_LABELS[sizeType]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {sizeTypeChanged && productCount > 0 && (
            <p className="rounded-admin-control bg-admin-warn-soft px-3 py-2.5 text-xs text-[#6b4514]">
              {productCount} product{productCount === 1 ? "" : "s"} in this category already have a size set.
              Changing this leaves their existing size meaningless — you may want to check them afterwards.
            </p>
          )}

          <Field label="Description" htmlFor="cf-description" hint="Shown on the category page">
            <textarea
              id="cf-description"
              rows={3}
              value={values.description}
              onChange={(event) => set("description", event.target.value)}
              className={inputClasses}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Page title" htmlFor="cf-meta-title" hint="For search engines, optional">
              <input
                id="cf-meta-title"
                type="text"
                value={values.metaTitle}
                onChange={(event) => set("metaTitle", event.target.value)}
                className={inputClasses}
              />
            </Field>
            <Field
              label="Display order"
              htmlFor="cf-sort-order"
              hint="Lower numbers show first"
              error={errors.sortOrder}
            >
              <input
                id="cf-sort-order"
                type="number"
                step={1}
                value={values.sortOrder}
                onChange={(event) => set("sortOrder", event.target.value)}
                className={`${inputClasses} ${errors.sortOrder ? errorInputClasses : ""}`}
              />
            </Field>
          </div>

          <Field label="Page description" htmlFor="cf-meta-description" hint="For search engines, optional">
            <textarea
              id="cf-meta-description"
              rows={2}
              value={values.metaDescription}
              onChange={(event) => set("metaDescription", event.target.value)}
              className={inputClasses}
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-admin-ink">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(event) => set("isActive", event.target.checked)}
              className="h-4 w-4 rounded border-admin-rule-strong text-admin-gold focus:outline-admin-gold"
            />
            Visible on the site
          </label>
        </div>

        {saveError && (
          <div className="mt-3.5 rounded-admin-control border border-[#efcfcf] bg-admin-danger-soft px-3 py-2.5 text-sm text-[#7a2020]">
            {saveError}
          </div>
        )}

        <div className="mt-4.5">
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="rounded-admin-control bg-admin-ink px-3.5 py-2.5 text-sm font-medium text-white hover:bg-[#33312c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save category"}
          </button>
        </div>
      </div>

      {isSlugConfirmOpen && (
        <Modal
          labelledBy="slug-confirm-title"
          onClose={() => {
            if (!isSaving) setIsSlugConfirmOpen(false);
          }}
        >
          <h3 id="slug-confirm-title" className="mb-2 text-base font-bold text-admin-ink">
            Change this category&apos;s web address?
          </h3>
          <p className="text-sm text-admin-muted">
            {originalSlugDrivesPricing
              ? `This category prices ${productCount} product${productCount === 1 ? "" : "s"} from its web address specifically ("${original.slug}"). Changing it will silently switch them to standard gold-jewellery pricing instead — check Pricing afterwards if that's not what you want.`
              : `${productCount} product${productCount === 1 ? "" : "s"} are in this category. Their web pages will move to the new address.`}
          </p>
          {saveError && <p className="mt-2 text-sm text-admin-danger">{saveError}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSlugConfirmOpen(false)}
              disabled={isSaving}
              className="rounded-admin-control border border-admin-rule-strong bg-admin-surface px-3.5 py-2 text-sm font-medium text-admin-ink hover:bg-[#f5f3ee] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={doSave}
              disabled={isSaving}
              className="rounded-admin-control bg-admin-ink px-3.5 py-2 text-sm font-medium text-white hover:bg-[#33312c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Yes, change it"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
