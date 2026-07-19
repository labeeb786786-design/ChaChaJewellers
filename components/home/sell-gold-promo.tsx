import Link from "next/link";
import { Coins, ShieldCheck, Scale, Recycle } from "lucide-react";

import { Button } from "@/components/ui/button";

// Reassuring, motivating points — no prices, just the reasons to sell.
const REASONS = [
  {
    icon: Coins,
    title: "Instant same-day cash",
    text: "Walk out with money in hand — no waiting, no posting your gold away.",
  },
  {
    icon: ShieldCheck,
    title: "Completely no-obligation",
    text: "Free, friendly valuations with zero pressure to sell.",
  },
  {
    icon: Scale,
    title: "Weighed & tested in front of you",
    text: "An honest, transparent process you can watch, start to finish.",
  },
  {
    icon: Recycle,
    title: "We buy it all",
    text: "Broken, scrap, old or unworn — every piece of gold is welcome.",
  },
];

export function SellGoldPromo() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-maroon-deep via-maroon to-maroon-deep py-20 text-cream lg:py-24">
      <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full border border-gold/15" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full border border-gold/10" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-2">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-gold/15 px-3.5 py-1.5 text-sm font-medium text-gold-soft">
            <Coins className="size-4" />
            Turn old gold into cash today
          </div>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl">
            Sell Your Gold Today
          </h2>
          <p className="mt-4 max-w-lg text-cream/80">
            Unworn bangles, broken chains, single earrings or old coins — bring
            them in and walk away with a fair price the same day. Our valuations
            are honest, transparent and always without obligation.
          </p>

          <div className="mt-8">
            <Button asChild variant="gold" size="lg">
              <Link href="/sell-your-gold">Get a Free Valuation</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md rounded-2xl border border-gold/25 bg-charcoal/40 p-6 backdrop-blur sm:p-7">
          <p className="text-sm font-medium uppercase tracking-wide text-gold-soft">
            Why sell your gold with us
          </p>
          <ul className="mt-5 space-y-4">
            {REASONS.map((r) => (
              <li key={r.title} className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <r.icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold text-cream">{r.title}</p>
                  <p className="text-sm text-cream/70">{r.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
