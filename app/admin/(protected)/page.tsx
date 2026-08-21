import type { Metadata } from "next";
import { z } from "zod";

import { summarizeBlockedBands } from "@/lib/pricing";
import { latestGoldFetchSchema, recentOrderRowSchema } from "@/lib/schemas/dashboard";
import { productWeightRowSchema } from "@/lib/schemas/product";
import { createClient } from "@/lib/supabase/server";
import { BlockedProductsCard } from "./_components/dashboard/blocked-products-card";
import { GoldRateCard } from "./_components/dashboard/gold-rate-card";
import { PublishedDraftCard } from "./_components/dashboard/published-draft-card";
import { RecentOrdersCard } from "./_components/dashboard/recent-orders-card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    latestFetchResult,
    latestAppliedResult,
    weightRowsResult,
    liveCountResult,
    draftCountResult,
    recentOrdersResult,
  ] = await Promise.all([
    // Live rate: newest successful fetch, whether or not it's been applied
    // yet — read gold_price_log directly, never current_metal_prices, which
    // only exposes applied rows.
    supabase
      .from("gold_price_log")
      .select("gold_per_gram_24k_pence, fetched_at")
      .eq("succeeded", true)
      .not("gold_per_gram_24k_pence", "is", null)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Prices applied: when products were last recalculated, a separate
    // question from when the rate was last fetched.
    supabase
      .from("gold_price_log")
      .select("applied_at")
      .not("applied_at", "is", null)
      .order("applied_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("products")
      .select("id, pricing_mode, weight_grams")
      .neq("pricing_mode", "fixed")
      .not("weight_grams", "is", null)
      .is("removed_at", null),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true).is(
      "removed_at",
      null,
    ),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", false).is(
      "removed_at",
      null,
    ),
    supabase
      .from("orders")
      .select("id, order_number, status, customer_name, total_pence, created_at, status_changed_at")
      .neq("status", "pending_payment")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (latestFetchResult.error) {
    throw new Error(`Could not load the gold rate: ${latestFetchResult.error.message}`);
  }
  if (latestAppliedResult.error) {
    throw new Error(`Could not load the last recalculation time: ${latestAppliedResult.error.message}`);
  }
  if (weightRowsResult.error) {
    throw new Error(`Could not check pricing bands: ${weightRowsResult.error.message}`);
  }
  if (liveCountResult.error || draftCountResult.error) {
    const message = (liveCountResult.error ?? draftCountResult.error)!.message;
    throw new Error(`Could not load product counts: ${message}`);
  }
  if (recentOrdersResult.error) {
    throw new Error(`Could not load recent orders: ${recentOrdersResult.error.message}`);
  }

  const latestFetch = latestFetchResult.data ? latestGoldFetchSchema.parse(latestFetchResult.data) : null;
  const latestAppliedAt = latestAppliedResult.data?.applied_at ?? null;

  const blockedCandidates = z.array(productWeightRowSchema).parse(weightRowsResult.data ?? []);
  const blockedSummary = await summarizeBlockedBands(
    supabase,
    blockedCandidates.map((row) => ({
      id: row.id,
      pricingMode: row.pricing_mode,
      weightGrams: row.weight_grams,
    })),
  );

  const recentOrders = z.array(recentOrderRowSchema).parse(recentOrdersResult.data ?? []);

  return (
    <div>
      <h1 className="mb-4.5 text-xl font-bold tracking-tight text-admin-ink">Dashboard</h1>

      <div className="flex flex-col gap-4">
        <GoldRateCard latestFetch={latestFetch} latestAppliedAt={latestAppliedAt} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BlockedProductsCard summary={blockedSummary} />
          <PublishedDraftCard liveCount={liveCountResult.count ?? 0} draftCount={draftCountResult.count ?? 0} />
        </div>

        <RecentOrdersCard orders={recentOrders} />
      </div>
    </div>
  );
}
