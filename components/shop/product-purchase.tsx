"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

import type { ShopProduct } from "@/lib/catalog";
import { AddToBasketButton } from "@/components/basket/add-to-basket-button";
import { useBasket } from "@/components/basket/basket-provider";

/**
 * Product-page buy controls: a quantity stepper plus the Add to Basket action.
 * Adding opens the basket drawer as confirmation.
 */
export function ProductPurchase({ product }: { product: ShopProduct }) {
  const [qty, setQty] = useState(1);
  const { openBasket } = useBasket();

  return (
    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="inline-flex items-center justify-between rounded-full border border-border bg-card">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="Decrease quantity"
          className="inline-flex size-11 items-center justify-center rounded-full text-foreground/70 transition-colors hover:text-maroon disabled:opacity-40"
          disabled={qty <= 1}
        >
          <Minus className="size-4" />
        </button>
        <span className="min-w-8 text-center font-semibold text-foreground">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty((q) => q + 1)}
          aria-label="Increase quantity"
          className="inline-flex size-11 items-center justify-center rounded-full text-foreground/70 transition-colors hover:text-maroon"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <AddToBasketButton
        product={product}
        quantity={qty}
        size="lg"
        onAdded={openBasket}
        className="w-full sm:flex-1"
      />
    </div>
  );
}
