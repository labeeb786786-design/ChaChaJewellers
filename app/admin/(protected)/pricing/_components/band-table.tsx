import type { BandApplies, PricingBandRow } from "@/lib/schemas/pricing";
import { BandFormDialog } from "./band-form-dialog";
import type { PreviewCandidate } from "./band-preview";
import { DeleteBandDialog } from "./delete-band-dialog";

export function BandTable({
  appliesTo,
  bands,
  productCountByBand,
  candidates,
  defaultMinWeightG,
}: {
  appliesTo: BandApplies;
  bands: PricingBandRow[];
  productCountByBand: Map<string, number>;
  candidates: PreviewCandidate[];
  defaultMinWeightG: number;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold capitalize text-admin-ink">{appliesTo}</h2>
        <BandFormDialog appliesTo={appliesTo} defaultMinWeightG={defaultMinWeightG} candidates={candidates} />
      </div>

      {bands.length === 0 ? (
        <div className="rounded-admin-card border border-admin-rule bg-admin-surface px-6 py-8 text-center text-sm text-admin-muted">
          No {appliesTo} bands yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-admin-card border border-admin-rule bg-admin-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-165 border-collapse">
              <thead>
                <tr className="border-b border-admin-rule">
                  <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                    Range
                  </th>
                  <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                    Label
                  </th>
                  <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                    Markup
                  </th>
                  <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                    VAT
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
                {bands.map((band) => {
                  const productCount = productCountByBand.get(band.id) ?? 0;
                  const isZeroMarkup = band.markup_percent === 0;

                  return (
                    <tr key={band.id} className="border-b border-admin-rule last:border-b-0 hover:bg-[#fcfbf8]">
                      <td className="px-3.5 py-3 font-admin-mono text-sm tabular-nums text-admin-ink">
                        {band.min_weight_g}–{band.max_weight_g}g
                      </td>
                      <td className="px-3.5 py-3 text-sm font-semibold text-admin-ink">{band.label}</td>
                      <td className="px-3.5 py-3">
                        <span
                          className={`font-admin-mono text-sm tabular-nums ${isZeroMarkup ? "font-semibold text-admin-warn" : "text-admin-ink"}`}
                        >
                          {band.markup_percent}%
                        </span>
                      </td>
                      <td className="px-3.5 py-3 font-admin-mono text-sm tabular-nums text-admin-ink">
                        {band.vat_percent}%
                      </td>
                      <td className="px-3.5 py-3">
                        {!band.is_active ? (
                          <span className="rounded-full bg-[#f1efe9] px-2 py-0.75 text-xs font-semibold text-admin-muted">
                            Inactive
                          </span>
                        ) : isZeroMarkup ? (
                          <span className="rounded-full bg-admin-warn-soft px-2 py-0.75 text-xs font-semibold text-admin-warn">
                            0% markup — blocks {productCount} product{productCount === 1 ? "" : "s"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-admin-ok-soft px-2 py-0.75 text-xs font-semibold text-admin-ok">
                            <span className="h-1.25 w-1.25 rounded-full bg-current" aria-hidden />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <BandFormDialog appliesTo={appliesTo} band={band} candidates={candidates} />
                          <DeleteBandDialog bandId={band.id} bandLabel={band.label} productCount={productCount} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
