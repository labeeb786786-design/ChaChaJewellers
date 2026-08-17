import { Gem } from "lucide-react";
import Link from "next/link";

import { formatMoney } from "@/lib/money";

export type DisplayProduct = {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  weightGrams: number | null;
  pricePence: number | null;
  isActive: boolean;
  isBlocked: boolean;
  imageUrl: string | null;
};

function StatusPill({ isActive, isBlocked }: { isActive: boolean; isBlocked: boolean }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-admin-ok-soft px-2 py-0.75 text-xs font-semibold text-admin-ok">
        <span className="h-1.25 w-1.25 rounded-full bg-current" aria-hidden />
        Live
      </span>
    );
  }
  if (isBlocked) {
    return (
      <span className="rounded-full bg-admin-warn-soft px-2 py-0.75 text-xs font-semibold text-admin-warn">
        Can&apos;t publish
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[#f1efe9] px-2 py-0.75 text-xs font-semibold text-admin-muted">
      Draft
    </span>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const classes =
    "rounded-admin-control border border-admin-rule-strong px-2.5 py-1.25 text-xs font-medium";

  if (disabled) {
    return <span className={`${classes} text-admin-faint opacity-50`}>{children}</span>;
  }

  return (
    <Link href={href} className={`${classes} bg-admin-surface text-admin-ink hover:bg-[#f5f3ee]`}>
      {children}
    </Link>
  );
}

export function ProductTable({
  products,
  page,
  totalPages,
  buildHref,
}: {
  products: DisplayProduct[];
  page: number;
  totalPages: number;
  buildHref: (targetPage: number) => string;
}) {
  return (
    <div className="overflow-hidden rounded-admin-card border border-admin-rule bg-admin-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-165 border-collapse">
          <thead>
            <tr className="border-b border-admin-rule">
              <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                Product
              </th>
              <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                Category
              </th>
              <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                Weight
              </th>
              <th className="px-3.5 py-2.5 text-left font-admin-mono text-[10px] font-semibold tracking-[0.1em] text-admin-faint uppercase">
                Price
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
            {products.map((product) => (
              <tr key={product.id} className="border-b border-admin-rule last:border-b-0 hover:bg-[#fcfbf8]">
                <td className="px-3.5 py-3">
                  <div className="flex items-center gap-2.75">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[5px] bg-admin-gold-soft">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail from Supabase Storage, not a next/image remote pattern
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="h-10 w-10 rounded-[5px] object-cover"
                        />
                      ) : (
                        <Gem className="h-4.5 w-4.5 text-admin-gold" strokeWidth={1.75} aria-hidden />
                      )}
                    </div>
                    <div>
                      <strong className="block text-sm font-semibold text-admin-ink">
                        {product.name}
                      </strong>
                      <small className="font-admin-mono text-[11px] text-admin-faint">
                        {product.sku}
                      </small>
                    </div>
                  </div>
                </td>
                <td className="px-3.5 py-3 text-sm text-admin-ink">{product.categoryName}</td>
                <td className="px-3.5 py-3 font-admin-mono text-sm tabular-nums text-admin-ink">
                  {product.weightGrams !== null ? `${product.weightGrams.toFixed(1)}g` : "—"}
                </td>
                <td className="px-3.5 py-3 font-admin-mono text-sm tabular-nums text-admin-ink">
                  {product.pricePence !== null ? formatMoney(product.pricePence) : "—"}
                </td>
                <td className="px-3.5 py-3">
                  <StatusPill isActive={product.isActive} isBlocked={product.isBlocked} />
                </td>
                <td className="px-3.5 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      disabled
                      className="rounded-admin-control border border-admin-rule-strong bg-admin-surface px-2.5 py-1.25 text-xs font-medium text-admin-ink disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled
                      className="rounded-admin-control border border-[#e8cfcf] bg-admin-surface px-2.5 py-1.25 text-xs font-medium text-admin-danger disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-admin-rule px-3.5 py-2.75 text-sm text-admin-muted">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1.5">
            <PageLink href={buildHref(page - 1)} disabled={page <= 1}>
              Previous
            </PageLink>
            <PageLink href={buildHref(page + 1)} disabled={page >= totalPages}>
              Next
            </PageLink>
          </div>
        </div>
      )}
    </div>
  );
}
