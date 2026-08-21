import Link from "next/link";
import { DashboardCard } from "./dashboard-card";

export function PublishedDraftCard({ liveCount, draftCount }: { liveCount: number; draftCount: number }) {
  return (
    <DashboardCard title="Published vs draft">
      <div className="flex gap-6">
        <Link href="/admin/products?status=live" className="group">
          <p className="text-3xl font-semibold tracking-tight text-admin-ink tabular-nums group-hover:underline">
            {liveCount}
          </p>
          <p className="mt-1 text-sm text-admin-muted">Live</p>
        </Link>
        <Link href="/admin/products?status=draft" className="group">
          <p className="text-3xl font-semibold tracking-tight text-admin-ink tabular-nums group-hover:underline">
            {draftCount}
          </p>
          <p className="mt-1 text-sm text-admin-muted">Drafts</p>
        </Link>
      </div>
    </DashboardCard>
  );
}
