import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { formatMoney } from "@/lib/money";
import { isNotActioned, ORDER_STATUS_LABEL, ORDER_STATUS_TONE, ORDER_STATUS_TONE_CLASSES } from "@/lib/orders";
import { daysSince, formatRelativeTime } from "@/lib/relative-time";
import { orderDetailSchema, orderItemRowSchema } from "@/lib/schemas/order";
import { createClient } from "@/lib/supabase/server";
import { OrderStatusControl } from "../_components/order-status-control";

export const metadata: Metadata = {
  title: "Order",
};

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.75 font-admin-mono text-[10px] font-semibold tracking-[0.12em] text-admin-faint uppercase">
      {children}
    </div>
  );
}

function ReceiptLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2.5 py-1.25 text-sm">
      <span className="text-admin-muted">{label}</span>
      <span className="font-admin-mono font-medium text-admin-ink tabular-nums">{value}</span>
    </div>
  );
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [orderResult, itemsResult] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, order_number, status, customer_name, customer_email, customer_phone, is_collection, delivery_line1, delivery_line2, delivery_city, delivery_postcode, delivery_country, subtotal_pence, shipping_pence, total_pence, payment_method_label, stripe_payment_intent_id, stripe_checkout_session_id, paid_at, created_at, status_changed_at",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select("id, product_id, product_name, sku, weight_grams, purity, quantity, price_at_purchase, line_total_pence")
      .eq("order_id", id)
      .order("created_at"),
  ]);

  if (orderResult.error) {
    throw new Error(`Could not load this order: ${orderResult.error.message}`);
  }
  if (!orderResult.data) {
    notFound();
  }
  if (itemsResult.error) {
    throw new Error(`Could not load this order's items: ${itemsResult.error.message}`);
  }

  const order = orderDetailSchema.parse(orderResult.data);
  const items = z.array(orderItemRowSchema).parse(itemsResult.data ?? []);

  const flagged = isNotActioned(order.status, order.status_changed_at);
  const daysNotActioned = daysSince(order.status_changed_at);
  const paymentReference = order.stripe_payment_intent_id ?? order.stripe_checkout_session_id;

  return (
    <div>
      <div className="mb-4.5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-admin-mono text-xl font-bold tracking-tight text-admin-ink">{order.order_number}</h1>
          <p className="mt-1 text-sm text-admin-muted">Placed {formatRelativeTime(order.created_at)}</p>
        </div>
        <Link
          href="/admin/orders"
          className="rounded-admin-control border border-admin-rule-strong bg-admin-surface px-3.5 py-2 text-sm font-medium text-admin-ink hover:bg-[#f5f3ee]"
        >
          Back to orders
        </Link>
      </div>

      <div className="grid items-start gap-4.5 min-[820px]:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="rounded-admin-card border border-admin-rule bg-admin-surface">
          <div className="border-b border-admin-rule p-4.5">
            <Legend>Items</Legend>
            {items.length === 0 ? (
              <p className="text-sm text-admin-muted">No items recorded on this order.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-120 border-collapse">
                  <thead>
                    <tr className="border-b border-admin-rule">
                      <th className="py-2 text-left text-xs font-medium text-admin-faint">Item</th>
                      <th className="py-2 text-left text-xs font-medium text-admin-faint">Qty</th>
                      <th className="py-2 text-right text-xs font-medium text-admin-faint">Unit price</th>
                      <th className="py-2 text-right text-xs font-medium text-admin-faint">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-admin-rule last:border-b-0">
                        <td className="py-2.5">
                          <span className="block text-sm font-semibold text-admin-ink">{item.product_name}</span>
                          <span className="font-admin-mono text-[11px] text-admin-faint">
                            {item.sku}
                            {item.weight_grams !== null ? ` · ${item.weight_grams.toFixed(2)}g` : ""}
                            {item.purity ? ` · ${item.purity}` : ""}
                          </span>
                        </td>
                        <td className="py-2.5 font-admin-mono text-sm tabular-nums text-admin-ink">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 text-right font-admin-mono text-sm tabular-nums text-admin-ink">
                          {formatMoney(item.price_at_purchase)}
                        </td>
                        <td className="py-2.5 text-right font-admin-mono text-sm tabular-nums text-admin-ink">
                          {formatMoney(item.line_total_pence)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-4.5">
            <Legend>Totals</Legend>
            <ReceiptLine label="Subtotal" value={formatMoney(order.subtotal_pence)} />
            <ReceiptLine label="Delivery" value={formatMoney(order.shipping_pence)} />
            <div className="mt-1.25 flex items-baseline justify-between border-t-[1.5px] border-admin-ink pt-2.5">
              <span className="font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                Total
              </span>
              <strong className="font-admin-mono text-xl font-semibold tracking-tight text-admin-ink tabular-nums">
                {formatMoney(order.total_pence)}
              </strong>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-admin-card border border-admin-rule bg-admin-surface p-4.5">
            <Legend>Status</Legend>
            <span
              className={`inline-flex rounded-full px-2 py-0.75 text-xs font-semibold ${ORDER_STATUS_TONE_CLASSES[ORDER_STATUS_TONE[order.status]]}`}
            >
              {ORDER_STATUS_LABEL[order.status]}
            </span>
            {flagged && (
              <p className="mt-1.5 text-xs font-medium text-admin-danger">
                Not actioned in {Math.floor(daysNotActioned)} days
              </p>
            )}
            <div className="mt-3.5 border-t border-admin-rule pt-3.5">
              <OrderStatusControl orderId={order.id} status={order.status} />
            </div>
          </div>

          <div className="rounded-admin-card border border-admin-rule bg-admin-surface p-4.5">
            <Legend>Customer</Legend>
            <p className="text-sm font-semibold text-admin-ink">{order.customer_name}</p>
            <p className="mt-0.5 text-sm text-admin-muted">{order.customer_email}</p>
            {order.customer_phone && <p className="mt-0.5 text-sm text-admin-muted">{order.customer_phone}</p>}
          </div>

          <div className="rounded-admin-card border border-admin-rule bg-admin-surface p-4.5">
            <Legend>{order.is_collection ? "Collection" : "Delivery"}</Legend>
            {order.is_collection ? (
              <p className="text-sm text-admin-ink">Collecting in store.</p>
            ) : (
              <p className="text-sm text-admin-ink">
                {order.delivery_line1}
                {order.delivery_line2 ? <><br />{order.delivery_line2}</> : null}
                <br />
                {order.delivery_city} {order.delivery_postcode}
                <br />
                {order.delivery_country}
              </p>
            )}
          </div>

          <div className="rounded-admin-card border border-admin-rule bg-admin-surface p-4.5">
            <Legend>Payment</Legend>
            <p className="text-sm text-admin-ink">{order.payment_method_label ?? "Not recorded"}</p>
            <p className="mt-0.5 font-admin-mono text-xs text-admin-faint">{paymentReference ?? "No reference yet"}</p>
            <p className="mt-1.5 text-sm text-admin-muted">
              {order.paid_at ? `Paid ${formatRelativeTime(order.paid_at)}` : "Not yet paid"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
