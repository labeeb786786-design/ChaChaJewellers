import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";

export type SluggableTable = "products" | "categories";

// Unicode combining diacritical marks (U+0300–U+036F), built via fromCharCode
// so the literal accent bytes never end up sitting in the source file.
const COMBINING_MARKS = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  "g",
);

/**
 * Turns a name into a candidate slug matching the DB's
 * `^[a-z0-9]+(-[a-z0-9]+)*$` check constraint — lowercase, no spaces,
 * apostrophes, or repeated/leading/trailing hyphens.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "") // strip accents, e.g. "café" -> "cafe"
    .replace(/'/g, "") // "chacha's" -> "chachas", not "chacha-s"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * A live preview of the SKU a product's name would generate — shown as a
 * hint while typing, same spirit as the slug preview. Like the slug, the
 * real value is only finalised (and checked for collisions) server-side.
 */
export function suggestSku(name: string): string {
  const letters = slugify(name).replace(/-/g, "").toUpperCase().slice(0, 8);
  return letters ? `CJ-${letters}` : "";
}

async function slugExists(
  supabase: SupabaseClient<Database>,
  table: SluggableTable,
  slug: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("slug", slug)
    .limit(1);

  if (error) {
    throw new Error(`Could not check ${table} slugs: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Builds a unique slug for `table` from `name`, appending -2, -3, ... on
 * collision. "Gold Bangle" then "Gold Bangle" again becomes "gold-bangle"
 * and "gold-bangle-2".
 */
export async function generateSlug(
  name: string,
  supabase: SupabaseClient<Database>,
  table: SluggableTable,
): Promise<string> {
  const base = slugify(name);
  if (!base) {
    throw new Error("Could not build a web address from that name.");
  }

  let candidate = base;
  let counter = 2;
  while (await slugExists(supabase, table, candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}

async function skuExists(supabase: SupabaseClient<Database>, sku: string): Promise<boolean> {
  const { data, error } = await supabase.from("products").select("id").eq("sku", sku).limit(1);

  if (error) {
    throw new Error(`Could not check product codes: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Builds a unique SKU from `name`, same collision pattern as generateSlug —
 * appending -2, -3, ... until it's free. Used when a product row is created
 * before the admin has necessarily settled on a final name (e.g. the draft
 * row an image upload creates); the real save can still leave this as-is or
 * regenerate it once the name is final.
 */
export async function generateSku(name: string, supabase: SupabaseClient<Database>): Promise<string> {
  const base = suggestSku(name) || "CJ-ITEM";

  let candidate = base;
  let counter = 2;
  while (await skuExists(supabase, candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}
