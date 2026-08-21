"use server";

import { revalidatePath } from "next/cache";

import { AdminAuthError, requireAdmin } from "@/lib/auth";
import {
  coerceSettingsFields,
  validateSettingsForm,
  type SettingsFormErrors,
  type SettingsFormState,
} from "@/lib/schemas/settings";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T> = T | { error: string } | { fieldErrors: SettingsFormErrors };

/**
 * Writes only the four client-editable keys — the five rate guard values
 * are developer-managed and never reach this action at all, let alone get
 * overwritten by it.
 */
export async function updateSettings(values: SettingsFormState): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const fieldErrors = validateSettingsForm(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const fields = coerceSettingsFields(values);
  const supabase = await createClient();

  const results = await Promise.all([
    supabase.from("site_settings").update({ value: fields.shipping_flat_pence }).eq("key", "shipping_flat_pence"),
    supabase.from("site_settings").update({ value: fields.order_alert_emails }).eq("key", "order_alert_emails"),
    supabase
      .from("site_settings")
      .update({ value: fields.price_rounding_pence })
      .eq("key", "price_rounding_pence"),
    // Feeds create_price_lock's duration default directly — a live
    // checkout mid-basket picks this up the next time it locks a price.
    supabase.from("site_settings").update({ value: fields.price_lock_minutes }).eq("key", "price_lock_minutes"),
  ]);

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return { error: `Could not save settings: ${failed.error.message}` };
  }

  revalidatePath("/admin/settings");
  return { ok: true };
}
