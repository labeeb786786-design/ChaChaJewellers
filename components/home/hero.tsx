import Link from "next/link";
import { Star, ShieldCheck, Scale, Award } from "lucide-react";

import { SITE } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  InstagramIcon,
  WhatsAppIcon,
  FacebookIcon,
} from "@/components/icons/social";
import { StoreBackdrop } from "@/components/home/store-backdrop";
import { StoreCarousel } from "@/components/home/store-carousel";

const ASSURANCES = [
  { icon: ShieldCheck, label: "Guaranteed Purity" },
  { icon: Scale, label: "Transparent Valuations" },
  { icon: Award, label: "Certified Craftsmanship" },
];

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

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:pt-28">
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
            The North&rsquo;s home of fine South Asian gold — exquisite jewellery
            in radiant 22k gold, custom jewellery crafted for the moments
            you&rsquo;ll remember.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="gold" size="lg">
              <Link href="/shop">Shop Collection</Link>
            </Button>
            <Button asChild variant="outline-light" size="lg">
              <Link href="/sell-your-gold">Sell Your Gold</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-cream/70">
            <a
              href={SITE.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-gold"
            >
              <InstagramIcon className="size-4" />
              Instagram
            </a>
            <span aria-hidden="true" className="text-cream/25">
              |
            </span>
            <a
              href={SITE.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-gold"
            >
              <WhatsAppIcon className="size-4" />
              WhatsApp
            </a>
            <span aria-hidden="true" className="text-cream/25">
              |
            </span>
            <a
              href={SITE.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-gold"
            >
              <FacebookIcon className="size-4" />
              Facebook
            </a>
          </div>
        </div>

        {/* Hero visual — scrollable carousel of real store photos */}
        <div className="relative z-10">
          <StoreCarousel />
        </div>
      </div>

      {/* Assurance trust bar — spans the bottom of the hero, above the next section */}
      <div className="relative z-10 mx-auto mt-14 max-w-7xl px-6 pb-20 lg:mt-20 lg:pb-24">
        <div className="grid grid-cols-3 gap-4 border-t border-cream/15 pt-10 sm:gap-8 lg:pt-14">
          {ASSURANCES.map((a) => (
            <div
              key={a.label}
              className="flex flex-col items-center gap-3 text-center"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-gold/15 text-gold sm:size-16">
                <a.icon className="size-7 sm:size-8" />
              </span>
              <span className="text-sm font-semibold text-cream sm:text-base lg:text-lg">
                {a.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
