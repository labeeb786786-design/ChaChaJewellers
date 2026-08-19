import { formatMoney, parseMoney } from "@/lib/money";
import type { MetalEnum, PricingModeEnum } from "@/types/db";
import type { PricePreview } from "./use-price-preview";

const APPLIES_TO_LABEL: Record<"jewellery" | "bullion", string> = {
  jewellery: "gold jewellery",
  bullion: "bars and coins",
};

function legendClasses() {
  return "mb-2.75 flex items-center justify-between border-b border-admin-rule pb-2.75 font-admin-mono text-[10px] font-semibold tracking-[0.12em] text-admin-faint uppercase";
}

function ReceiptLine({
  label,
  value,
  indent = false,
}: {
  label: string;
  value: string;
  indent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2.5 py-1.25 text-xs">
      <span className={indent ? "pl-2.75 text-admin-muted" : "text-admin-muted"}>{label}</span>
      <span className="font-medium text-admin-ink tabular-nums">{value}</span>
    </div>
  );
}

function TotalRow({ danger, value }: { danger: boolean; value: string }) {
  return (
    <div className="mt-2.75 flex items-baseline justify-between border-t-[1.5px] border-admin-ink pt-2.75">
      <span className="font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
        Sells for
      </span>
      <strong
        className={`text-2xl font-semibold tracking-tight tabular-nums ${danger ? "text-admin-danger" : "text-admin-ink"}`}
      >
        {value}
      </strong>
    </div>
  );
}

function Note({ danger, title, children }: { danger: boolean; title: string; children: React.ReactNode }) {
  return (
    <div
      className={`mt-2.75 rounded-admin-control px-2.75 py-2 text-xs ${
        danger ? "bg-admin-danger-soft text-[#7a2020]" : "bg-[#f5f3ee] text-admin-muted"
      }`}
    >
      <strong className="mb-0.5 block">{title}</strong>
      {children}
    </div>
  );
}

function FixedModeReceipt({ fixedPrice }: { fixedPrice: string }) {
  const typed = fixedPrice.trim();
  let pence: number | null = null;
  try {
    pence = typed ? parseMoney(typed) : null;
  } catch {
    pence = null;
  }

  return (
    <div>
      <div className={legendClasses()}>
        <span>Price</span>
        <span>Fixed</span>
      </div>
      <ReceiptLine label="You typed" value={typed ? `£${typed}` : "—"} />
      <ReceiptLine label="Stored as" value={pence !== null ? `${pence}p` : "—"} />
      <TotalRow danger={false} value={pence !== null ? formatMoney(pence) : "—"} />
      <Note danger={false} title="No live rate applied">
        This price stays put until you change it.
      </Note>
    </div>
  );
}

/**
 * Presentational — the live fetch lives in usePricePreview(), called once
 * in product-form.tsx and shared with the Publish button's disabled state
 * and the publish-confirmation dialog. This just renders whatever it's given.
 */
export function PriceBreakdown({
  pricingMode,
  fixedPrice,
  preview,
}: {
  pricingMode: PricingModeEnum;
  fixedPrice: string;
  preview: PricePreview;
}) {
  if (pricingMode === "fixed") {
    return (
      <div className="rounded-admin-card border border-admin-rule bg-admin-surface p-4.5 font-admin-mono">
        <FixedModeReceipt fixedPrice={fixedPrice} />
      </div>
    );
  }

  return (
    <div className="rounded-admin-card border border-admin-rule bg-admin-surface p-4.5 font-admin-mono">
      {preview.status === "empty" && (
        <div>
          <div className={legendClasses()}>
            <span>Price breakdown</span>
          </div>
          <ReceiptLine label="Waiting for a weight" value="—" />
          <TotalRow danger={false} value="—" />
        </div>
      )}

      {preview.status === "loading" && (
        <div>
          <div className={legendClasses()}>
            <span>Price breakdown</span>
          </div>
          <p className="py-1.25 text-xs text-admin-muted">Calculating…</p>
        </div>
      )}

      {preview.status === "error" && (
        <div>
          <div className={legendClasses()}>
            <span>Price breakdown</span>
          </div>
          <Note danger title="Couldn't calculate the price">
            {preview.message}
          </Note>
        </div>
      )}

      {preview.status === "success" && (
        <DynamicResult
          weight={preview.weight}
          metal={preview.metal}
          appliesTo={preview.appliesTo}
          rate={preview.rate}
          band={preview.band}
          totalPence={preview.totalPence}
        />
      )}
    </div>
  );
}

function DynamicResult({
  weight,
  metal,
  appliesTo,
  rate,
  band,
  totalPence,
}: {
  weight: number;
  metal: MetalEnum;
  appliesTo: "jewellery" | "bullion";
  rate: number | null;
  band: { label: string; markupPercent: number; vatPercent: number } | null;
  totalPence: number | null;
}) {
  if (rate === null) {
    return (
      <div>
        <div className={legendClasses()}>
          <span>Price breakdown</span>
        </div>
        <ReceiptLine label="Awaiting gold rate" value="—" />
        <TotalRow danger={false} value="—" />
        <Note danger={false} title="No gold rate yet">
          The price will calculate as soon as a rate is recorded. Nothing in
          this pricing mode can be published until then.
        </Note>
      </div>
    );
  }

  if (band === null) {
    return (
      <div>
        <div className={legendClasses()}>
          <span>Price breakdown</span>
        </div>
        <ReceiptLine label="No band covers this weight" value="—" />
        <TotalRow danger={false} value="—" />
        <Note danger title={`No band for ${weight.toFixed(2)}g`}>
          There&apos;s a gap in the {APPLIES_TO_LABEL[appliesTo]} bands around this weight. Add one under
          Pricing to price it.
        </Note>
      </div>
    );
  }

  if (totalPence === null) {
    return (
      <div>
        <div className={legendClasses()}>
          <span>Price breakdown</span>
        </div>
        <Note danger title="Couldn't calculate the price">
          Something about this weight and band combination didn&apos;t compute. Try a slightly different
          weight.
        </Note>
      </div>
    );
  }

  const metalCostPence = Math.round(rate * weight);
  const beforeVatPence = Math.round(metalCostPence * (1 + band.markupPercent / 100));
  const blocked = band.markupPercent === 0;
  const metalLabel = metal === "gold" ? "Gold, 24k, per gram" : "Silver, 999, per gram";

  return (
    <div>
      <div className={legendClasses()}>
        <span>Price breakdown</span>
        <span className="flex items-center gap-1.25 text-admin-ok normal-case tracking-normal">
          <span aria-hidden className="h-1.25 w-1.25 animate-pulse rounded-full bg-current" />
          Live rate
        </span>
      </div>

      <ReceiptLine label={metalLabel} value={formatMoney(Math.round(rate))} />
      <ReceiptLine label="× Weight" value={`${weight.toFixed(2)}g`} indent />
      <ReceiptLine label="Metal cost" value={formatMoney(metalCostPence)} />
      <ReceiptLine label={`× Markup, ${band.label} band`} value={`${band.markupPercent}%`} indent />
      <ReceiptLine label="Before VAT" value={formatMoney(beforeVatPence)} />
      <ReceiptLine label="× VAT" value={`${band.vatPercent}%`} indent />

      <TotalRow danger={blocked} value={formatMoney(totalPence)} />

      {blocked ? (
        <Note danger title="This band earns you nothing">
          The {band.label} band is set to 0% markup, so this sells at the bare cost of the gold.
          Publishing is blocked until it&apos;s set.
        </Note>
      ) : (
        <Note danger={false} title={`${band.label} band · ${band.markupPercent}% markup`}>
          Recalculates automatically when the gold rate moves.
        </Note>
      )}
    </div>
  );
}
