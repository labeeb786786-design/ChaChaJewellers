import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp } from "lucide-react";

import goldData from "@/lib/data/gold-prices.json";
import { formatGBP } from "@/lib/gold";

/**
 * Compact homepage teaser for gold bullion — a short pitch, a reference 24k
 * rate (reusing the same mock gold data as the price widget) and a CTA to the
 * full /bullions page. Deliberately not the full showcase.
 */
export function Bullions() {
  const spot = goldData.current.gold24k; // 24k £/g reference

  return (
    <section className="bg-maroon py-8 text-cream lg:py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Investment Gold
            </p>
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">
              More than jewellery — own gold bullion
            </h2>
            <p className="mt-3 max-w-lg text-sm text-cream/70 sm:text-base">
              Beyond our jewellery, we offer investment-grade 24k gold bullion —
              from 1&nbsp;gram bars to a full kilo. A timeless way to own and
              protect your wealth, priced to the live gold market.
            </p>
            <Link
              href="/bullions"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-gold-soft"
            >
              Explore Gold Bullion
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-gold/25 bg-maroon-deep p-5">
            <Link
              href="/bullions"
              aria-label="View gold bullion"
              className="group relative mb-4 block aspect-square overflow-hidden rounded-xl border border-gold/20 bg-gradient-to-br from-cream to-cream-soft"
            >
              <Image
                src="/bullion/50g.jpg"
                alt="50g PAMP gold bullion bar"
                fill
                sizes="(max-width: 1024px) 90vw, 22rem"
                className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute bottom-2 left-2 rounded-full bg-maroon-deep/90 px-2.5 py-1 text-xs font-semibold text-gold backdrop-blur">
                50g · 999.9 fine
              </span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-cream/70">
              <TrendingUp className="size-4 text-gold" />
              Today&rsquo;s gold rate
            </div>
            <p className="mt-1 font-serif text-2xl font-bold text-gold">
              {formatGBP(spot)}
              <span className="ml-1 text-sm font-normal text-cream/50">
                /g (24k)
              </span>
            </p>
            <p className="mt-2 text-sm text-cream/60">
              Bars &amp; coins from 1g to 1kg, priced to the live market.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
