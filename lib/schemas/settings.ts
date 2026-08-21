import { z } from "zod";

import { parseMoney } from "@/lib/money";

/**
 * The nine site_settings keys, typed here because the database itself
 * carries none — `value` is a bare jsonb column with no per-key shape
 * constraint. This is the only thing standing between a typo and a broken
 * site, so every value is parsed through one of these before it's trusted.
 */
export const SETTINGS_KEYS = [
  "shipping_flat_pence",
  "order_alert_emails",
  "price_rounding_pence",
  "price_lock_minutes",
  "gold_rate_min_pence_per_gram",
  "gold_rate_max_pence_per_gram",
  "silver_rate_min_pence_per_gram",
  "silver_rate_max_pence_per_gram",
  "max_rate_move_percent",
] as const;
export type SettingsKey = (typeof SETTINGS_KEYS)[number];

/**
 * The rounding options calculate_dynamic_price_pence is actually asked to
 * apply — a closed set, not a free-typed integer, so a typo can't round
 * every price on the site to the nearest few pounds by accident.
 */
export const PRICE_ROUNDING_OPTIONS = [1, 5, 10, 50, 100, 500] as const;

/** A checkout price lock reserves real stock — too short strands a slow
 * payment mid-checkout, too long ties up stock for a customer who's long
 * gone. 120 minutes is a generous outer bound for either failure mode. */
export const PRICE_LOCK_MINUTES_CEILING = 120;

export const siteSettingsValuesSchema = z.object({
  shipping_flat_pence: z.number().int().min(0),
  order_alert_emails: z.array(z.string()),
  price_rounding_pence: z.number().int(),
  price_lock_minutes: z.number().int().min(1),
  gold_rate_min_pence_per_gram: z.number(),
  gold_rate_max_pence_per_gram: z.number(),
  silver_rate_min_pence_per_gram: z.number(),
  silver_rate_max_pence_per_gram: z.number(),
  max_rate_move_percent: z.number(),
});
export type SiteSettingsValues = z.infer<typeof siteSettingsValuesSchema>;

/** The settings form's own state — plain strings tied to controlled inputs, same split as every other admin form in this panel. */
export type SettingsFormState = {
  shippingPounds: string;
  orderAlertEmailsText: string;
  priceRoundingPence: string;
  priceLockMinutes: string;
};

const rawSettingsFormShape = z.object({
  shippingPounds: z.string(),
  orderAlertEmailsText: z.string(),
  priceRoundingPence: z.string(),
  priceLockMinutes: z.string(),
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const settingsFormSchema = rawSettingsFormShape.superRefine((values, ctx) => {
  try {
    parseMoney(values.shippingPounds.trim());
  } catch {
    ctx.addIssue({
      code: "custom",
      path: ["shippingPounds"],
      message: "Enter a plain amount like 15.00.",
    });
  }

  const emails = values.orderAlertEmailsText
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  const badEmail = emails.find((email) => !EMAIL_PATTERN.test(email));
  if (badEmail) {
    ctx.addIssue({
      code: "custom",
      path: ["orderAlertEmailsText"],
      message: `"${badEmail}" doesn't look like a valid email address.`,
    });
  }

  const rounding = Number(values.priceRoundingPence);
  if (!(PRICE_ROUNDING_OPTIONS as readonly number[]).includes(rounding)) {
    ctx.addIssue({ code: "custom", path: ["priceRoundingPence"], message: "Choose one of the options given." });
  }

  const lockMinutes = Number(values.priceLockMinutes);
  if (
    !values.priceLockMinutes.trim() ||
    !Number.isInteger(lockMinutes) ||
    lockMinutes < 1 ||
    lockMinutes > PRICE_LOCK_MINUTES_CEILING
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["priceLockMinutes"],
      message: `Enter a whole number of minutes from 1 to ${PRICE_LOCK_MINUTES_CEILING}.`,
    });
  }
});

export type SettingsFormErrors = Partial<Record<keyof SettingsFormState, string>>;

export function validateSettingsForm(values: SettingsFormState): SettingsFormErrors {
  const result = settingsFormSchema.safeParse(values);
  if (result.success) return {};

  const errors: SettingsFormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof SettingsFormState | undefined;
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export type EditableSettingsWrite = {
  shipping_flat_pence: number;
  order_alert_emails: string[];
  price_rounding_pence: number;
  price_lock_minutes: number;
};

/** Only call after validateSettingsForm() returns no errors. */
export function coerceSettingsFields(values: SettingsFormState): EditableSettingsWrite {
  return {
    shipping_flat_pence: parseMoney(values.shippingPounds.trim()),
    order_alert_emails: values.orderAlertEmailsText
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean),
    price_rounding_pence: Number(values.priceRoundingPence),
    price_lock_minutes: Number(values.priceLockMinutes),
  };
}
