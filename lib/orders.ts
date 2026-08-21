import { daysSince } from "@/lib/relative-time";
import type { OrderStatus } from "@/lib/schemas/order";

/** ~72 hours. Shared by the dashboard's recent-orders card and the orders list/detail pages — one rule, one place. */
export const NOT_ACTIONED_THRESHOLD_DAYS = 3;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Pending payment",
  paid: "Paid",
  processing: "Processing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Failed",
};

export type OrderStatusTone = "green" | "amber" | "red" | "grey";

export const ORDER_STATUS_TONE: Record<OrderStatus, OrderStatusTone> = {
  pending_payment: "grey",
  paid: "amber",
  processing: "amber",
  ready: "amber",
  completed: "green",
  cancelled: "grey",
  refunded: "grey",
  failed: "red",
};

export const ORDER_STATUS_TONE_CLASSES: Record<OrderStatusTone, string> = {
  green: "bg-admin-ok-soft text-admin-ok",
  amber: "bg-admin-warn-soft text-admin-warn",
  red: "bg-admin-danger-soft text-[#7a2020]",
  grey: "bg-[#f1efe9] text-admin-muted",
};

/**
 * Every amber status can go stale — ready, processing or paid sitting
 * untouched past 72 hours by status_changed_at is flagged red with
 * "Not actioned in X days". Flag only, never an automatic cancellation: a
 * paid order cancelled by a timer would mean an automatic refund triggered
 * just because the shop got busy.
 */
const NOT_ACTIONED_STATUSES = new Set<OrderStatus>(["ready", "processing", "paid"]);

export function isNotActioned(status: OrderStatus, statusChangedAt: string): boolean {
  return NOT_ACTIONED_STATUSES.has(status) && daysSince(statusChangedAt) > NOT_ACTIONED_THRESHOLD_DAYS;
}
