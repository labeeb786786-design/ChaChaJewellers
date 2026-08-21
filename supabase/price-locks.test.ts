import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/types/db";

/**
 * Integration tests against the linked Supabase project's real Postgres
 * instance — the whole point of create_price_lock's SELECT ... FOR UPDATE
 * locking is behaviour across two separate transactions, which a mock
 * cannot meaningfully exercise. Every test below runs against a single
 * throwaway product created in beforeAll and removed in afterAll; it never
 * touches real catalogue data.
 *
 * .env.local isn't loaded automatically by vitest (unlike Next.js) — read
 * directly, the same way scratch verification scripts have throughout this
 * project's development.
 */
function loadEnvLocal(): Record<string, string> {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};

  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split("\n")
      .filter((line) => line.includes("="))
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
      }),
  );
}

const env = loadEnvLocal();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const hasCredentials = Boolean(supabaseUrl && serviceRoleKey);

describe.skipIf(!hasCredentials)("price lock stock reservation", () => {
  let supabase: SupabaseClient<Database>;
  let categoryId: string;
  let productId: string;
  const createdLockIds: string[] = [];

  beforeAll(async () => {
    supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", "rings")
      .single();
    if (categoryError || !category) {
      throw new Error(`Test setup: could not find the "rings" category: ${categoryError?.message}`);
    }
    categoryId = category.id;

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        name: "TEST price-lock product (safe to delete)",
        slug: `test-price-lock-product-${Date.now()}`,
        sku: `TEST-PRICE-LOCK-${Date.now()}`,
        category_id: categoryId,
        pricing_mode: "dynamic_jewellery",
        metal: "gold",
        weight_grams: "1",
        stock_quantity: 1,
        is_active: false,
      })
      .select("id")
      .single();
    if (productError || !product) {
      throw new Error(`Test setup: could not create the throwaway test product: ${productError?.message}`);
    }
    productId = product.id;
  });

  afterAll(async () => {
    for (const lockId of createdLockIds) {
      // Ignore errors: a lock a test already consumed can't be released,
      // and one already released is a no-op error either way — the product
      // delete below is what actually needs every lock gone first.
      await supabase.rpc("release_price_lock", { p_lock_id: lockId });
    }
    if (productId) {
      await supabase.from("products").delete().eq("id", productId);
    }
  });

  async function availableStock(): Promise<number | null> {
    const { data, error } = await supabase.rpc("available_stock", { p_product_id: productId });
    if (error) throw new Error(error.message);
    return data;
  }

  it("reserves stock on create and frees it on release", async () => {
    expect(await availableStock()).toBe(1);

    const { data: lock, error } = await supabase.rpc("create_price_lock", {
      p_items: [{ product_id: productId, quantity: 1 }],
      p_shipping_pence: 500,
      p_duration_minutes: 15,
    });
    expect(error).toBeNull();
    expect(lock).not.toBeNull();
    if (lock) createdLockIds.push(lock.id);

    expect(await availableStock()).toBe(0);

    const { error: releaseError } = await supabase.rpc("release_price_lock", { p_lock_id: lock!.id });
    expect(releaseError).toBeNull();

    expect(await availableStock()).toBe(1);
  });

  it("rejects a second sequential lock once stock is reserved, naming the product", async () => {
    const { data: first, error: firstError } = await supabase.rpc("create_price_lock", {
      p_items: [{ product_id: productId, quantity: 1 }],
      p_shipping_pence: 0,
      p_duration_minutes: 15,
    });
    expect(firstError).toBeNull();
    if (first) createdLockIds.push(first.id);

    const { data: second, error: secondError } = await supabase.rpc("create_price_lock", {
      p_items: [{ product_id: productId, quantity: 1 }],
      p_shipping_pence: 0,
      p_duration_minutes: 15,
    });
    expect(second).toBeNull();
    expect(secondError?.message).toMatch(/not enough stock/i);
    expect(secondError?.message).toContain("TEST price-lock product");

    await supabase.rpc("release_price_lock", { p_lock_id: first!.id });
  });

  it("under two simultaneous requests for the last unit, exactly one succeeds", async () => {
    expect(await availableStock()).toBe(1);

    const attempt = () =>
      supabase.rpc("create_price_lock", {
        p_items: [{ product_id: productId, quantity: 1 }],
        p_shipping_pence: 0,
        p_duration_minutes: 15,
      });

    // Fired together, not awaited one at a time — two genuinely overlapping
    // requests, each its own Postgres transaction. This is exactly the
    // failure the SELECT ... FOR UPDATE locking in create_price_lock exists
    // to prevent: two transactions both reading "stock: 1" and both
    // proceeding to reserve it.
    const [a, b] = await Promise.all([attempt(), attempt()]);

    const results = [a, b];
    const succeeded = results.filter((r) => r.error === null);
    const failed = results.filter((r) => r.error !== null);

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0]!.error!.message).toMatch(/not enough stock/i);

    const winningLock = succeeded[0]!.data!;
    createdLockIds.push(winningLock.id);

    // Stock is fully committed to the winner — nothing left for a third attempt.
    expect(await availableStock()).toBe(0);
  });
});
