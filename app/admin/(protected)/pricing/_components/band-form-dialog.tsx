"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { BandApplies, PricingBandRow } from "@/lib/schemas/pricing";
import {
  defaultBandFormState,
  validateBandForm,
  type BandFormErrors,
  type BandFormState,
} from "@/lib/schemas/pricing-band-form";
import { createBand, updateBand } from "../actions";
import { Modal } from "../../products/_components/modal";
import { BandPreview, type PreviewCandidate } from "./band-preview";

const inputClasses =
  "w-full rounded-admin-control border border-admin-rule-strong bg-admin-surface px-2.75 py-2 text-sm text-admin-ink outline-none focus:border-admin-gold focus:outline-2 focus:-outline-offset-1 focus:outline-admin-gold";
const errorInputClasses = "!border-admin-danger focus:!border-admin-danger focus:!outline-admin-danger";

// Any change to markup or VAT bigger than this needs an explicit "are you
// sure" — the whole point being to catch a mistyped 3.5-for-35 before it
// reprices the catalogue at a loss.
const CONFIRM_THRESHOLD_PP = 10;

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

export function BandFormDialog({
  appliesTo,
  band,
  defaultMinWeightG = 0,
  candidates,
}: {
  appliesTo: BandApplies;
  band?: PricingBandRow;
  defaultMinWeightG?: number;
  candidates: PreviewCandidate[];
}) {
  const router = useRouter();
  const isEditing = band !== undefined;

  const initialValues = useMemo<BandFormState>(
    () =>
      band
        ? {
            label: band.label,
            minWeightG: String(band.min_weight_g),
            maxWeightG: String(band.max_weight_g),
            markupPercent: String(band.markup_percent),
            vatPercent: String(band.vat_percent),
            isActive: band.is_active,
          }
        : defaultBandFormState(defaultMinWeightG),
    [band, defaultMinWeightG],
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [values, setValues] = useState<BandFormState>(initialValues);
  const [errors, setErrors] = useState<BandFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function openDialog() {
    setValues(initialValues);
    setErrors({});
    setSaveError(null);
    setIsConfirming(false);
    setIsOpen(true);
  }

  function set<K extends keyof BandFormState>(key: K, value: BandFormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function doSave() {
    setIsSaving(true);
    setSaveError(null);

    const result = isEditing ? await updateBand(band.id, appliesTo, values) : await createBand(appliesTo, values);

    if ("fieldErrors" in result) {
      setErrors(result.fieldErrors);
      setIsConfirming(false);
      setIsSaving(false);
      return;
    }
    if ("error" in result) {
      setSaveError(result.error);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setIsOpen(false);
    router.refresh();
  }

  function handleSaveClick() {
    const fieldErrors = validateBandForm(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    if (isEditing) {
      const markupDelta = Math.abs(Number(values.markupPercent) - band.markup_percent);
      const vatDelta = Math.abs(Number(values.vatPercent) - band.vat_percent);
      if (markupDelta > CONFIRM_THRESHOLD_PP || vatDelta > CONFIRM_THRESHOLD_PP) {
        setIsConfirming(true);
        return;
      }
    }
    void doSave();
  }

  const minWeightG = Number(values.minWeightG);
  const maxWeightG = Number(values.maxWeightG);
  const markupPercent = Number(values.markupPercent);
  const vatPercent = Number(values.vatPercent);

  return (
    <>
      {isEditing ? (
        <button
          type="button"
          onClick={openDialog}
          className="rounded-admin-control border border-admin-rule-strong bg-admin-surface px-2.5 py-1.25 text-xs font-medium text-admin-ink hover:bg-[#f5f3ee]"
        >
          Edit
        </button>
      ) : (
        <button
          type="button"
          onClick={openDialog}
          className="rounded-admin-control bg-admin-ink px-3.5 py-2 text-sm font-medium text-white hover:bg-[#33312c]"
        >
          Add {appliesTo} band
        </button>
      )}

      {isOpen && (
        <Modal
          labelledBy="band-dialog-title"
          onClose={() => {
            if (!isSaving) setIsOpen(false);
          }}
        >
          {!isConfirming ? (
            <>
              <h3 id="band-dialog-title" className="mb-3 text-base font-bold text-admin-ink">
                {isEditing ? `Edit ${band.label}` : `Add a ${appliesTo} band`}
              </h3>

              <div className="space-y-3">
                <Field label="Label" htmlFor="bf-label" hint="e.g. 20-40g" error={errors.label}>
                  <input
                    id="bf-label"
                    type="text"
                    value={values.label}
                    onChange={(event) => set("label", event.target.value)}
                    className={`${inputClasses} ${errors.label ? errorInputClasses : ""}`}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="From (g)" htmlFor="bf-min" error={errors.minWeightG}>
                    <input
                      id="bf-min"
                      type="number"
                      min={0}
                      step="0.01"
                      value={values.minWeightG}
                      onChange={(event) => set("minWeightG", event.target.value)}
                      className={`${inputClasses} ${errors.minWeightG ? errorInputClasses : ""}`}
                    />
                  </Field>
                  <Field label="Up to, not including (g)" htmlFor="bf-max" error={errors.maxWeightG}>
                    <input
                      id="bf-max"
                      type="number"
                      min={0}
                      step="0.01"
                      value={values.maxWeightG}
                      onChange={(event) => set("maxWeightG", event.target.value)}
                      className={`${inputClasses} ${errors.maxWeightG ? errorInputClasses : ""}`}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Markup %" htmlFor="bf-markup" error={errors.markupPercent}>
                    <input
                      id="bf-markup"
                      type="number"
                      min={0}
                      max={500}
                      step="0.1"
                      value={values.markupPercent}
                      onChange={(event) => set("markupPercent", event.target.value)}
                      className={`${inputClasses} ${errors.markupPercent ? errorInputClasses : ""}`}
                    />
                  </Field>
                  <Field label="VAT %" htmlFor="bf-vat" error={errors.vatPercent}>
                    <input
                      id="bf-vat"
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={values.vatPercent}
                      onChange={(event) => set("vatPercent", event.target.value)}
                      className={`${inputClasses} ${errors.vatPercent ? errorInputClasses : ""}`}
                    />
                  </Field>
                </div>

                <label className="flex items-center gap-2 text-sm text-admin-ink">
                  <input
                    type="checkbox"
                    checked={values.isActive}
                    onChange={(event) => set("isActive", event.target.checked)}
                    className="h-4 w-4 rounded border-admin-rule-strong text-admin-gold focus:outline-admin-gold"
                  />
                  Active
                </label>

                <BandPreview
                  appliesTo={appliesTo}
                  minWeightG={minWeightG}
                  maxWeightG={maxWeightG}
                  markupPercent={markupPercent}
                  vatPercent={vatPercent}
                  candidates={candidates}
                />
              </div>

              {saveError && <p className="mt-3 text-sm text-admin-danger">{saveError}</p>}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSaving}
                  className="rounded-admin-control border border-admin-rule-strong bg-admin-surface px-3.5 py-2 text-sm font-medium text-admin-ink hover:bg-[#f5f3ee] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  className="rounded-admin-control bg-admin-ink px-3.5 py-2 text-sm font-medium text-white hover:bg-[#33312c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 id="band-dialog-title" className="mb-2 text-base font-bold text-admin-ink">
                Confirm this change
              </h3>
              <p className="text-sm text-admin-muted">
                That&apos;s a change of more than {CONFIRM_THRESHOLD_PP} percentage points:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-admin-ink">
                {Math.abs(Number(values.markupPercent) - (band?.markup_percent ?? 0)) > CONFIRM_THRESHOLD_PP && (
                  <li>
                    Markup: <strong>{band?.markup_percent}%</strong> → <strong>{values.markupPercent}%</strong>
                  </li>
                )}
                {Math.abs(Number(values.vatPercent) - (band?.vat_percent ?? 0)) > CONFIRM_THRESHOLD_PP && (
                  <li>
                    VAT: <strong>{band?.vat_percent}%</strong> → <strong>{values.vatPercent}%</strong>
                  </li>
                )}
              </ul>
              <p className="mt-2 text-xs text-admin-faint">
                This only changes future calculations — nothing already priced updates until the next gold
                rate run.
              </p>

              {saveError && <p className="mt-3 text-sm text-admin-danger">{saveError}</p>}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  disabled={isSaving}
                  className="rounded-admin-control border border-admin-rule-strong bg-admin-surface px-3.5 py-2 text-sm font-medium text-admin-ink hover:bg-[#f5f3ee] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={doSave}
                  disabled={isSaving}
                  className="rounded-admin-control bg-admin-ink px-3.5 py-2 text-sm font-medium text-white hover:bg-[#33312c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Saving…" : "Yes, save it"}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
