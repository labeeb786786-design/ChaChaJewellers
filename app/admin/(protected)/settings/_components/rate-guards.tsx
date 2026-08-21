import { formatMoney } from "@/lib/money";

function GuardRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-admin-rule py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-admin-ink">{title}</h3>
        <span className="rounded-full bg-[#f1efe9] px-2 py-0.75 text-[11px] font-medium text-admin-muted">
          Developer-managed
        </span>
      </div>
      <p className="mt-1 text-sm text-admin-muted">{children}</p>
    </div>
  );
}

/**
 * Read-only, on purpose: these protect against bad data arriving from the
 * gold rate API (see guard_metal_rate() in the base migration), and
 * changing one is a judgement call about what a plausible market rate
 * looks like — not something to expose behind a text box the client could
 * mistype.
 */
export function RateGuards({
  goldMinPence,
  goldMaxPence,
  silverMinPence,
  silverMaxPence,
  maxMovePercent,
}: {
  goldMinPence: number;
  goldMaxPence: number;
  silverMinPence: number;
  silverMaxPence: number;
  maxMovePercent: number;
}) {
  return (
    <div className="rounded-admin-card border border-admin-rule bg-admin-surface p-4.5">
      <GuardRow title="Gold rate plausible range">
        A new gold rate is rejected if it falls outside {formatMoney(Math.round(goldMinPence))}–
        {formatMoney(Math.round(goldMaxPence))} per gram. Catches a unit or currency mistake from the rate
        provider before it reaches the site.
      </GuardRow>
      <GuardRow title="Silver rate plausible range">
        A new silver rate is rejected if it falls outside {formatMoney(Math.round(silverMinPence))}–
        {formatMoney(Math.round(silverMaxPence))} per gram, for the same reason.
      </GuardRow>
      <GuardRow title="Maximum rate movement">
        A new rate is rejected if it moves more than {maxMovePercent}% from the last one fetched. Gold and silver
        don&apos;t jump that much in a few hours — a bigger move is treated as a data fault, not a real market
        change.
      </GuardRow>
    </div>
  );
}
