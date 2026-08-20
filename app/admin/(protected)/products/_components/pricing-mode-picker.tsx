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

/**
 * Read-only display, not a control — pricing mode is derived one-to-one
 * from the chosen category (pricingModeForCategorySlug in lib/pricing.ts),
 * never a free admin choice. value is null before a category is chosen,
 * when no mode has been determined yet; every card renders unselected in
 * that state. The explanation of *why* it's locked lives in product-form.tsx,
 * since the wording depends on which category is selected.
 */
export function PricingModePicker({ value }: { value: PricingModeEnum | null }) {
  return (
    <div className="grid gap-2" role="radiogroup" aria-label="How this is priced" aria-readonly="true">
      {MODES.map((mode) => {
        const selected = value === mode.value;
        return (
          <div
            key={mode.value}
            role="radio"
            aria-checked={selected}
            className={`flex w-full items-start gap-2.75 rounded-[7px] border px-3.25 py-2.75 text-left ${
              selected ? "border-admin-gold bg-admin-gold-soft" : "border-admin-rule-strong bg-admin-surface opacity-60"
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
          </div>
        );
      })}
    </div>
  );
}
