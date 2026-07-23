import Link from "next/link";
import { ShieldCheck, TrendingUp, Landmark, Phone, MessageCircle } from "lucide-react";

import { getGoldPrices, formatGBP } from "@/lib/gold";
import { SITE } from "@/lib/site";
import { BullionImage } from "@/components/bullion/bullion-image";

export const metadata = {
  title: "Gold Bullion",
  description:
    "Buy investment-grade 24k gold bullion at Chacha Jewellers, Oldham — bars and coins from 1 gram to 1 kilo, priced to the live gold market.",
};

// Available bullion weights. Prices are derived from the live 24k gold rate
// (see below) so they track the market automatically.
const WEIGHTS: { label: string; grams: number; image?: string }[] = [
  { label: "1 g", grams: 1, image: "/bullion/1g.jpg" },
  { label: "2.5 g", grams: 2.5, image: "/bullion/2.5g.jpg" },
  { label: "5 g", grams: 5, image: "/bullion/5g.jpg" },
  { label: "10 g", grams: 10, image: "/bullion/10g.jpg" },
  { label: "20 g", grams: 20, image: "/bullion/20g.jpg" },
  { label: "1 oz", grams: 31.1035, image: "/bullion/1oz.jpg" },
  { label: "50 g", grams: 50, image: "/bullion/50g.jpg" },
  { label: "100 g", grams: 100, image: "/bullion/100g.jpg" },
  { label: "250 g", grams: 250, image: "/bullion/250g.jpg" },
  { label: "500 g", grams: 500, image: "/bullion/500g.jpg" },
  { label: "1 kg", grams: 1000, image: "/bullion/1kg.jpg" },
];

/**
 * Placeholder dealer premium over the live spot rate. Smaller bars carry a
 * higher premium, as is standard in the bullion market. Adjust or remove these
 * factors once the client provides real bullion pricing.
 */
function premiumFactor(grams: number): number {
  if (grams <= 5) return 1.12;
  if (grams <= 20) return 1.08;
  if (grams <= 100) return 1.05;
  return 1.035;
}

const TRUST = [
  {
    icon: ShieldCheck,
    title: "999.9 fine gold",
    text: "Investment-grade 24k bars and coins.",
  },
  {
    icon: TrendingUp,
    title: "Live-linked pricing",
    text: "Prices move with the daily gold market.",
  },
  {
    icon: Landmark,
    title: "Buy with confidence",
    text: "Reserve online, complete securely in-store.",
  },
];

export default async function BullionsPage() {
  const data = await getGoldPrices();
  const spot = data.current.gold24k; // 24k £/g

  return (
    <div>
      {/* Header */}
      <section className="hero-vignette text-cream">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold">
            Investment Gold
          </p>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">
            Gold Bullion
          </h1>
          <p className="mt-4 max-w-2xl text-cream/70">
            Own a piece of enduring value. Our investment-grade 24k gold bullion
            — from a 1&nbsp;gram bar to a full kilo — lets you buy physical gold
            at prices that track the live market.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm text-gold-soft">
            <TrendingUp className="size-4 text-gold" />
            Today&rsquo;s gold rate:{" "}
            <span className="font-semibold text-gold">{formatGBP(spot)}/g</span>{" "}
            (24k)
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border bg-cream-soft/60">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 sm:grid-cols-3">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
                <t.icon className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground">{t.title}</p>
                <p className="text-sm text-muted-foreground">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bullion grid */}
      <section className="bg-cream py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {WEIGHTS.map((w) => {
              const price = Math.round(w.grams * spot * premiumFactor(w.grams));
              return (
                <div
                  key={w.label}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg"
                >
                  {/* Product visual (photo if available, else a gold-bar panel) */}
                  <div className="relative aspect-square overflow-hidden bg-cream-soft">
                    <BullionImage src={w.image} alt={`${w.label} 24k gold bullion bar`} />
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-serif text-xl font-bold text-foreground">
                        {w.label}
                      </h3>
                      <span className="text-xs font-semibold uppercase tracking-wide text-gold-deep">
                        24k
                      </span>
                    </div>
                    <p className="mt-1 font-serif text-lg font-bold text-maroon">
                      {formatGBP(price, 0)}
                    </p>
                    <Link
                      href="/contact"
                      className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-charcoal px-3 py-2 text-xs font-semibold text-cream transition-colors hover:bg-charcoal-soft"
                    >
                      Enquire to Buy
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-8 max-w-3xl text-sm text-muted-foreground">
            Prices are indicative and move with the live gold market, so the
            figure you pay is confirmed at the time of purchase in-store. Larger
            quantities and other coins or bars are available on request — just
            get in touch.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-maroon-deep via-maroon to-maroon-deep text-cream">
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full border border-gold/15" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full border border-gold/10" />
        <div className="relative mx-auto max-w-3xl px-6 py-16 text-center lg:py-20">
          <h2 className="font-serif text-3xl font-bold sm:text-4xl">
            Ready to invest in gold?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/80">
            Reserve any bar or coin, or ask us anything about buying investment
            gold — we&rsquo;re happy to guide you, with no pressure.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-gold-soft"
            >
              <MessageCircle className="size-4" />
              Contact us
            </Link>
            <a
              href={SITE.phoneHref}
              className="inline-flex items-center gap-2 rounded-full border border-cream/30 px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:border-gold hover:text-gold"
            >
              <Phone className="size-4" />
              Call {SITE.phone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
