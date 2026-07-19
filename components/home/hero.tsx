import Link from "next/link";
import { Star } from "lucide-react";

import { SITE } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { InstagramIcon } from "@/components/icons/social";
import { StoreBackdrop } from "@/components/home/store-backdrop";
import { StoreCarousel } from "@/components/home/store-carousel";

/*
 * Tagline options (chosen: #1). Swap in place if the client prefers another:
 *   1. "Generations of trust, cast in gold." (chosen — heritage + trust)
 *   2. "Where every occasion is set in gold."
 *   3. "Bridal gold, crafted for a lifetime."
 */

export function Hero() {
  return (
    <section className="hero-vignette relative overflow-hidden text-cream">
      {/* Store photo backdrop (falls back to the vignette if missing) */}
      <StoreBackdrop />
      {/* Darkening overlay so the copy stays readable over the photo */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-charcoal/95 via-charcoal/85 to-charcoal/60" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-charcoal/70 via-transparent to-charcoal/35" />

      {/* decorative gold rings */}
      <div className="pointer-events-none absolute -right-24 -top-24 z-[2] size-96 rounded-full border border-gold/20" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 z-[2] size-96 rounded-full border border-gold/10" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-xs font-medium text-gold-soft">
            <Star className="size-3.5 fill-gold text-gold" />
            {SITE.rating.stars}★ · {SITE.rating.count} Google reviews
          </div>

          <h1 className="font-serif text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Chacha <span className="text-gold-gradient">Jewellers</span>
          </h1>
          <p className="mt-4 font-serif text-xl italic text-gold-soft/90 sm:text-2xl">
            Generations of trust, cast in gold.
          </p>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-cream/70 sm:text-lg">
            Oldham&rsquo;s home of fine South Asian gold — exquisite bridal sets,
            bangles, rings and earrings in radiant 22k gold, crafted for the
            moments you&rsquo;ll remember forever.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="gold" size="lg">
              <Link href="/shop">Shop Collection</Link>
            </Button>
            <Button asChild variant="outline-light" size="lg">
              <Link href="/sell-your-gold">Sell Your Gold</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-cream/60">
            <span>{SITE.hours}</span>
            <a
              href={SITE.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-gold"
            >
              <InstagramIcon className="size-4" />
              {SITE.instagram.followers} followers
            </a>
          </div>
        </div>

        {/* Hero visual — scrollable carousel of real store photos */}
        <div className="relative z-10">
          <StoreCarousel />
        </div>
      </div>
    </section>
  );
}
