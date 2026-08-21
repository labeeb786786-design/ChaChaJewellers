import type { Metadata } from "next";

import { siteSettingsValuesSchema, type SettingsFormState } from "@/lib/schemas/settings";
import { createClient } from "@/lib/supabase/server";
import { RateGuards } from "./_components/rate-guards";
import { SettingsForm } from "./_components/settings-form";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error) {
    throw new Error(`Could not load settings: ${error.message}`);
  }

  const rawByKey = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
  const parsed = siteSettingsValuesSchema.safeParse(rawByKey);

  if (!parsed.success) {
    // No type safety at the database level is exactly the premise of this
    // page — if a value has been hand-edited into something this schema
    // doesn't recognise, say so plainly rather than show a form built on
    // bad data.
    return (
      <div>
        <h1 className="text-xl font-bold tracking-tight text-admin-ink">Settings</h1>
        <div className="mt-4.5 rounded-admin-card border border-[#efcfcf] bg-admin-danger-soft px-4 py-3.5 text-sm text-[#7a2020]">
          One or more settings in the database are in a shape this page doesn&apos;t recognise, so it can&apos;t
          show them safely. Contact the developer.
        </div>
      </div>
    );
  }

  const settings = parsed.data;

  const initialValues: SettingsFormState = {
    shippingPounds: (settings.shipping_flat_pence / 100).toFixed(2),
    orderAlertEmailsText: settings.order_alert_emails.join(", "),
    priceRoundingPence: String(settings.price_rounding_pence),
    priceLockMinutes: String(settings.price_lock_minutes),
  };

  return (
    <div>
      <div className="mb-4.5">
        <h1 className="text-xl font-bold tracking-tight text-admin-ink">Settings</h1>
        <p className="mt-1 text-sm text-admin-muted">
          Delivery, notifications and pricing behaviour. Changes here take effect immediately.
        </p>
      </div>

      <div className="grid gap-4.5 min-[820px]:grid-cols-2">
        <div>
          <h2 className="mb-3 text-base font-semibold text-admin-ink">Shop settings</h2>
          <SettingsForm initialValues={initialValues} />
        </div>

        <div>
          <h2 className="mb-3 text-base font-semibold text-admin-ink">Rate safety guards</h2>
          <RateGuards
            goldMinPence={settings.gold_rate_min_pence_per_gram}
            goldMaxPence={settings.gold_rate_max_pence_per_gram}
            silverMinPence={settings.silver_rate_min_pence_per_gram}
            silverMaxPence={settings.silver_rate_max_pence_per_gram}
            maxMovePercent={settings.max_rate_move_percent}
          />
        </div>
      </div>
    </div>
  );
}
