import Link from "next/link";
import { TrendingUp, ArrowUpRight } from "lucide-react";

import goldData from "@/lib/data/gold-prices.json";
import { formatGBP } from "@/lib/gold";
import { HeroPriceSparkline } from "@/components/home/hero-price-sparkline";

/*
 * Compact market widget embedded in the hero.
 *
 * Shows only Tola, 24k and Silver. The tola figure is derived from the 24k
 * gram rate (tola weight × 24k/g). No intermediate karat figure is calculated,
 * displayed or exposed here — the client keeps that internal to their markup.
 */
const TOLA_IN_GRAMS = 11.6638;

const goldPerGram = goldData.current.gold24k;
const silverPerGram = goldData.current.silver;
const tolaPrice = goldPerGram * TOLA_IN_GRAMS;

// 30-day trend, derived from the 24k history (first vs latest).
const history = goldData.history;
const firstRate = history[0]?.gold24k ?? goldPerGram;
const latestRate = history[history.length - 1]?.gold24k ?? goldPerGram;
const trendPct = firstRate ? ((latestRate - firstRate) / firstRate) * 100 : 0;

// Points for the mini trajectory chart — 24k gram rate only.
const sparkPoints = history.map((h) => ({
  date: new Date(h.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  }),
  value: h.gold24k,
}));

function PriceTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl bg-cream-soft px-3 py-3 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-serif text-lg font-bold text-charcoal sm:text-xl">
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

export function HeroPriceWidget() {
  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-gold/25 bg-charcoal/80 p-6 shadow-2xl backdrop-blur sm:p-7">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Today&rsquo;s Market
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-medium text-gold-soft">
          <TrendingUp className="size-3.5" />
          Up {trendPct.toFixed(1)}% (30d)
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <PriceTile label="Tola" value={formatGBP(tolaPrice, 0)} sub="per tola" />
        <PriceTile label="24k" value={formatGBP(goldPerGram)} sub="per gram" />
        <PriceTile label="Silver" value={formatGBP(silverPerGram)} sub="per gram" />
      </div>

      {/* 30-day trajectory (placeholder data — 24k gram rate) */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wide text-cream/50">
            30-day trend · 24k gold
          </p>
          <p className="text-[11px] text-cream/40">Illustrative</p>
        </div>
        <div className="mt-1.5">
          <HeroPriceSparkline points={sparkPoints} />
        </div>
      </div>

      <div className="mt-4 flex justify-end border-t border-cream/10 pt-3">
        <Link
          href="/precious-metals"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-gold transition-colors hover:text-gold-soft"
        >
          Full charts &amp; live rates
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
