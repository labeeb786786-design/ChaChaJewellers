"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { ShopProduct } from "@/lib/catalog";
import { ProductCard } from "@/components/shop/product-card";
import { cn } from "@/lib/utils";

/**
 * Homepage product row: a full-width horizontal scroller showing ~3 landscape
 * cards at a time, with the rest reachable by scrolling (native touch/trackpad
 * swipe, plus arrow buttons on desktop). Works identically on any screen size.
 */
export function ProductScroller({ products }: { products: ShopProduct[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const gap = 16; // matches gap-4
    const amount = (first?.clientWidth ?? el.clientWidth * 0.8) + gap;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Desktop arrows */}
      <button
        type="button"
        aria-label="Scroll to previous products"
        onClick={() => scrollByCard(-1)}
        disabled={!canLeft}
        className={cn(
          "absolute -left-4 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-cream text-maroon shadow-md transition-all hover:bg-gold hover:text-charcoal lg:flex",
          !canLeft && "pointer-events-none opacity-0"
        )}
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        aria-label="Scroll to more products"
        onClick={() => scrollByCard(1)}
        disabled={!canRight}
        className={cn(
          "absolute -right-4 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-cream text-maroon shadow-md transition-all hover:bg-gold hover:text-charcoal lg:flex",
          !canRight && "pointer-events-none opacity-0"
        )}
      >
        <ChevronRight className="size-5" />
      </button>

      {/* Scroll track */}
      <div
        ref={ref}
        onScroll={update}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
      >
        {products.map((product) => (
          <div
            key={product.slug}
            className="shrink-0 snap-start basis-[80%] sm:basis-[46%] lg:basis-[calc((100%-2rem)/3)]"
          >
            <ProductCard product={product} compact />
          </div>
        ))}
      </div>
    </div>
  );
}
