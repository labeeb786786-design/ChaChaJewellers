import { z } from "zod";

/**
 * gold_per_gram_24k_pence is numeric — arrives as a string, coerced here
 * before any arithmetic (brief trap #1). fetched_at is a timestamptz, which
 * supabase-js already returns as a proper ISO string, no coercion needed.
 */
export const latestGoldFetchSchema = z.object({
  gold_per_gram_24k_pence: z.coerce.number(),
  fetched_at: z.string(),
});
export type LatestGoldFetch = z.infer<typeof latestGoldFetchSchema>;

/** Card 4's row shape — total_pence is a plain integer column, no coercion needed. */
export const recentOrderRowSchema = z.object({
  id: z.string(),
  order_number: z.string(),
  status: z.enum([
    "pending_payment",
    "paid",
    "processing",
    "ready",
    "completed",
    "cancelled",
    "refunded",
    "failed",
  ]),
  customer_name: z.string(),
  total_pence: z.number(),
  created_at: z.string(),
  status_changed_at: z.string(),
});
export type RecentOrderRow = z.infer<typeof recentOrderRowSchema>;
