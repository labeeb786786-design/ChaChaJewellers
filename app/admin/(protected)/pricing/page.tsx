import type { Metadata } from "next";
import { z } from "zod";

import { appliesToForMode } from "@/lib/pricing";
import { pricingBandRowSchema, type PricingBandRow } from "@/lib/schemas/pricing";
import { productWeightRowSchema } from "@/lib/schemas/product";
import { createClient } from "@/lib/supabase/server";
import { BandTable } from "./_components/band-table";
import type { PreviewCandidate } from "./_components/band-preview";

export const metadata: Metadata = {
  title: "Pricing",
};

export default async function AdminPricingPage() {
  const supabase = await createClient();

  const [bandsResult, productsResult] = await Promise.all([
    supabase.from("pricing_bands").select("*").order("applies_to").order("min_weight_g"),
    // Every dynamic product's weight, once, for two things this page needs
    // read-only: counting how many products a 0%-markup band blocks, and
    // anchoring the price preview to a real product where one exists.
    // Neither reimplements findBlockedProductIds()'s canPublish decision —
    // this is a plain weight-in-range count, the same range test
    // find_pricing_band() itself uses.
    supabase
      .from("products")
      .select("id, name, pricing_mode, weight_grams, metal")
      .neq("pricing_mode", "fixed")
      .not("weight_grams", "is", null)
      .is("removed_at", null),
  ]);

  if (bandsResult.error) {
    throw new Error(`Could not load pricing bands: ${bandsResult.error.message}`);
  }
  if (productsResult.error) {
    throw new Error(`Could not load products: ${productsResult.error.message}`);
  }

  const bands = z.array(pricingBandRowSchema).parse(bandsResult.data ?? []);
  const products = z.array(productWeightRowSchema.extend({ name: z.string(), metal: z.enum(["gold", "silver"]) })).parse(
    productsResult.data ?? [],
  );

  const productCountByBand = new Map<string, number>();
  for (const band of bands) {
    const count = products.filter(
      (p) =>
        appliesToForMode(p.pricing_mode) === band.applies_to &&
        p.weight_grams !== null &&
        p.weight_grams >= band.min_weight_g &&
        p.weight_grams < band.max_weight_g,
    ).length;
    productCountByBand.set(band.id, count);
  }

  const candidates: PreviewCandidate[] = products
    .filter((p) => p.weight_grams !== null)
    .map((p) => ({
      name: p.name,
      weightGrams: p.weight_grams as number,
      metal: p.metal,
      pricingMode: p.pricing_mode,
    }));

  const jewelleryBands = bands.filter((b) => b.applies_to === "jewellery");
  const bullionBands = bands.filter((b) => b.applies_to === "bullion");

  // A new band's minimum defaults to the previous band's maximum — the
  // highest max_weight_g among that section's active bands, or 0 if the
  // section is empty — so ranges stay continuous by construction instead
  // of leaving a gap for the admin to notice later.
  function defaultMinFor(sectionBands: PricingBandRow[]): number {
    const activeMaxes = sectionBands.filter((b) => b.is_active).map((b) => b.max_weight_g);
    return activeMaxes.length > 0 ? Math.max(...activeMaxes) : 0;
  }

  return (
    <div>
      <div className="mb-4.5">
        <h1 className="text-xl font-bold tracking-tight text-admin-ink">Pricing</h1>
        <p className="mt-1 text-sm text-admin-muted">
          The markup bands that turn a weight into a price. Changing a band only affects future calculations —
          existing products reprice the next time the gold rate is applied.
        </p>
      </div>

      <div className="space-y-6">
        <BandTable
          appliesTo="jewellery"
          bands={jewelleryBands}
          productCountByBand={productCountByBand}
          candidates={candidates}
          defaultMinWeightG={defaultMinFor(jewelleryBands)}
        />
        <BandTable
          appliesTo="bullion"
          bands={bullionBands}
          productCountByBand={productCountByBand}
          candidates={candidates}
          defaultMinWeightG={defaultMinFor(bullionBands)}
        />
      </div>
    </div>
  );
}
