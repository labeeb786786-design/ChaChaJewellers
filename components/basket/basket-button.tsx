"use client";

import { ShoppingBag } from "lucide-react";

import { useBasket } from "@/components/basket/basket-provider";
import { cn } from "@/lib/utils";

/**
 * Header basket icon. Opens the slide-out panel and shows a gold count badge
 * when the basket has items (hidden at zero).
 */
export function BasketButton({ className }: { className?: string }) {
  const { count, openBasket } = useBasket();

  return (
    <button
      type="button"
      onClick={openBasket}
      aria-label={`Open basket${count > 0 ? ` (${count} item${count === 1 ? "" : "s"})` : ""}`}
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-md text-maroon transition-colors hover:text-gold-deep",
        className
      )}
    >
      <ShoppingBag className="size-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold leading-[18px] text-charcoal">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
