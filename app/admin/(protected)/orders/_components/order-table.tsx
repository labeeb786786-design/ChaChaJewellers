import Link from "next/link";

import { formatMoney } from "@/lib/money";
import { isNotActioned, ORDER_STATUS_LABEL, ORDER_STATUS_TONE, ORDER_STATUS_TONE_CLASSES } from "@/lib/orders";
import { daysSince, formatRelativeTime } from "@/lib/relative-time";
import type { OrderListRow } from "@/lib/schemas/order";

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  const classes = "rounded-admin-control border border-admin-rule-strong px-2.5 py-1.25 text-xs font-medium";

  if (disabled) {
    return <span className={`${classes} text-admin-faint opacity-50`}>{children}</span>;
  }

  return (
    <Link href={href} className={`${classes} bg-admin-surface text-admin-ink hover:bg-[#f5f3ee]`}>
      {children}
    </Link>
  );
}

export function OrderTable({
  orders,
  page,
  totalPages,
  buildHref,
}: {
  orders: OrderListRow[];
  page: number;
  totalPages: number;
  buildHref: (targetPage: number) => string;
}) {
  return (
    <div className="overflow-hidden rounded-admin-card border border-admin-rule bg-admin-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-165 border-collapse">
          <thead>
            <tr className="border-b border-admin-rule">
              <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                Order
              </th>
              <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                Customer
              </th>
              <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                Total
              </th>
              <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                Status
              </th>
              <th className="px-3.5 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const flagged = isNotActioned(order.status, order.status_changed_at);
              const daysNotActioned = daysSince(order.status_changed_at);

              return (
                <tr key={order.id} className="border-b border-admin-rule last:border-b-0 hover:bg-[#fcfbf8]">
                  <td className="px-3.5 py-3">
                    <strong className="block font-admin-mono text-sm text-admin-ink">{order.order_number}</strong>
                    <small className="text-[11px] text-admin-faint">{formatRelativeTime(order.created_at)}</small>
                  </td>
                  <td className="px-3.5 py-3 text-sm text-admin-ink">{order.customer_name}</td>
                  <td className="px-3.5 py-3 font-admin-mono text-sm tabular-nums text-admin-ink">
                    {formatMoney(order.total_pence)}
                  </td>
                  <td className="px-3.5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.75 text-xs font-semibold ${ORDER_STATUS_TONE_CLASSES[ORDER_STATUS_TONE[order.status]]}`}
                    >
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                    {flagged && (
                      <div className="mt-1 text-xs font-medium text-admin-danger">
                        Not actioned in {Math.floor(daysNotActioned)} days
                      </div>
                    )}
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="flex justify-end">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="rounded-admin-control border border-admin-rule-strong bg-admin-surface px-2.5 py-1.25 text-xs font-medium text-admin-ink hover:bg-[#f5f3ee]"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-admin-rule px-3.5 py-2.75 text-sm text-admin-muted">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1.5">
            <PageLink href={buildHref(page - 1)} disabled={page <= 1}>
              Previous
            </PageLink>
            <PageLink href={buildHref(page + 1)} disabled={page >= totalPages}>
              Next
            </PageLink>
          </div>
        </div>
      )}
    </div>
  );
}
