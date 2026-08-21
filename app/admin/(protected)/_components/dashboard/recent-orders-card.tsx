import Link from "next/link";

import { formatMoney } from "@/lib/money";
import { isNotActioned, ORDER_STATUS_LABEL, ORDER_STATUS_TONE_CLASSES, ORDER_STATUS_TONE } from "@/lib/orders";
import { daysSince, formatRelativeTime } from "@/lib/relative-time";
import type { RecentOrderRow } from "@/lib/schemas/dashboard";
import { DashboardCard } from "./dashboard-card";

export function RecentOrdersCard({ orders }: { orders: RecentOrderRow[] }) {
  return (
    <DashboardCard title="Recent orders" href="/admin/orders">
      {orders.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-semibold text-admin-ink">No orders yet</p>
          <p className="mt-1 text-sm text-admin-muted">Orders will show up here once customers start buying.</p>
        </div>
      ) : (
        <ul className="divide-y divide-admin-rule">
          {orders.map((order) => {
            const daysNotActioned = daysSince(order.status_changed_at);
            const flagged = isNotActioned(order.status, order.status_changed_at);

            return (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 hover:bg-admin-gold-soft/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-admin-ink">
                      {order.order_number} <span className="font-normal text-admin-muted">— {order.customer_name}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-admin-faint">
                      {formatRelativeTime(order.created_at)}
                      {flagged && (
                        <span className="ml-2 font-medium text-admin-danger">
                          Not actioned in {Math.floor(daysNotActioned)} days
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-admin-mono text-sm text-admin-ink tabular-nums">
                      {formatMoney(order.total_pence)}
                    </span>
                    <span
                      className={`rounded-admin-control px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_TONE_CLASSES[ORDER_STATUS_TONE[order.status]]}`}
                    >
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
