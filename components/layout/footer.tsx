import Link from "next/link";
import { Phone, MapPin, Clock, Star } from "lucide-react";

import { SITE, HEADER_LINKS } from "@/lib/site";
import { InstagramIcon, FacebookIcon } from "@/components/icons/social";

export function Footer() {
  return (
    <footer className="bg-charcoal text-cream/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="lg:col-span-1">
          <span className="font-serif text-2xl font-bold text-cream">
            Chacha Jewellers
          </span>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/60">
            A family-run home of South Asian gold jewellery in Oldham — bridal
            sets, bangles, rings and everyday gold, alongside trusted gold-buying
            and valuations.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-sm">
            <Star className="size-4 fill-gold text-gold" />
            <span className="font-semibold text-cream">{SITE.rating.stars}</span>
            <span className="text-cream/60">
              · {SITE.rating.count} Google reviews
            </span>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <a
              href={SITE.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex size-9 items-center justify-center rounded-full border border-cream/20 transition-colors hover:border-gold hover:text-gold"
            >
              <InstagramIcon className="size-4" />
            </a>
            <a
              href={SITE.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex size-9 items-center justify-center rounded-full border border-cream/20 transition-colors hover:border-gold hover:text-gold"
            >
              <FacebookIcon className="size-4" />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">
            Explore
          </h4>
          <ul className="space-y-2.5 text-sm">
            {HEADER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-cream/70 transition-colors hover:text-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/appointments"
                className="text-cream/70 transition-colors hover:text-gold"
              >
                Book an Appointment
              </Link>
            </li>
          </ul>
        </div>

        {/* Collections */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">
            Collections
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/shop?category=rings" className="text-cream/70 transition-colors hover:text-gold">
                Rings
              </Link>
            </li>
            <li>
              <Link href="/shop?category=bangles" className="text-cream/70 transition-colors hover:text-gold">
                Bangles
              </Link>
            </li>
            <li>
              <Link href="/shop?category=necklace-sets" className="text-cream/70 transition-colors hover:text-gold">
                Necklace Sets
              </Link>
            </li>
            <li>
              <Link href="/shop?category=earrings" className="text-cream/70 transition-colors hover:text-gold">
                Earrings
              </Link>
            </li>
          </ul>
        </div>

        {/* Visit us */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold">
            Visit Us
          </h4>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
              <span className="text-cream/70">{SITE.address.full}</span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-gold" />
              <a href={SITE.phoneHref} className="text-cream/70 transition-colors hover:text-gold">
                {SITE.phone}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-gold" />
              <span className="text-cream/70">{SITE.hours}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-cream/50 sm:flex-row">
          <p>
            © {2026} Chacha Jewellers. All rights reserved.
          </p>
          <p>
            {SITE.instagram.handle} · {SITE.instagram.followers} followers
          </p>
        </div>
      </div>
    </footer>
  );
}
