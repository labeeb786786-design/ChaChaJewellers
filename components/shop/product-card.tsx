import Link from "next/link";
import { Weight, Ruler, ArrowUpRight } from "lucide-react";

import type { ShopProduct } from "@/lib/catalog";
import { priceLabel, weightLabel } from "@/lib/catalog";
import { ProductImage } from "@/components/shop/product-image";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  priority = false,
  compact = false,
}: {
  product: ShopProduct;
  priority?: boolean;
  /** Smaller card used on the homepage (Shop page keeps the full size). */
  compact?: boolean;
}) {
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl"
    >
      {/* Image with zoom-on-hover (landscape on the homepage, portrait on Shop) */}
      <div
        className={cn(
          "relative overflow-hidden bg-cream-soft",
          compact ? "aspect-[4/3]" : "aspect-[4/5]"
        )}
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          gradient={product.gradient}
          name={product.name}
          priority={priority}
        />
        {product.karat && (
          <span
            className={cn(
              "absolute z-10 rounded-full bg-charcoal/85 font-semibold uppercase tracking-wide text-gold backdrop-blur",
              compact
                ? "left-2 top-2 px-2 py-0.5 text-[10px]"
                : "left-3 top-3 px-3 py-1 text-xs"
            )}
          >
            {product.karat} Gold
          </span>
        )}
      </div>

      {/* Details */}
      <div className={cn("flex flex-1 flex-col", compact ? "p-3.5" : "p-5")}>
        <h3
          className={cn(
            "font-serif font-semibold text-foreground",
            compact ? "text-base leading-snug" : "text-xl"
          )}
        >
          {product.name}
        </h3>
        <p
          className={cn(
            "line-clamp-2 leading-relaxed text-muted-foreground",
            compact ? "mt-1 text-xs" : "mt-1.5 text-sm"
          )}
        >
          {product.description}
        </p>

        <div
          className={cn(
            "flex flex-wrap text-muted-foreground",
            compact
              ? "mt-2.5 gap-x-3 gap-y-1 text-[11px]"
              : "mt-4 gap-x-4 gap-y-1.5 text-xs"
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <Weight className="size-3.5 text-gold-deep" />
            {weightLabel(product)}
          </span>
          {product.measure && (
            <span className="inline-flex items-center gap-1.5">
              <Ruler className="size-3.5 text-gold-deep" />
              {product.measure.label} {product.measure.value}
            </span>
          )}
        </div>

        <div
          className={cn(
            "flex items-end justify-between border-t border-border/70",
            compact ? "mt-3 pt-3" : "mt-4 pt-4"
          )}
        >
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Price
            </p>
            <p
              className={cn(
                "font-serif font-bold text-maroon",
                compact ? "text-lg" : "text-2xl"
              )}
            >
              {priceLabel(product)}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 font-semibold text-gold-deep transition-colors group-hover:text-maroon",
              compact ? "text-xs" : "text-sm"
            )}
          >
            View
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
