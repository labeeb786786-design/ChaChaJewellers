"use server";

import { revalidatePath } from "next/cache";

import { AdminAuthError, requireAdmin } from "@/lib/auth";
import { clientSettableOrderStatusSchema, type ClientSettableOrderStatus } from "@/lib/schemas/order";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T> = T | { error: string };

/**
 * The only status write this admin panel makes. Restricted to
 * ClientSettableOrderStatus at the type level — paid, failed and refunded
 * are Stripe's to set, and pending_payment is the pre-webhook starting
 * state, so none of those four can even be passed in, let alone written.
 * status_changed_at updates itself via the orders_status_changed_at
 * trigger, never set here.
 */
export async function updateOrderStatus(
  orderId: string,
  status: ClientSettableOrderStatus,
): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const parsedStatus = clientSettableOrderStatusSchema.safeParse(status);
  if (!parsedStatus.success) {
    return { error: "That status can't be set by hand." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status: parsedStatus.data }).eq("id", orderId);

  if (error) {
    return { error: `Could not update this order's status: ${error.message}` };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
