"use client";

import type { PricingModeEnum } from "@/types/db";

const MODES: Array<{ value: PricingModeEnum; label: string; description: string }> = [
  {
    value: "dynamic_jewellery",
    label: "Gold jewellery",
    description: "Price follows the live gold rate. You enter the weight.",
  },
  {
    value: "dynamic_bullion",
    label: "Bars and coins",
    description: "Price follows the live gold rate, no VAT.",
  },
  {
    value: "fixed",
    label: "Fixed price",
    description: "For diamond pieces. You type the price yourself.",
  },
];

export function PricingModePicker({
  value,
  onChange,
}: {
  value: PricingModeEnum;
  onChange: (mode: PricingModeEnum) => void;
}) {
  return (
    <div className="grid gap-2" role="radiogroup" aria-label="How this is priced">
      {MODES.map((mode) => {
        const selected = value === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(mode.value)}
            className={`flex w-full items-start gap-2.75 rounded-[7px] border px-3.25 py-2.75 text-left ${
              selected
                ? "border-admin-gold bg-admin-gold-soft"
                : "border-admin-rule-strong bg-admin-surface hover:border-admin-faint"
            }`}
          >
            <span
              aria-hidden
              className={`mt-0.5 grid h-3.75 w-3.75 shrink-0 place-items-center rounded-full border-[1.5px] ${
                selected ? "border-admin-gold" : "border-admin-rule-strong"
              }`}
            >
              {selected && <span className="h-1.75 w-1.75 rounded-full bg-admin-gold" />}
            </span>
            <span>
              <strong className="block text-sm font-semibold text-admin-ink">{mode.label}</strong>
              <span className="text-xs text-admin-muted">{mode.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
