import { z } from "zod";

/**
 * The pricing band form's own state — plain strings tied to controlled
 * inputs, mirroring product-form.ts and category-form.ts's split between
 * on-screen state and the DB-row shape. applies_to is fixed per section
 * (jewellery vs bullion) and set once at creation — never editable
 * afterward, since changing it would silently move a band into a
 * completely different weight ladder.
 */
export type BandFormState = {
  label: string;
  minWeightG: string;
  maxWeightG: string;
  markupPercent: string;
  vatPercent: string;
  isActive: boolean;
};

export function defaultBandFormState(defaultMin: number): BandFormState {
  return {
    label: "",
    minWeightG: String(defaultMin),
    maxWeightG: "",
    markupPercent: "0",
    vatPercent: "20",
    isActive: true,
  };
}

const rawBandFormShape = z.object({
  label: z.string(),
  minWeightG: z.string(),
  maxWeightG: z.string(),
  markupPercent: z.string(),
  vatPercent: z.string(),
  isActive: z.boolean(),
});

/** Every range/percent bound here mirrors a CHECK constraint on pricing_bands, so a bad value is caught before it ever reaches Postgres. */
export const bandFormSchema = rawBandFormShape.superRefine((values, ctx) => {
  if (!values.label.trim()) {
    ctx.addIssue({ code: "custom", path: ["label"], message: "Enter a label, e.g. 20-40g." });
  }

  const min = Number(values.minWeightG);
  if (!values.minWeightG.trim() || !Number.isFinite(min) || min < 0) {
    ctx.addIssue({ code: "custom", path: ["minWeightG"], message: "Enter 0 or more." });
  }

  const max = Number(values.maxWeightG);
  if (!values.maxWeightG.trim() || !Number.isFinite(max)) {
    ctx.addIssue({ code: "custom", path: ["maxWeightG"], message: "Enter the top of the range." });
  } else if (Number.isFinite(min) && max <= min) {
    ctx.addIssue({ code: "custom", path: ["maxWeightG"], message: "Must be more than the minimum." });
  }

  const markup = Number(values.markupPercent);
  if (!values.markupPercent.trim() || !Number.isFinite(markup) || markup < 0 || markup > 500) {
    ctx.addIssue({ code: "custom", path: ["markupPercent"], message: "Enter 0 to 500." });
  }

  const vat = Number(values.vatPercent);
  if (!values.vatPercent.trim() || !Number.isFinite(vat) || vat < 0 || vat > 100) {
    ctx.addIssue({ code: "custom", path: ["vatPercent"], message: "Enter 0 to 100." });
  }
});

export type BandFormErrors = Partial<Record<keyof BandFormState, string>>;

export function validateBandForm(values: BandFormState): BandFormErrors {
  const result = bandFormSchema.safeParse(values);
  if (result.success) return {};

  const errors: BandFormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof BandFormState | undefined;
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export type BandWriteFields = {
  label: string;
  min_weight_g: string;
  max_weight_g: string;
  markup_percent: string;
  vat_percent: string;
  is_active: boolean;
};

/** Numeric fields go out as strings — pricing_bands' numeric columns, same reason they come back as strings (brief trap #1). Only call after validateBandForm() returns no errors. */
export function coerceBandFields(values: BandFormState): BandWriteFields {
  return {
    label: values.label.trim(),
    min_weight_g: String(z.coerce.number().parse(values.minWeightG)),
    max_weight_g: String(z.coerce.number().parse(values.maxWeightG)),
    markup_percent: String(z.coerce.number().parse(values.markupPercent)),
    vat_percent: String(z.coerce.number().parse(values.vatPercent)),
    is_active: values.isActive,
  };
}
