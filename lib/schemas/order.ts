import { z } from "zod";

export const orderStatusSchema = z.enum([
  "pending_payment",
  "paid",
  "processing",
  "ready",
  "completed",
  "cancelled",
  "refunded",
  "failed",
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

/**
 * The only statuses a Server Action may write. paid, failed and refunded
 * come from Stripe and pending_payment is the initial state before any
 * webhook fires — none of the four are reachable through this form, by
 * construction of this narrower enum rather than by a runtime check that
 * could be forgotten at a call site.
 */
export const clientSettableOrderStatusSchema = z.enum(["processing", "ready", "completed", "cancelled"]);
export type ClientSettableOrderStatus = z.infer<typeof clientSettableOrderStatusSchema>;

/** The orders list row — one line per order, no items. */
export const orderListRowSchema = z.object({
  id: z.string(),
  order_number: z.string(),
  status: orderStatusSchema,
  customer_name: z.string(),
  total_pence: z.number(),
  created_at: z.string(),
  status_changed_at: z.string(),
});
export type OrderListRow = z.infer<typeof orderListRowSchema>;

/** Everything the detail page shows other than its line items, which are fetched and parsed separately. */
export const orderDetailSchema = z.object({
  id: z.string(),
  order_number: z.string(),
  status: orderStatusSchema,
  customer_name: z.string(),
  customer_email: z.string(),
  customer_phone: z.string().nullable(),
  is_collection: z.boolean(),
  delivery_line1: z.string().nullable(),
  delivery_line2: z.string().nullable(),
  delivery_city: z.string().nullable(),
  delivery_postcode: z.string().nullable(),
  delivery_country: z.string(),
  subtotal_pence: z.number(),
  shipping_pence: z.number(),
  total_pence: z.number(),
  payment_method_label: z.string().nullable(),
  stripe_payment_intent_id: z.string().nullable(),
  stripe_checkout_session_id: z.string().nullable(),
  paid_at: z.string().nullable(),
  created_at: z.string(),
  status_changed_at: z.string(),
});
export type OrderDetail = z.infer<typeof orderDetailSchema>;

/**
 * A snapshotted line item — weight_grams is numeric (string on the wire,
 * brief trap #1) but purely for display here, never recalculated, since
 * editing a placed order's items would destroy the audit trail a payment
 * dispute needs.
 */
export const orderItemRowSchema = z.object({
  id: z.string(),
  product_id: z.string().nullable(),
  product_name: z.string(),
  sku: z.string(),
  weight_grams: z.coerce.number().nullable(),
  purity: z.string().nullable(),
  quantity: z.number(),
  price_at_purchase: z.number(),
  line_total_pence: z.number(),
});
export type OrderItemRow = z.infer<typeof orderItemRowSchema>;
