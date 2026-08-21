import { formatMoney } from "@/lib/money";
import { formatRelativeTime, hoursSince } from "@/lib/relative-time";
import type { LatestGoldFetch } from "@/lib/schemas/dashboard";
import { DashboardCard } from "./dashboard-card";

const FETCH_ALARM_THRESHOLD_HOURS = 6;
// Max scheduled gap is ~20h (twice daily) plus an hour of slack, so ordinary
// lateness between runs doesn't fire this — only a genuinely broken apply job.
const APPLY_ALARM_THRESHOLD_HOURS = 21;

/**
 * Two different timestamps, on purpose, each with its own alarm because
 * they point at different faults: latestFetch is the newest successful row
 * in gold_price_log regardless of whether it's been applied yet
 * (current_metal_prices can't show that — it only exposes applied rows,
 * which is exactly why this reads the table directly) — stale means the
 * rate source is unreachable. latestAppliedAt is when products were last
 * recalculated, which can lag behind a fetch that hasn't been applied —
 * stale means apply_metal_prices() is broken even while fetching is fine.
 */
export function GoldRateCard({
  latestFetch,
  latestAppliedAt,
}: {
  latestFetch: LatestGoldFetch | null;
  latestAppliedAt: string | null;
}) {
  const hoursSinceFetch = latestFetch ? hoursSince(latestFetch.fetched_at) : null;
  const isFetchStale = hoursSinceFetch === null || hoursSinceFetch >= FETCH_ALARM_THRESHOLD_HOURS;

  const hoursSinceApplied = latestAppliedAt ? hoursSince(latestAppliedAt) : null;
  const isApplyStale = hoursSinceApplied === null || hoursSinceApplied >= APPLY_ALARM_THRESHOLD_HOURS;

  return (
    <DashboardCard title="Gold rate" tone={isFetchStale || isApplyStale ? "danger" : "neutral"}>
      {latestFetch ? (
        <>
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-admin-mono text-3xl font-semibold tracking-tight text-admin-ink tabular-nums">
              {formatMoney(Math.round(latestFetch.gold_per_gram_24k_pence))}
            </span>
            <span className="text-sm text-admin-muted">per gram, 24k</span>
          </div>
          <p className="mt-1 text-sm text-admin-muted">Fetched {formatRelativeTime(latestFetch.fetched_at)}</p>
        </>
      ) : (
        <p className="text-2xl font-semibold text-admin-ink">Awaiting gold rate</p>
      )}

      <p
        className={
          isApplyStale
            ? "mt-2.5 text-sm font-semibold text-[#7a2020]"
            : "mt-2.5 text-xs text-admin-faint"
        }
      >
        {latestAppliedAt
          ? `Prices last recalculated ${formatRelativeTime(latestAppliedAt)}`
          : "Prices have never been recalculated"}
      </p>

      {/*
        One shared alarm container rather than two stacked boxes — both
        faults can be live at once (rate fetching fine, apply job dead, or
        vice versa) and this keeps that state readable instead of a wall of
        red.
      */}
      {(isFetchStale || isApplyStale) && (
        <div className="mt-3.5 divide-y divide-[#efcfcf] overflow-hidden rounded-admin-control bg-admin-danger-soft text-sm text-[#7a2020]">
          {isFetchStale && (
            <p className="px-3 py-2.5">
              {latestFetch
                ? `Rate has not been updated for ${Math.floor(hoursSinceFetch!)} hours, developer has been contacted. For more information contact the developer.`
                : "No gold rate has ever been recorded. Developer has been contacted. For more information contact the developer."}
            </p>
          )}
          {isApplyStale && (
            <p className="px-3 py-2.5">
              {latestAppliedAt
                ? `Prices have not been recalculated for ${Math.floor(hoursSinceApplied!)} hours, developer has been contacted. For more information contact the developer.`
                : "Prices have never been recalculated. Developer has been contacted. For more information contact the developer."}
            </p>
          )}
        </div>
      )}

      {/*
        TODO(rate job): nothing above actually contacts anyone yet — no
        rate-fetching cron job and no apply_metal_prices() monitoring exist
        yet (see lib/gold.ts's mock data for the storefront side of the same
        gap). Once that job exists, this is where it should trigger real
        alerts for BOTH a stale fetch and a stale apply — they're different
        failures (source unreachable vs. apply job broken) and can fire
        independently, so the job needs to check and alert on each
        separately, rather than the UI merely claiming one was sent.
      */}
    </DashboardCard>
  );
}
