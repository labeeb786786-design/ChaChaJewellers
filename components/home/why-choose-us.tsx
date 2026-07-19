import { ShieldCheck, Users, BadgePercent, Clock4 } from "lucide-react";

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

export function WhyChooseUs() {
  return (
    <section className="bg-cream py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold-deep">
            Why Chacha Jewellers
          </p>
          <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
            A jeweller you can trust
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((p) => (
            <div
              key={p.title}
              className="group rounded-2xl border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-lg"
            >
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-gold/15 to-gold/5 text-gold-deep transition-colors group-hover:from-gold/25">
                <p.icon className="size-7" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
