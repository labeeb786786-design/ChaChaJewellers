import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Turns a raw Postgres unique_violation (23505) into a friendly, field-level
 * message — brief trap #4: "Never let a raw Postgres error string reach the
 * client." Matches against `error.details` (Postgres puts the offending
 * column there, e.g. `Key (sku)=(CJ-ITEM) already exists.`) against the
 * column names given. Returns null for any other error code, or if none of
 * the given columns match, so the caller can fall back to its own generic
 * wording rather than get a silently wrong message.
 */
export function friendlyUniqueViolationMessage(
  error: PostgrestError,
  fieldMessages: Record<string, string>,
): string | null {
  if (error.code !== "23505") return null;

  const detail = `${error.message} ${error.details}`.toLowerCase();
  for (const [column, message] of Object.entries(fieldMessages)) {
    if (detail.includes(`(${column})`)) return message;
  }

  return null;
}
