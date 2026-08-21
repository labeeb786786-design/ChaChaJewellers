"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { AdminAuthError, requireAdmin } from "@/lib/auth";
import { bandAppliesToSchema, type BandApplies } from "@/lib/schemas/pricing";
import {
  coerceBandFields,
  validateBandForm,
  type BandFormErrors,
  type BandFormState,
} from "@/lib/schemas/pricing-band-form";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/db";

type ActionResult<T> = T | { error: string };
type FormActionResult<T> = T | { error: string } | { fieldErrors: BandFormErrors };

/**
 * pricing_bands_no_overlap only rejects active bands (its WHERE clause is
 * `WHERE is_active`), so this mirrors that exactly — an inactive band never
 * conflicts with anything. Pre-checking here means the common case gets the
 * friendly "this overlaps the existing X-Yg band" message naming the actual
 * band; the exclusion constraint itself is still the real, unbypassable
 * guarantee (catchOverlapError below is the backstop for the gap between
 * this check and the write, e.g. a concurrent second save).
 */
async function findOverlappingBand(
  supabase: SupabaseClient<Database>,
  appliesTo: BandApplies,
  minWeightG: number,
  maxWeightG: number,
  isActive: boolean,
  excludeBandId?: string,
) {
  if (!isActive) return null;

  let query = supabase
    .from("pricing_bands")
    .select("id, label, min_weight_g, max_weight_g")
    .eq("applies_to", appliesTo)
    .eq("is_active", true)
    .lt("min_weight_g", maxWeightG)
    .gt("max_weight_g", minWeightG);

  if (excludeBandId) {
    query = query.neq("id", excludeBandId);
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) {
    throw new Error(`Could not check for overlapping bands: ${error.message}`);
  }
  return data;
}

function overlapMessage(band: { label: string; min_weight_g: string; max_weight_g: string }): string {
  return `This overlaps the existing ${band.label} (${band.min_weight_g}-${band.max_weight_g}g) band.`;
}

/** Backstop if the exclusion constraint itself fires (23P01) despite the pre-check above — a raw Postgres error must never reach the client. */
function isExclusionViolation(error: { code?: string }): boolean {
  return error.code === "23P01";
}

export async function createBand(
  appliesTo: BandApplies,
  values: BandFormState,
): Promise<FormActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const parsedAppliesTo = bandAppliesToSchema.safeParse(appliesTo);
  if (!parsedAppliesTo.success) {
    return { error: "Choose whether this band is for jewellery or bullion." };
  }

  const fieldErrors = validateBandForm(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const fields = coerceBandFields(values);
  const supabase = await createClient();

  const overlapping = await findOverlappingBand(
    supabase,
    parsedAppliesTo.data,
    Number(fields.min_weight_g),
    Number(fields.max_weight_g),
    fields.is_active,
  );
  if (overlapping) {
    return { fieldErrors: { maxWeightG: overlapMessage(overlapping) } };
  }

  const { data, error } = await supabase
    .from("pricing_bands")
    .insert({ ...fields, applies_to: parsedAppliesTo.data })
    .select("id")
    .single();

  if (error) {
    if (isExclusionViolation(error)) {
      return { error: "This range overlaps an existing band." };
    }
    return { error: `Could not create this band: ${error.message}` };
  }

  revalidatePath("/admin/pricing");
  return { id: data.id };
}

/**
 * Only ever writes label/range/percentages/is_active — never applies_to
 * (fixed at creation, see BandFormState's comment) and never touches
 * products.price_pence. Changing a band changes future calculations only;
 * existing products reprice on the next apply_metal_prices run, not here.
 */
export async function updateBand(
  bandId: string,
  appliesTo: BandApplies,
  values: BandFormState,
): Promise<FormActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const fieldErrors = validateBandForm(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const fields = coerceBandFields(values);
  const supabase = await createClient();

  const overlapping = await findOverlappingBand(
    supabase,
    appliesTo,
    Number(fields.min_weight_g),
    Number(fields.max_weight_g),
    fields.is_active,
    bandId,
  );
  if (overlapping) {
    return { fieldErrors: { maxWeightG: overlapMessage(overlapping) } };
  }

  const { error } = await supabase.from("pricing_bands").update(fields).eq("id", bandId);

  if (error) {
    if (isExclusionViolation(error)) {
      return { error: "This range overlaps an existing band." };
    }
    return { error: `Could not save this band: ${error.message}` };
  }

  revalidatePath("/admin/pricing");
  return { id: bandId };
}

export async function deleteBand(bandId: string): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pricing_bands").delete().eq("id", bandId);

  if (error) {
    return { error: `Could not remove this band: ${error.message}` };
  }

  revalidatePath("/admin/pricing");
  return { ok: true };
}
