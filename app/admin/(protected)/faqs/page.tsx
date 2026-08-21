import type { Metadata } from "next";
import { z } from "zod";

import { faqRowSchema } from "@/lib/schemas/faq";
import { createClient } from "@/lib/supabase/server";
import { DeleteFaqDialog } from "./_components/delete-faq-dialog";
import { FaqFormDialog } from "./_components/faq-form-dialog";
import { moveFaqForm } from "./actions";

export const metadata: Metadata = {
  title: "FAQs",
};

const moveArrowClasses =
  "rounded-admin-control border border-admin-rule-strong bg-admin-surface px-1.5 py-1 text-xs text-admin-ink hover:bg-[#f5f3ee] disabled:cursor-not-allowed disabled:opacity-40";

export default async function AdminFaqsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_faqs")
    .select("id, question, answer, keywords, sort_order, is_active")
    .order("sort_order")
    .order("created_at");

  if (error) {
    throw new Error(`Could not load FAQs: ${error.message}`);
  }

  const faqs = z.array(faqRowSchema).parse(data ?? []);

  return (
    <div>
      <div className="mb-4.5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-admin-ink">FAQs</h1>
          <p className="mt-1 text-sm text-admin-muted">
            The questions and answers the AI assistant draws on. Wording changes here go live immediately.
          </p>
        </div>
        <FaqFormDialog />
      </div>

      {faqs.length === 0 ? (
        <div className="rounded-admin-card border border-admin-rule bg-admin-surface px-6 py-14 text-center">
          <p className="text-sm font-semibold text-admin-ink">No FAQs yet</p>
          <p className="mt-1 text-sm text-admin-muted">
            There are around 60 to add. Start with the first one above.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-admin-card border border-admin-rule bg-admin-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-165 border-collapse">
              <thead>
                <tr className="border-b border-admin-rule">
                  <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                    Order
                  </th>
                  <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                    Question
                  </th>
                  <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                    Words a customer might use
                  </th>
                  <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                    Status
                  </th>
                  <th className="px-3.5 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {faqs.map((faq, index) => (
                  <tr key={faq.id} className="border-b border-admin-rule last:border-b-0 hover:bg-[#fcfbf8]">
                    <td className="px-3.5 py-3">
                      <div className="flex gap-1">
                        <form action={moveFaqForm.bind(null, faq.id, "up")}>
                          <button type="submit" disabled={index === 0} className={moveArrowClasses} aria-label="Move up">
                            ↑
                          </button>
                        </form>
                        <form action={moveFaqForm.bind(null, faq.id, "down")}>
                          <button
                            type="submit"
                            disabled={index === faqs.length - 1}
                            className={moveArrowClasses}
                            aria-label="Move down"
                          >
                            ↓
                          </button>
                        </form>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 max-w-90">
                      <p className="text-sm font-semibold text-admin-ink">{faq.question}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-admin-muted">{faq.answer}</p>
                    </td>
                    <td className="px-3.5 py-3 max-w-60">
                      <p className="text-xs text-admin-faint">
                        {faq.keywords.length > 0 ? faq.keywords.join(", ") : "—"}
                      </p>
                    </td>
                    <td className="px-3.5 py-3">
                      {faq.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-admin-ok-soft px-2 py-0.75 text-xs font-semibold text-admin-ok">
                          <span className="h-1.25 w-1.25 rounded-full bg-current" aria-hidden />
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#f1efe9] px-2 py-0.75 text-xs font-semibold text-admin-muted">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <FaqFormDialog faq={faq} />
                        <DeleteFaqDialog faqId={faq.id} question={faq.question} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
