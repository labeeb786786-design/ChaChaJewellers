import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Thrown by requireAdmin() — callers decide how to react (redirect, form error, ...). */
export class AdminAuthError extends Error {}

/**
 * Verifies the current request has a signed-in session AND that the user is
 * in admin_users, via the DB's own is_admin() function — never reimplemented
 * client-side. Returns the user or throws.
 *
 * Call this as the first line of every Server Action. Never trust the
 * middleware redirect or a layout-level check to have already done it —
 * either can be routed around (a direct action call, a CSV import route,
 * etc.) in a way a page-level check can't catch.
 */
export async function requireAdmin(): Promise<User> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AdminAuthError("You need to be signed in.");
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");

  if (adminError) {
    throw new AdminAuthError(`Could not verify admin access: ${adminError.message}`);
  }

  if (!isAdmin) {
    throw new AdminAuthError("Your account doesn't have admin access.");
  }

  return user;
}
