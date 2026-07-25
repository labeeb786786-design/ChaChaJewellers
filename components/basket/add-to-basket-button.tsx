"use client";

import { useRef, useState } from "react";
import { ShoppingBag, Check } from "lucide-react";

import type { ShopProduct } from "@/lib/catalog";
import { useBasket } from "@/components/basket/basket-provider";
import { cn } from "@/lib/utils";

/**
 * "Add to Basket" action. Adds the product (with quantity) to basket state and
 * briefly flips to an "Added" confirmation. Used on shop cards (where the whole
 * card is a link, so `stopNavigation` prevents the click from following it) and
 * on the product page.
 */
export function AddToBasketButton({
  product,
  quantity = 1,
  stopNavigation = false,
  fullWidth = false,
  size = "sm",
  className,
  onAdded,
}: {
  product: ShopProduct;
  quantity?: number;
  /** Prevent the click bubbling to a parent link (shop cards). */
  stopNavigation?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "lg";
  className?: string;
  onAdded?: () => void;
}) {
  const { addItem } = useBasket();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleClick(e: React.MouseEvent) {
    if (stopNavigation) {
      e.preventDefault();
      e.stopPropagation();
    }
    addItem(product, quantity);
    setAdded(true);
    onAdded?.();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Add ${product.name} to basket`}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all",
        size === "lg" ? "px-6 py-3 text-sm" : "px-4 py-2 text-xs",
        fullWidth && "w-full",
        added
          ? "bg-gold text-charcoal"
          : "bg-charcoal text-cream hover:bg-charcoal-soft",
        className
      )}
    >
      {added ? (
        <>
          <Check className={size === "lg" ? "size-5" : "size-4"} />
          Added
        </>
      ) : (
        <>
          <ShoppingBag className={size === "lg" ? "size-5" : "size-4"} />
          Add to Basket
        </>
      )}
    </button>
  );
}
