import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { HOME_SERVICES as SERVICES } from "@/lib/services";

export function ServicesOverview() {
  return (
    <section className="bg-cream py-8 lg:py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold-deep">
              In-House Services
            </p>
            <h2 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
              More than a jewellery shop
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              From quick repairs to bespoke commissions, our workshop keeps your
              gold looking its best.
            </p>
          </div>
          <Button href="/services" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="group flex gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-lg"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-deep transition-colors group-hover:bg-gold group-hover:text-charcoal">
                <s.icon className="size-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold text-foreground">
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
      className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gold-deep transition-colors hover:text-gold"
    >
      View all services
      <ArrowUpRight className="size-4" />
    </Link>
  );
}
