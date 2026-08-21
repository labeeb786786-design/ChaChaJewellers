"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  defaultFaqFormState,
  validateFaqForm,
  type FaqFormErrors,
  type FaqFormState,
  type FaqRow,
} from "@/lib/schemas/faq";
import { Modal } from "../../products/_components/modal";
import { createFaq, updateFaq } from "../actions";

const inputClasses =
  "w-full rounded-admin-control border border-admin-rule-strong bg-admin-surface px-2.75 py-2 text-sm text-admin-ink outline-none focus:border-admin-gold focus:outline-2 focus:-outline-offset-1 focus:outline-admin-gold";
const errorInputClasses = "!border-admin-danger focus:!border-admin-danger focus:!outline-admin-danger";

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

export function FaqFormDialog({ faq }: { faq?: FaqRow }) {
  const router = useRouter();
  const isEditing = faq !== undefined;

  const initialValues: FaqFormState = faq
    ? {
        question: faq.question,
        answer: faq.answer,
        keywordsText: faq.keywords.join(", "),
        isActive: faq.is_active,
      }
    : defaultFaqFormState;

  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<FaqFormState>(initialValues);
  const [errors, setErrors] = useState<FaqFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function openDialog() {
    setValues(initialValues);
    setErrors({});
    setSaveError(null);
    setIsOpen(true);
  }

  function set<K extends keyof FaqFormState>(key: K, value: FaqFormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSave() {
    const fieldErrors = validateFaqForm(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setIsSaving(true);
    setSaveError(null);

    const result = isEditing ? await updateFaq(faq.id, values) : await createFaq(values);

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
    setIsOpen(false);
    router.refresh();
  }

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
          Add FAQ
        </button>
      )}

      {isOpen && (
        <Modal
          labelledBy="faq-dialog-title"
          onClose={() => {
            if (!isSaving) setIsOpen(false);
          }}
        >
          <h3 id="faq-dialog-title" className="mb-3 text-base font-bold text-admin-ink">
            {isEditing ? "Edit FAQ" : "Add an FAQ"}
          </h3>

          <div className="space-y-3">
            <Field label="Question" htmlFor="faq-question" error={errors.question}>
              <input
                id="faq-question"
                type="text"
                value={values.question}
                onChange={(event) => set("question", event.target.value)}
                className={`${inputClasses} ${errors.question ? errorInputClasses : ""}`}
              />
            </Field>

            <Field label="Answer" htmlFor="faq-answer" error={errors.answer}>
              <textarea
                id="faq-answer"
                rows={4}
                value={values.answer}
                onChange={(event) => set("answer", event.target.value)}
                className={`${inputClasses} ${errors.answer ? errorInputClasses : ""}`}
              />
            </Field>

            <Field
              label="Words a customer might use"
              htmlFor="faq-keywords"
              hint="Comma-separated. This is how the AI assistant matches a customer's question to this answer, e.g. hours, opening, when are you open"
            >
              <input
                id="faq-keywords"
                type="text"
                value={values.keywordsText}
                onChange={(event) => set("keywordsText", event.target.value)}
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
              Active
            </label>
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
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-admin-control bg-admin-ink px-3.5 py-2 text-sm font-medium text-white hover:bg-[#33312c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
