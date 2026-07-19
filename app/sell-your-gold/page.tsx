import Link from "next/link";
import {
  ShieldCheck,
  Clock4,
  HandCoins,
  HelpCircle,
  ChevronRight,
  Phone,
} from "lucide-react";

import { getGoldPrices } from "@/lib/gold";
import { GoldCalculator } from "@/components/sell/gold-calculator";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Sell Your Gold",
  description:
    "Get an instant estimate for your gold with Chacha Jewellers, Oldham. Honest, same-day valuations for scrap gold and gold bars.",
};

const REASSURANCE = [
  { icon: Clock4, text: "Same-day, no-obligation valuations" },
  { icon: ShieldCheck, text: "Weighed & tested in front of you" },
  { icon: HandCoins, text: "Fair rates you can rely on" },
];

// FAQ teasers — every link points at the canonical /faq route so the future
// FAQ page only needs to exist once and all mentions resolve to it.
const FAQS = [
  "What's the difference between selling scrap gold and gold bars?",
  "How is my valuation worked out?",
  "Do I need an appointment to sell my gold?",
  "What should I bring with me to the store?",
];

export default async function SellYourGoldPage() {
  const data = await getGoldPrices();

  return (
    <div className="bg-luxe-gold min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-16 lg:py-20">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold-deep">
            Sell Your Gold
          </p>
          <h1 className="font-serif text-4xl font-bold text-charcoal sm:text-5xl">
            What&rsquo;s your gold worth?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-foreground/70">
            Answer three quick questions for an instant estimate of what
            we&rsquo;ll pay for your gold. No details required, no obligation.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground/70">
            {REASSURANCE.map((r) => (
              <span key={r.text} className="inline-flex items-center gap-1.5">
                <r.icon className="size-4 text-gold-deep" />
                {r.text}
              </span>
            ))}
          </div>
        </div>

        {/* Calculator */}
        <GoldCalculator spot24kPerGram={data.current.gold24k} />

        {/* Support / FAQ */}
        <section className="mx-auto mt-14 max-w-xl">
          <div className="rounded-3xl border border-gold/25 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
                <HelpCircle className="size-6" />
              </span>
              <div>
                <h2 className="font-serif text-xl font-semibold text-charcoal">
                  Scrap or gold bars? Still unsure?
                </h2>
                <p className="text-sm text-foreground/60">
                  Common questions about selling your gold to us.
                </p>
              </div>
            </div>

            <ul className="mt-5 divide-y divide-border">
              {FAQS.map((q) => (
                <li key={q}>
                  <Link
                    href="/faq"
                    className="group flex items-center justify-between gap-3 py-3 text-sm text-foreground/80 transition-colors hover:text-maroon"
                  >
                    <span>{q}</span>
                    <ChevronRight className="size-4 shrink-0 text-gold-deep transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/faq"
                className="inline-flex items-center gap-2 rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-charcoal-soft"
              >
                <HelpCircle className="size-4" />
                Read our FAQs
              </Link>
              <a
                href={SITE.phoneHref}
                className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-5 py-2.5 text-sm font-semibold text-gold-deep transition-colors hover:bg-gold/10"
              >
                <Phone className="size-4" />
                Call for support · {SITE.phone}
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
