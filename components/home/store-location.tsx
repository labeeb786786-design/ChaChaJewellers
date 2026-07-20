import { MapPin, Phone, Clock, Navigation } from "lucide-react";

import { SITE } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { OpeningHours } from "@/components/home/opening-hours";

export function StoreLocation() {
  return (
    <section className="bg-cream py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold-deep">
            Visit Our Showroom
          </p>
          <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
            Find us in Oldham
          </h2>
          <p className="mt-3 text-muted-foreground">
            Open 7 days a week. Pop in to browse the collection, talk bridal
            gold, or get a same-day valuation.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          {/* Map */}
          <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
            <iframe
              title="Chacha Jewellers location map"
              src={SITE.mapsEmbedSrc}
              className="h-full min-h-80 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-gold-deep" />
                <div>
                  <p className="font-semibold text-foreground">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {SITE.address.line1}, {SITE.address.city},{" "}
                    {SITE.address.postcode}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-3">
                <Phone className="mt-0.5 size-5 shrink-0 text-gold-deep" />
                <div>
                  <p className="font-semibold text-foreground">Phone</p>
                  <a
                    href={SITE.phoneHref}
                    className="text-sm text-muted-foreground transition-colors hover:text-maroon"
                  >
                    {SITE.phone}
                  </a>
                </div>
              </div>
              <Button asChild variant="maroon" size="sm" className="mt-5 w-full">
                <a
                  href={SITE.mapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="size-4" />
                  Get Directions
                </a>
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="size-5 text-gold-deep" />
                <p className="font-semibold text-foreground">Opening Hours</p>
              </div>
              <OpeningHours />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
