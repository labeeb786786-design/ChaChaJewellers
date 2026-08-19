import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { AdminAuthError, requireAdmin } from "@/lib/auth";
import { calculatePrice, findBand, getLatestMetalRate } from "@/lib/pricing";
import { pricingBandSchema } from "@/lib/schemas/pricing";
import { createClient } from "@/lib/supabase/server";

/**
 * Backs the live price breakdown in the product form. A GET, not a Server
 * Action — it's a read fired on every debounced keystroke while typing a
 * weight, and Server Actions dispatch sequentially per client, which would
 * queue those calls up behind each other for no reason. Kept outside
 * /admin/* so the session-refresh proxy never turns a fetch into a redirect
 * to the login page; requireAdmin() below is the real gate either way.
 */

const querySchema = z.object({
  metal: z.enum(["gold", "silver"]),
  appliesTo: z.enum(["jewellery", "bullion"]),
  weightGrams: z.coerce.number().positive(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const parsedQuery = querySchema.safeParse({
    metal: request.nextUrl.searchParams.get("metal"),
    appliesTo: request.nextUrl.searchParams.get("appliesTo"),
    weightGrams: request.nextUrl.searchParams.get("weightGrams"),
  });
  if (!parsedQuery.success) {
    return NextResponse.json({ error: "That weight can't be priced." }, { status: 400 });
  }
  const { metal, appliesTo, weightGrams } = parsedQuery.data;

  try {
    const supabase = await createClient();

    const rateSource = await getLatestMetalRate(supabase);
    const rate =
      metal === "gold" ? (rateSource?.gold_per_gram_24k_pence ?? null) : (rateSource?.silver_per_gram_999_pence ?? null);

    if (rate === null) {
      return NextResponse.json({ rate: null, band: null, totalPence: null });
    }

    const rawBand = await findBand(supabase, appliesTo, weightGrams);
    if (!rawBand) {
      return NextResponse.json({ rate, band: null, totalPence: null });
    }
    const band = pricingBandSchema.parse(rawBand);

    const totalPence = await calculatePrice(supabase, appliesTo, weightGrams, rate);

    return NextResponse.json({
      rate,
      band: { label: band.label, markupPercent: band.markup_percent, vatPercent: band.vat_percent },
      totalPence,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not calculate the price.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
