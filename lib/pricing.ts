import type { SupabaseClient } from "@supabase/supabase-js";
import type { BandAppliesToEnum, Database, PricingModeEnum } from "@/types/db";

export type PricingBand = Database["public"]["Tables"]["pricing_bands"]["Row"];

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
