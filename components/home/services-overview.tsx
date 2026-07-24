import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { HOME_SERVICES as SERVICES } from "@/lib/services";

export function ServicesOverview() {
  return (
    <section className="bg-charcoal py-20 text-cream lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold">
              In-House Services
            </p>
            <h2 className="font-serif text-3xl font-bold text-cream sm:text-4xl">
              More than a jewellery shop
            </h2>
            <p className="mt-3 text-cream/70">
              From quick repairs to bespoke commissions, our workshop keeps your
              gold looking its best.
            </p>
          </div>
          <Button href="/services" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="group flex gap-4 rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-lg"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-deep transition-colors group-hover:bg-gold group-hover:text-charcoal">
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
      </div>
    </section>
  );
}

function Button({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gold transition-colors hover:text-gold-soft"
    >
      View all services
      <ArrowUpRight className="size-4" />
    </Link>
  );
}
