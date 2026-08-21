"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  PRICE_LOCK_MINUTES_CEILING,
  PRICE_ROUNDING_OPTIONS,
  validateSettingsForm,
  type SettingsFormErrors,
  type SettingsFormState,
} from "@/lib/schemas/settings";
import { updateSettings } from "../actions";

const inputClasses =
  "w-full rounded-admin-control border border-admin-rule-strong bg-admin-surface px-2.75 py-2 text-sm text-admin-ink outline-none focus:border-admin-gold focus:outline-2 focus:-outline-offset-1 focus:outline-admin-gold";
const errorInputClasses = "!border-admin-danger focus:!border-admin-danger focus:!outline-admin-danger";

const ROUNDING_LABELS: Record<number, string> = {
  1: "Exact, to the penny",
  5: "Nearest 5p",
  10: "Nearest 10p",
  50: "Nearest 50p",
  100: "Nearest £1",
  500: "Nearest £5",
};

function Field({
  label,
  htmlFor,
  hint,
  warning,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  warning?: string;
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
      ) : (
        <>
          {hint && <p className="mt-1 text-xs text-admin-faint">{hint}</p>}
          {warning && <p className="mt-1 text-xs text-admin-warn">{warning}</p>}
        </>
      )}
    </div>
  );
}

export function SettingsForm({ initialValues }: { initialValues: SettingsFormState }) {
  const router = useRouter();
  const [values, setValues] = useState<SettingsFormState>(initialValues);
  const [errors, setErrors] = useState<SettingsFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function set<K extends keyof SettingsFormState>(key: K, value: SettingsFormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSavedAt(null);
  }

  async function handleSave() {
    const fieldErrors = validateSettingsForm(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setIsSaving(true);
    setSaveError(null);

    const result = await updateSettings(values);

    if ("fieldErrors" in result) {
      setErrors(result.fieldErrors);
      setIsSaving(false);
      return;
    }
    if ("error" in result) {
      setSaveError(result.error);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setSavedAt(Date.now());
    router.refresh();
  }

  return (
    <div className="rounded-admin-card border border-admin-rule bg-admin-surface p-4.5">
      <div className="space-y-4">
        <Field
          label="Delivery charge per item"
          htmlFor="settings-shipping"
          hint="Charged once for every item in the basket. There's no minimum order."
          error={errors.shippingPounds}
        >
          <input
            id="settings-shipping"
            type="text"
            inputMode="decimal"
            placeholder="15.00"
            value={values.shippingPounds}
            onChange={(event) => set("shippingPounds", event.target.value)}
            className={`${inputClasses} ${errors.shippingPounds ? errorInputClasses : ""}`}
          />
        </Field>

        <Field
          label="Order notification email addresses"
          htmlFor="settings-emails"
          hint="Where new-order alerts are sent. Separate more than one address with commas."
          error={errors.orderAlertEmailsText}
        >
          <input
            id="settings-emails"
            type="text"
            value={values.orderAlertEmailsText}
            onChange={(event) => set("orderAlertEmailsText", event.target.value)}
            className={`${inputClasses} ${errors.orderAlertEmailsText ? errorInputClasses : ""}`}
          />
        </Field>

        <Field
          label="Round prices to the nearest"
          htmlFor="settings-rounding"
          hint="Applied to every calculated price before it's shown or sold at."
          error={errors.priceRoundingPence}
        >
          <select
            id="settings-rounding"
            value={values.priceRoundingPence}
            onChange={(event) => set("priceRoundingPence", event.target.value)}
            className={`${inputClasses} ${errors.priceRoundingPence ? errorInputClasses : ""}`}
          >
            {PRICE_ROUNDING_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {ROUNDING_LABELS[option]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Checkout reservation time (minutes)"
          htmlFor="settings-lock-minutes"
          hint={`How long a customer's basket holds its price and reserved stock once they start checkout. Up to ${PRICE_LOCK_MINUTES_CEILING} minutes.`}
          warning="Affects checkouts already in progress: too short can expire someone mid-payment, too long ties up stock for a customer who's gone."
          error={errors.priceLockMinutes}
        >
          <input
            id="settings-lock-minutes"
            type="number"
            min={1}
            max={PRICE_LOCK_MINUTES_CEILING}
            step={1}
            value={values.priceLockMinutes}
            onChange={(event) => set("priceLockMinutes", event.target.value)}
            className={`${inputClasses} ${errors.priceLockMinutes ? errorInputClasses : ""}`}
          />
        </Field>
      </div>

      {saveError && (
        <div className="mt-4 rounded-admin-control border border-[#efcfcf] bg-admin-danger-soft px-3 py-2.5 text-sm text-[#7a2020]">
          {saveError}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-admin-control bg-admin-ink px-3.5 py-2.5 text-sm font-medium text-white hover:bg-[#33312c] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save changes"}
        </button>
        {savedAt && <span className="text-xs text-admin-ok">Saved</span>}
      </div>
    </div>
  );
}
