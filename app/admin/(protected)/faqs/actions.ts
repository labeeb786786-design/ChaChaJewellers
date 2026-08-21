"use server";

import { revalidatePath } from "next/cache";

import { AdminAuthError, requireAdmin } from "@/lib/auth";
import {
  coerceFaqFields,
  validateFaqForm,
  type FaqFormErrors,
  type FaqFormState,
} from "@/lib/schemas/faq";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T> = T | { error: string };
type FormActionResult<T> = T | { error: string } | { fieldErrors: FaqFormErrors };

export async function createFaq(values: FaqFormState): Promise<FormActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const fieldErrors = validateFaqForm(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const fields = coerceFaqFields(values);
  const supabase = await createClient();

  // New FAQs go to the end of the list, not sort_order 0 — otherwise every
  // new entry would jump straight to the top.
  const { data: last } = await supabase
    .from("ai_faqs")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = (last?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("ai_faqs")
    .insert({ ...fields, sort_order: nextSortOrder })
    .select("id")
    .single();

  if (error) {
    return { error: `Could not add this FAQ: ${error.message}` };
  }

  revalidatePath("/admin/faqs");
  return { id: data.id };
}

export async function updateFaq(faqId: string, values: FaqFormState): Promise<FormActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const fieldErrors = validateFaqForm(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const fields = coerceFaqFields(values);
  const supabase = await createClient();

  // search_vector is a generated column (question + answer) — never
  // written to; Postgres recomputes it from the columns above on its own.
  const { error } = await supabase.from("ai_faqs").update(fields).eq("id", faqId);

  if (error) {
    return { error: `Could not save this FAQ: ${error.message}` };
  }

  revalidatePath("/admin/faqs");
  return { id: faqId };
}

export async function deleteFaq(faqId: string): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ai_faqs").delete().eq("id", faqId);

  if (error) {
    return { error: `Could not remove this FAQ: ${error.message}` };
  }

  revalidatePath("/admin/faqs");
  return { ok: true };
}

/**
 * Swaps sort_order with the immediate neighbour in the current ordering,
 * found by position (index in the ordered list) rather than by numeric
 * distance — correct even when sort_order values collide or aren't
 * contiguous, which a plain "+1 row" numeric guess wouldn't be.
 */
export async function moveFaq(faqId: string, direction: "up" | "down"): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) return { error: error.message };
    throw error;
  }

  const supabase = await createClient();

  const { data: ordered, error: fetchError } = await supabase
    .from("ai_faqs")
    .select("id, sort_order")
    .order("sort_order")
    .order("created_at");

  if (fetchError) {
    return { error: `Could not reorder: ${fetchError.message}` };
  }

  const rows = ordered ?? [];
  const index = rows.findIndex((row) => row.id === faqId);
  const neighborIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || neighborIndex < 0 || neighborIndex >= rows.length) {
    // Already at the top/bottom, or the row is gone — nothing to do, not an error.
    return { ok: true };
  }

  const current = rows[index]!;
  const neighbor = rows[neighborIndex]!;

  const [firstUpdate, secondUpdate] = await Promise.all([
    supabase.from("ai_faqs").update({ sort_order: neighbor.sort_order }).eq("id", current.id),
    supabase.from("ai_faqs").update({ sort_order: current.sort_order }).eq("id", neighbor.id),
  ]);

  if (firstUpdate.error || secondUpdate.error) {
    const message = (firstUpdate.error ?? secondUpdate.error)!.message;
    return { error: `Could not reorder: ${message}` };
  }

  revalidatePath("/admin/faqs");
  return { ok: true };
}

/**
 * A plain <form action={...}> only accepts an action returning void — the
 * up/down buttons don't display an error (reordering can't meaningfully
 * fail for a signed-in admin), so this just discards moveFaq()'s result
 * rather than needing every other action's {error} shape to grow a UI here.
 */
export async function moveFaqForm(faqId: string, direction: "up" | "down"): Promise<void> {
  await moveFaq(faqId, direction);
}
