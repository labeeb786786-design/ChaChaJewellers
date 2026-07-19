import Link from "next/link";
import { Info } from "lucide-react";

import { getGoldPrices, formatGBP } from "@/lib/gold";
import { PriceChart } from "@/components/precious-metals/price-chart";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export const metadata = { title: "Precious Metals & Prices" };

export default async function PreciousMetalsPage() {
  const data = await getGoldPrices();

  const rows = [
    { label: "Gold 24k (999)", value: data.current.gold24k },
    { label: "Gold 22k (916)", value: data.current.gold22k },
    { label: "Gold 18k (750)", value: data.current.gold18k ?? 0 },
    { label: "Silver", value: data.current.silver },
  ];

  return (
    <div className="bg-charcoal text-cream">
      <section className="hero-vignette border-b border-cream/10">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold">
            Precious Metals
          </p>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">
            Gold &amp; Silver Prices
          </h1>
          <p className="mt-4 max-w-2xl text-cream/70">
            Live-style reference prices for the South Asian gold market, in GBP
            per gram. Use them as a guide when buying a bridal set or selling old
            gold — then pop in for a firm, same-day quote.
          </p>
        </div>
      </section>

      <section className="py-14 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1fr_1.4fr]">
          {/* Current prices table */}
          <div className="rounded-2xl border border-cream/10 bg-charcoal-soft p-6">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-serif text-xl font-semibold">Today&rsquo;s Prices</h2>
              <span className="text-xs text-cream/40">per gram</span>
            </div>
            <ul className="divide-y divide-cream/10">
              {rows.map((r) => (
                <li key={r.label} className="flex items-center justify-between py-3.5">
                  <span className="text-cream/75">{r.label}</span>
                  <span className="font-serif text-lg font-bold text-gold">
                    {formatGBP(r.value)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-2.5">
              <Button asChild variant="gold" size="sm">
                <Link href="/sell-your-gold">Sell Your Gold</Link>
              </Button>
              <Button asChild variant="outline-light" size="sm">
                <a href={SITE.phoneHref}>Call for a Quote</a>
              </Button>
            </div>
          </div>

          {/* Chart */}
          <PriceChart data={data} />
        </div>

        <div className="mx-auto mt-8 max-w-7xl px-6">
          <div className="flex items-start gap-3 rounded-xl border border-gold/20 bg-gold/5 p-4 text-sm text-cream/60">
            <Info className="mt-0.5 size-4 shrink-0 text-gold" />
            <p>
              <span className="font-semibold text-cream/80">Demo notice:</span>{" "}
              prices shown are illustrative mock data, not a live market feed. In
              production this page would pull from a real metals API (with a
              secret API key, refreshed on a schedule). Final valuations are
              always confirmed in-store.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
