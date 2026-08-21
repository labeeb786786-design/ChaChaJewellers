import type { BlockedBandsSummary } from "@/lib/pricing";
import { DashboardCard } from "./dashboard-card";

export function BlockedProductsCard({ summary }: { summary: BlockedBandsSummary }) {
  const isBlocked = summary.count > 0;

  return (
    <DashboardCard title="Blocked products" href="/admin/products?status=blocked" tone={isBlocked ? "danger" : "neutral"}>
      <p className="text-3xl font-semibold tracking-tight text-admin-ink tabular-nums">{summary.count}</p>
      {isBlocked ? (
        <p className="mt-1.5 text-sm text-[#7a2020]">
          {summary.bandLabels.join(" and ")} {summary.bandLabels.length === 1 ? "is" : "are"} still at 0% markup
        </p>
      ) : (
        <p className="mt-1.5 text-sm text-admin-ok">All good</p>
      )}
    </DashboardCard>
  );
}
