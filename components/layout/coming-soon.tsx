import Link from "next/link";
import { Gem, ArrowLeft } from "lucide-react";

import { SITE } from "@/lib/site";
import { Button } from "@/components/ui/button";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="hero-vignette relative flex min-h-[70vh] items-center overflow-hidden text-cream">
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full border border-gold/15" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full border border-gold/10" />

      <div className="relative mx-auto max-w-2xl px-6 py-24 text-center">
        <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-gold/15 text-gold">
          <Gem className="size-8" />
        </span>
        <span className="mb-3 inline-block rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-gold-soft">
          Coming Soon
        </span>
        <h1 className="font-serif text-4xl font-bold sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-lg text-cream/70">{description}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="gold" size="lg">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline-light" size="lg">
            <a href={SITE.phoneHref}>Call {SITE.phone}</a>
          </Button>
        </div>

        <p className="mt-8 text-sm text-cream/50">
          In the meantime, visit us at {SITE.address.full} — {SITE.hours}.
        </p>
      </div>
    </section>
  );
}
