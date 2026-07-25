"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { STORE_GALLERY } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * "Look inside" gallery — one showroom photo shown at a time at its natural
 * shape (contain-fit, never cropped), with a title + short paragraph that
 * describes the image on screen. Navigate with the arrows or the dots.
 */
export function StoreGallery() {
  const [active, setActive] = useState(0);
  const last = STORE_GALLERY.length - 1;

  const go = useCallback(
    (i: number) => setActive(Math.max(0, Math.min(last, i))),
    [last]
  );

  return (
    <section className="bg-maroon py-8 text-cream lg:py-10">
      <div className="mx-auto mb-4 max-w-7xl px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Step inside our store
        </p>
      </div>

      {/* Image stage — spans the section's content width (not the raw viewport,
          so the source photos aren't upscaled and stay crisp/natural). Height
          is a viewport-proportional aspect ratio, so it covers a consistent
          area at any zoom level and scales the same on phones/tablets/desktop. */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl border border-gold/20 bg-maroon-deep/40 shadow-xl sm:aspect-[16/9] lg:aspect-[5/2]">
          {STORE_GALLERY.map((img, i) => (
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority={i === 0}
              className={cn(
                "object-cover transition-opacity duration-500",
                i === active ? "opacity-100" : "opacity-0"
              )}
            />
          ))}
        </div>

        {/* Previous */}
        <button
          type="button"
          aria-label="Previous image"
          onClick={() => go(active - 1)}
          disabled={active === 0}
          className={cn(
            "absolute left-7 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-charcoal/70 text-cream backdrop-blur transition-all hover:bg-gold hover:text-charcoal sm:left-10 sm:size-12",
            active === 0 && "cursor-not-allowed opacity-30 hover:bg-charcoal/70 hover:text-cream"
          )}
        >
          <ChevronLeft className="size-5 sm:size-6" />
        </button>

        {/* Next */}
        <button
          type="button"
          aria-label="Next image"
          onClick={() => go(active + 1)}
          disabled={active === last}
          className={cn(
            "absolute right-7 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-charcoal/70 text-cream backdrop-blur transition-all hover:bg-gold hover:text-charcoal sm:right-10 sm:size-12",
            active === last && "cursor-not-allowed opacity-30 hover:bg-charcoal/70 hover:text-cream"
          )}
        >
          <ChevronRight className="size-5 sm:size-6" />
        </button>
      </div>

      {/* Dots */}
      <div className="mt-4 flex justify-center gap-2">
        {STORE_GALLERY.map((img, i) => (
          <button
            key={img.src}
            type="button"
            aria-label={`Go to image ${i + 1}`}
            onClick={() => go(i)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === active ? "w-6 bg-gold" : "w-2 bg-cream/30 hover:bg-cream/50"
            )}
          />
        ))}
      </div>
    </section>
  );
}
