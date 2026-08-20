import type { SupabaseClient } from "@supabase/supabase-js";
import { metalRateSourceSchema, type MetalRateSource } from "@/lib/schemas/pricing";
import { resolveSizeFields, type SizeWriteFields } from "@/lib/size";
import type { BandAppliesToEnum, Database, MetalEnum, PricingModeEnum } from "@/types/db";

export type PricingBand = Database["public"]["Tables"]["pricing_bands"]["Row"];

/**
 * Category determines pricing mode one-to-one — never a free choice.
 * Bullion is always priced from the live gold rate with no VAT, Diamond is
 * always a fixed price a human types, everything else is ordinary dynamic
 * jewellery. Matched by slug, not name, since slug is the stable identifier
 * elsewhere in this codebase (generateSlug, etc.) — a category could be
 * renamed without changing what it prices as.
 */
export function pricingModeForCategorySlug(categorySlug: string): PricingModeEnum {
  if (categorySlug === "bullion") return "dynamic_bullion";
  if (categorySlug === "diamond") return "fixed";
  return "dynamic_jewellery";
}

export type CategoryDerivedFields = { pricingMode: PricingModeEnum } & SizeWriteFields;

/**
 * Everything about a product's category that isn't safe to trust from the
 * client: the pricing mode it locks the mode picker to, and the size
 * fields for its size_type. One query, since both come off the same
 * categories row — never trust a client-sent pricing_mode or size_type,
 * only the categoryId (a plain id lookup, nothing to fake into a
 * different answer).
 */
export async function resolveCategoryDerivedFields(
  supabase: SupabaseClient<Database>,
  categoryId: string,
  rawSizeInput: string,
): Promise<CategoryDerivedFields> {
  const { data, error } = await supabase
    .from("categories")
    .select("slug, size_type")
    .eq("id", categoryId)
    .maybeSingle();

  if (error || !data) {
    return { pricingMode: "dynamic_jewellery", size_label: null, size_sort: null };
  }

  const size = resolveSizeFields(data.size_type, rawSizeInput);

  return {
    pricingMode: pricingModeForCategorySlug(data.slug),
    size_label: size.sizeLabel,
    size_sort: size.sizeSort === null ? null : String(size.sizeSort),
  };
}

/** dynamic_jewellery -> jewellery, dynamic_bullion -> bullion. `fixed` has no band. */
export function appliesToForMode(mode: PricingModeEnum): BandAppliesToEnum | null {
  if (mode === "dynamic_jewellery") return "jewellery";
  if (mode === "dynamic_bullion") return "bullion";
  return null;
}

/**
 * Looks up the pricing band for a weight via the `find_pricing_band` DB
 * function — never reimplement the band-matching logic client-side.
 */
export async function findBand(
  supabase: SupabaseClient<Database>,
  appliesTo: BandAppliesToEnum,
  weightGrams: number,
): Promise<PricingBand | null> {
  const { data, error } = await supabase.rpc("find_pricing_band", {
    p_applies_to: appliesTo,
    p_weight_g: weightGrams,
  });

  if (error) {
    throw new Error(`Could not look up the pricing band: ${error.message}`);
  }

  // The DB function returns a row of nulls (not no rows) when nothing matches.
  return data && data.id ? data : null;
}

/**
 * Calculates the sell price in pence via the `calculate_dynamic_price_pence`
 * DB function — never reimplement the markup/VAT arithmetic client-side.
 */
export async function calculatePrice(
  supabase: SupabaseClient<Database>,
  appliesTo: BandAppliesToEnum,
  weightGrams: number,
  ratePerGramPence: number,
  roundToPence = 1,
): Promise<number | null> {
  const { data, error } = await supabase.rpc("calculate_dynamic_price_pence", {
    p_applies_to: appliesTo,
    p_weight_g: weightGrams,
    p_rate_per_gram_pence: ratePerGramPence,
    p_round_to_pence: roundToPence,
  });

  if (error) {
    throw new Error(`Could not calculate the price: ${error.message}`);
  }

  return data;
}

/**
 * The latest applied gold rate, resolved the same way the
 * current_metal_prices view does (succeeded, applied, most recent) — but
 * read from gold_price_log directly so the id comes with it. Returns null
 * when the log is empty or has no applied row yet; that's the same "no
 * rate" state either way, never a row of nulls to confuse with a real one.
 */
export async function getLatestMetalRate(
  supabase: SupabaseClient<Database>,
): Promise<MetalRateSource | null> {
  const { data, error } = await supabase
    .from("gold_price_log")
    .select("id, gold_per_gram_24k_pence, silver_per_gram_999_pence")
    .eq("succeeded", true)
    .not("applied_at", "is", null)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not read the gold rate: ${error.message}`);
  }
  if (!data) return null;

  return metalRateSourceSchema.parse(data);
}

export type CalculatedProductPrice = {
  pricePence: number;
  priceCalculatedAt: string;
  priceSourceLogId: string;
};

/**
 * What a dynamic-mode product should sell for right now, computed via
 * calculate_dynamic_price_pence() — never reimplemented here. Returns null
 * whenever there's nothing to calculate against yet: fixed pricing (the
 * admin's typed price is authoritative, nothing to compute), no weight, no
 * rate recorded for the product's metal, or no band covering the weight.
 * A null result doesn't distinguish "can't compute" from "computes to
 * zero-markup" — a band with 0% markup still produces a real (if bad)
 * price here; canPublish() is what blocks publishing on that, not this.
 */
export async function calculateProductPrice(
  supabase: SupabaseClient<Database>,
  product: { pricingMode: PricingModeEnum; weightGrams: number | null; metal: MetalEnum },
): Promise<CalculatedProductPrice | null> {
  const appliesTo = appliesToForMode(product.pricingMode);
  if (!appliesTo || product.weightGrams === null) return null;

  const rateSource = await getLatestMetalRate(supabase);
  if (!rateSource) return null;

  const rate =
    product.metal === "gold" ? rateSource.gold_per_gram_24k_pence : rateSource.silver_per_gram_999_pence;
  if (rate === null) return null;

  const band = await findBand(supabase, appliesTo, product.weightGrams);
  if (!band) return null;

  const pricePence = await calculatePrice(supabase, appliesTo, product.weightGrams, rate);
  if (pricePence === null) return null;

  return { pricePence, priceCalculatedAt: new Date().toISOString(), priceSourceLogId: rateSource.id };
}

export type PriceWriteFields = {
  price_pence: number | null;
  price_calculated_at: string | null;
  price_source_log_id: string | null;
};

/**
 * What to write for price_pence / price_calculated_at / price_source_log_id
 * on every create or update — always recomputed fresh, never left stale.
 * Fixed mode keeps the admin's typed price (already in fixedPricePence) and
 * clears the live-rate metadata, since a fixed price doesn't track a rate.
 * Dynamic mode that can't currently be calculated (no rate yet, no band for
 * the weight) writes null rather than leaving a previous, possibly-wrong
 * value in place — a stale price is the same kind of failure as a silent
 * zero markup.
 */
export async function resolvePriceWriteFields(
  supabase: SupabaseClient<Database>,
  product: {
    pricingMode: PricingModeEnum;
    weightGrams: number | null;
    metal: MetalEnum;
    fixedPricePence: number | null;
  },
): Promise<PriceWriteFields> {
  if (product.pricingMode === "fixed") {
    return { price_pence: product.fixedPricePence, price_calculated_at: null, price_source_log_id: null };
  }

  const calculated = await calculateProductPrice(supabase, product);
  if (!calculated) {
    return { price_pence: null, price_calculated_at: null, price_source_log_id: null };
  }

  return {
    price_pence: calculated.pricePence,
    price_calculated_at: calculated.priceCalculatedAt,
    price_source_log_id: calculated.priceSourceLogId,
  };
}

/**
 * The zero-markup guard (brief section 6, "the highest-value check in the
 * project"). A product on a dynamic pricing mode can't be published while
 * its band's markup sits at 0% — that would sell gold at raw cost. Pure and
 * synchronous so it can run identically in the UI and in the Server Action;
 * the caller is responsible for fetching the band first via `findBand`.
 */
export function canPublish(
  pricingMode: PricingModeEnum,
  band: PricingBand | null,
): boolean {
  if (pricingMode === "fixed") return true;
  if (!band) return false;
  return Number(band.markup_percent) > 0;
}

/**
 * Runs the zero-markup guard over a batch of products (e.g. a product list
 * page) and returns the ids that are blocked. Products sharing a pricing
 * mode and weight share a band, so lookups are deduped by that pair rather
 * than calling findBand() once per product — still delegating the actual
 * band match to the DB function, just not redundantly.
 */
export async function findBlockedProductIds(
  supabase: SupabaseClient<Database>,
  products: Array<{ id: string; pricingMode: PricingModeEnum; weightGrams: number | null }>,
): Promise<Set<string>> {
  const blocked = new Set<string>();
  const bandByKey = new Map<string, PricingBand | null>();

  for (const product of products) {
    const appliesTo = appliesToForMode(product.pricingMode);
    if (!appliesTo || product.weightGrams === null) continue;

    const key = `${appliesTo}:${product.weightGrams}`;
    if (!bandByKey.has(key)) {
      bandByKey.set(key, await findBand(supabase, appliesTo, product.weightGrams));
    }

    if (!canPublish(product.pricingMode, bandByKey.get(key) ?? null)) {
      blocked.add(product.id);
    }
  }

  return blocked;
}
