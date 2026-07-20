import Link from "next/link";
import { Phone, MessageCircle, MapPin, Navigation, Sparkles } from "lucide-react";

import { SERVICES } from "@/lib/services";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Services",
  description:
    "Jewellery services at Chacha Jewellers, Oldham — repairs, ring resizing, cleaning, engraving, valuations, bespoke design, gold investment bullion, watch repairs and more.",
};

export default function ServicesPage() {
  return (
    <div>
      {/* Header */}
      <section className="hero-vignette text-cream">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold">
            In-House Services
          </p>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">
            Our Services
          </h1>
          <p className="mt-4 max-w-2xl text-cream/70">
            From quick repairs to bespoke commissions and gold investment, our
            workshop and team look after every part of your jewellery journey —
            with the care and craftsmanship you&rsquo;d expect from a family-run
            jeweller.
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="bg-cream py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className={
                  "group flex gap-4 rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-lg" +
                  // Center the lone last card in the middle column at the bottom.
                  (s.title === "Gold Part-Exchange" ? " lg:col-start-2" : "")
                }
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-maroon/10 text-maroon transition-colors group-hover:bg-maroon group-hover:text-cream">
                  <s.icon className="size-6" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Looking for something not listed here? Just ask — we&rsquo;re always
            happy to help.
          </p>
        </div>
      </section>

      {/* Call / Book CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-maroon-deep via-maroon to-maroon-deep text-cream">
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full border border-gold/15" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full border border-gold/10" />

        <div className="relative mx-auto max-w-3xl px-6 py-16 text-center lg:py-20">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-gold/15 px-3.5 py-1.5 text-sm font-medium text-gold-soft">
            <Sparkles className="size-4" />
            Getting started is easy
          </div>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl">
            Ready when you are
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/80">
            Most of our services are carried out in-store, many while you wait.
            There are three easy ways to get started:
          </p>

          {/* Three clear ways to access our services */}
          <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
            <Link
              href="/contact"
              className="group flex flex-col items-center gap-2 rounded-2xl border border-gold/25 bg-charcoal/25 p-5 text-center transition-colors hover:border-gold hover:bg-charcoal/40"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-gold text-charcoal">
                <MessageCircle className="size-5" />
              </span>
              <span className="font-serif text-base font-semibold text-cream">
                Contact us
              </span>
              <span className="text-xs text-cream/70">
                Call, WhatsApp or message us
              </span>
            </Link>

            <a
              href={SITE.phoneHref}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-gold/25 bg-charcoal/25 p-5 text-center transition-colors hover:border-gold hover:bg-charcoal/40"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-gold text-charcoal">
                <Phone className="size-5" />
              </span>
              <span className="font-serif text-base font-semibold text-cream">
                Call us
              </span>
              <span className="text-xs text-cream/70">{SITE.phone}</span>
            </a>

            <a
              href={SITE.mapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-2 rounded-2xl border border-gold/25 bg-charcoal/25 p-5 text-center transition-colors hover:border-gold hover:bg-charcoal/40"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-gold text-charcoal">
                <MapPin className="size-5" />
              </span>
              <span className="font-serif text-base font-semibold text-cream">
                Visit in-store
              </span>
              <span className="text-xs text-cream/70">
                {SITE.address.full}
              </span>
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-cream/70">
            <span>{SITE.hours}</span>
            <a
              href={SITE.mapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-gold transition-colors hover:text-gold-soft"
            >
              <Navigation className="size-4" />
              Get Directions
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
