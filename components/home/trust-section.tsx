import { ShieldCheck, Users, BadgePercent, Clock4 } from "lucide-react";

import type { Review } from "@/lib/reviews";
import { ReviewsMarquee } from "@/components/home/reviews-marquee";
import { SITE } from "@/lib/site";

const POINTS = [
  {
    icon: ShieldCheck,
    title: "Assured Purity",
    body: "Every piece is clearly marked for karat and weight, so you know exactly what you're buying — quality you can see and feel.",
  },
  {
    icon: Users,
    title: "Family-Run Trust",
    body: "A local, family-run jeweller serving Oldham's community — the kind of personal service you only get from people who know their craft.",
  },
  {
    icon: BadgePercent,
    title: "Fair, Honest Pricing",
    body: "Transparent gold rates and competitive prices whether you're buying a bridal set or selling old gold. No pressure, no surprises.",
  },
  {
    icon: Clock4,
    title: "Same-Day Valuations",
    body: "Bring your gold in and we'll weigh, test and value it while you wait — a fast, friendly service with no obligation.",
  },
];

/**
 * Trust section — merges the "Why Choose Us" trust points with the customer
 * reviews marquee into a single cream section (shared background/container).
 */
export function TrustSection({ reviews }: { reviews: Review[] }) {
  return (
    <section className="bg-cream py-8 lg:py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-6 max-w-2xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold-deep">
            Why Chacha Jewellers
          </p>
          <h2 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
            A jeweller you can trust
          </h2>
          <p className="mt-2 text-sm font-medium text-foreground/70 sm:text-base">
            Rated{" "}
            <span className="font-semibold text-gold-deep">
              {SITE.rating.stars}★
            </span>{" "}
            across {SITE.rating.count} Google reviews
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((p) => (
            <div
              key={p.title}
              className="group rounded-2xl border border-border bg-card p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-lg"
            >
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-gold/15 to-gold/5 text-gold-deep transition-colors group-hover:from-gold/25">
                <p.icon className="size-6" />
              </div>
              <h3 className="font-serif text-base font-semibold text-foreground">
                {p.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {p.body}
              </p>
            </div>
          ))}
        </div>

        {/* Transitional line into the reviews (small/light, not a heading) */}
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm font-medium italic text-foreground/75 sm:text-base">
          Don&rsquo;t just take our word for it — here&rsquo;s what our customers
          have to say.
        </p>
      </div>

      {/* Reviews marquee — same section, flows directly beneath the line (no divider) */}
      <div className="mt-6 lg:mt-8">
        <ReviewsMarquee reviews={reviews} />
      </div>
    </section>
  );
}
