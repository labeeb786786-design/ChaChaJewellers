"use client";

import { useRouter } from "next/navigation";

import { ORDER_STATUS_LABEL } from "@/lib/orders";
import type { OrderStatus } from "@/lib/schemas/order";

const RANGE_OPTIONS = [
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
] as const;

// Every status except pending_payment, which never appears in this admin
// panel — it means no webhook has confirmed the order yet.
const STATUS_OPTIONS: Array<{ value: OrderStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "paid", label: ORDER_STATUS_LABEL.paid },
  { value: "processing", label: ORDER_STATUS_LABEL.processing },
  { value: "ready", label: ORDER_STATUS_LABEL.ready },
  { value: "completed", label: ORDER_STATUS_LABEL.completed },
  { value: "cancelled", label: ORDER_STATUS_LABEL.cancelled },
  { value: "refunded", label: ORDER_STATUS_LABEL.refunded },
  { value: "failed", label: ORDER_STATUS_LABEL.failed },
];

const selectClasses =
  "rounded-admin-control border border-admin-rule-strong bg-admin-surface px-2.5 py-2 text-sm text-admin-ink outline-none focus:border-admin-gold focus:outline-2 focus:-outline-offset-1 focus:outline-admin-gold";

export function OrderFilters({ range, status }: { range: string; status: string }) {
  const router = useRouter();

  function navigate(next: Partial<{ range: string; status: string }>) {
    const merged = { range, status, ...next };
    const params = new URLSearchParams();
    if (merged.range && merged.range !== "14") params.set("range", merged.range);
    if (merged.status) params.set("status", merged.status);

    const qs = params.toString();
    router.push(`/admin/orders${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="mb-3.5 flex flex-wrap gap-2">
      <select
        aria-label="Filter by date range"
        value={range}
        onChange={(event) => navigate({ range: event.target.value })}
        className={selectClasses}
      >
        {RANGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Filter by status"
        value={status}
        onChange={(event) => navigate({ status: event.target.value })}
        className={selectClasses}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
