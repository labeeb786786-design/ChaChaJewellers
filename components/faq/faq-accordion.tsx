"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type Faq = { q: string; a: string };

export function FaqAccordion({ items }: { items: Faq[] }) {
  // Single-open accordion; first question open by default for easy reading.
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-colors hover:border-gold/40"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
            >
              <span className="font-serif text-base font-semibold text-foreground sm:text-lg">
                {item.q}
              </span>
              <ChevronDown
                className={
                  "size-5 shrink-0 text-gold-deep transition-transform duration-300 " +
                  (isOpen ? "rotate-180" : "")
                }
              />
            </button>
            <div
              className={
                "grid transition-all duration-300 ease-out " +
                (isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")
              }
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6 sm:text-[15px]">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
