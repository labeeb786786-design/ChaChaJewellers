import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";

import { daysAgoIso } from "@/lib/relative-time";
import { orderListRowSchema, orderStatusSchema } from "@/lib/schemas/order";
import { createClient } from "@/lib/supabase/server";
import { OrderFilters } from "./_components/order-filters";
import { OrderTable } from "./_components/order-table";

export const metadata: Metadata = {
  title: "Orders",
};

const PAGE_SIZE = 25;
const RANGE_DAYS: Record<string, number> = { "14": 14, "30": 30, "90": 90 };

type OrdersSearchParams = {
  range?: string;
  status?: string;
  page?: string;
};

function buildHref(filters: { range: string; status: string }, targetPage: number) {
  const params = new URLSearchParams();
  if (filters.range !== "14") params.set("range", filters.range);
  if (filters.status) params.set("status", filters.status);
  if (targetPage > 1) params.set("page", String(targetPage));

  const qs = params.toString();
  return `/admin/orders${qs ? `?${qs}` : ""}`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<OrdersSearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const range = params.range && (params.range === "all" || params.range in RANGE_DAYS) ? params.range : "14";
  const parsedStatus = orderStatusSchema.safeParse(params.status);
  // pending_payment is never a valid filter — it's excluded from this page entirely.
  const status = parsedStatus.success && parsedStatus.data !== "pending_payment" ? parsedStatus.data : "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const filters = { range, status };

  // pending_payment is excluded everywhere in this admin panel — a webhook
  // never confirmed it, so the customer never saw it as a real order either.
  let ordersQuery = supabase
    .from("orders")
    .select("id, order_number, status, customer_name, total_pence, created_at, status_changed_at", {
      count: "exact",
    })
    .neq("status", "pending_payment")
    .order("created_at", { ascending: false });

  if (range !== "all") {
    ordersQuery = ordersQuery.gte("created_at", daysAgoIso(RANGE_DAYS[range]));
  }
  if (status) {
    ordersQuery = ordersQuery.eq("status", status);
  }

  const from = (page - 1) * PAGE_SIZE;
  const [{ data: orderRows, count: filteredCount, error }, totalCountResult] = await Promise.all([
    ordersQuery.range(from, from + PAGE_SIZE - 1),
    supabase.from("orders").select("id", { count: "exact", head: true }).neq("status", "pending_payment"),
  ]);

  if (error) {
    throw new Error(`Could not load orders: ${error.message}`);
  }
  if (totalCountResult.error) {
    throw new Error(`Could not load orders: ${totalCountResult.error.message}`);
  }

  const orders = z.array(orderListRowSchema).parse(orderRows ?? []);
  const totalCount = totalCountResult.count ?? 0;
  const filteredTotal = filteredCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const hasFilters = range !== "14" || Boolean(status);

  return (
    <div>
      <div className="mb-4.5">
        <h1 className="text-xl font-bold tracking-tight text-admin-ink">Orders</h1>
        <p className="mt-1 text-sm text-admin-muted">See what&apos;s been ordered and its status.</p>
      </div>

      <OrderFilters range={range} status={status} />

      {orders.length === 0 ? (
        <div className="rounded-admin-card border border-admin-rule bg-admin-surface px-6 py-14 text-center">
          {totalCount === 0 ? (
            <>
              <p className="text-sm font-semibold text-admin-ink">No orders yet</p>
              <p className="mt-1 text-sm text-admin-muted">Orders will show up here once customers start buying.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-admin-ink">No orders match your filters</p>
              <p className="mt-1 text-sm text-admin-muted">
                Try a different status
                {hasFilters ? (
                  <>
                    {" "}
                    or{" "}
                    <Link href="/admin/orders" className="text-admin-gold underline underline-offset-2">
                      widen the date range
                    </Link>
                  </>
                ) : null}
                .
              </p>
            </>
          )}
        </div>
      ) : (
        <OrderTable
          orders={orders}
          page={page}
          totalPages={totalPages}
          buildHref={(targetPage) => buildHref(filters, targetPage)}
        />
      )}
    </div>
  );
}
