"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Store } from "lucide-react";

import { STORE_IMAGES } from "@/lib/store";

/**
 * Hero carousel of close-up store photos with prev/next arrows and dots.
 * Each slide falls back to a branded panel if its image file is missing.
 */
export function StoreCarousel() {
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const count = STORE_IMAGES.length;

  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-gold/30 shadow-2xl">
        {/* Sliding track */}
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {STORE_IMAGES.map((img, i) => (
            <div key={img.src} className="relative h-full w-full shrink-0">
              {broken[i] ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-maroon via-maroon-deep to-charcoal text-cream">
                  <Store className="size-8 opacity-80" />
                  <span className="text-xs uppercase tracking-widest text-cream/70">
                    Store photo
                  </span>
                </div>
              ) : (
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 1024px) 90vw, 28rem"
                  priority={i === 0}
                  className="object-cover"
                  onError={() => setBroken((b) => ({ ...b, [i]: true }))}
                />
              )}
            </div>
          ))}
        </div>

        {/* Legibility gradient + caption */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-charcoal/80 to-transparent" />
        <div className="absolute inset-x-4 bottom-4 z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-soft">
            Inside Our Store
          </p>
          <p className="mt-0.5 font-serif text-sm text-cream">
            {STORE_IMAGES[index].alt}
          </p>
        </div>

        {/* Arrows */}
        <button
          type="button"
          aria-label="Previous photo"
          onClick={() => go(-1)}
          className="absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-charcoal/55 text-cream backdrop-blur transition-colors hover:bg-gold hover:text-charcoal"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Next photo"
          onClick={() => go(1)}
          className="absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-charcoal/55 text-cream backdrop-blur transition-colors hover:bg-gold hover:text-charcoal"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="mt-4 flex justify-center gap-2">
        {STORE_IMAGES.map((img, i) => (
          <button
            key={img.src}
            type="button"
            aria-label={`Go to photo ${i + 1}`}
            onClick={() => setIndex(i)}
            className={
              "h-2 rounded-full transition-all " +
              (i === index ? "w-6 bg-gold" : "w-2 bg-cream/30 hover:bg-cream/50")
            }
          />
        ))}
      </div>
    </div>
  );
}
