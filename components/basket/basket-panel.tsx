"use client";

import Link from "next/link";
import { useEffect } from "react";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

import { useBasket } from "@/components/basket/basket-provider";
import { BasketThumb } from "@/components/basket/basket-thumb";
import { formatGBP } from "@/lib/gold";
import { cn } from "@/lib/utils";

/**
 * Slide-out basket drawer (right side). Lists the added items with quantity
 * steppers and remove, a running subtotal, and a link to /checkout. Rendered
 * once, site-wide, inside the BasketProvider.
 */
export function BasketPanel() {
  const {
    items,
    subtotal,
    count,
    isOpen,
    closeBasket,
    setQuantity,
    removeItem,
  } = useBasket();

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBasket();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, closeBasket]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60]",
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        onClick={closeBasket}
        className={cn(
          "absolute inset-0 bg-charcoal/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Basket"
        aria-modal="true"
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-gold-deep" />
            <h2 className="font-serif text-lg font-bold text-foreground">
              Your Basket
            </h2>
            {count > 0 && (
              <span className="text-sm text-muted-foreground">
                ({count} {count === 1 ? "item" : "items"})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={closeBasket}
            aria-label="Close basket"
            className="inline-flex size-9 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-black/5 hover:text-maroon"
          >
            <X className="size-5" />
          </button>
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-cream-soft">
              <ShoppingBag className="size-7 text-gold-deep" />
            </div>
            <p className="font-serif text-lg font-semibold text-foreground">
              Your basket is empty
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Browse our collection and add the pieces you love.
            </p>
            <Link
              href="/shop"
              onClick={closeBasket}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-maroon-deep"
            >
              Explore the Shop
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="flex flex-col gap-4">
                {items.map((item) => (
                  <li key={item.slug} className="flex gap-3.5">
                    <BasketThumb
                      src={item.image}
                      alt={item.name}
                      gradient={item.gradient}
                      className="size-20"
                    />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/shop/${item.slug}`}
                          onClick={closeBasket}
                          className="font-serif text-base font-semibold text-foreground transition-colors hover:text-maroon"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.slug)}
                          aria-label={`Remove ${item.name}`}
                          className="text-muted-foreground transition-colors hover:text-maroon"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {item.karat && (
                        <p className="text-xs text-muted-foreground">
                          {item.karat} gold
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-2">
                        {/* Quantity stepper */}
                        <div className="inline-flex items-center rounded-full border border-border">
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(item.slug, item.quantity - 1)
                            }
                            aria-label={`Decrease ${item.name} quantity`}
                            className="inline-flex size-8 items-center justify-center rounded-full text-foreground/70 transition-colors hover:text-maroon"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="min-w-6 text-center text-sm font-semibold text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(item.slug, item.quantity + 1)
                            }
                            aria-label={`Increase ${item.name} quantity`}
                            className="inline-flex size-8 items-center justify-center rounded-full text-foreground/70 transition-colors hover:text-maroon"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                        <p className="font-serif text-base font-bold text-maroon">
                          {formatGBP(item.price * item.quantity, 0)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-cream-soft/60 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Subtotal
                </span>
                <span className="font-serif text-xl font-bold text-foreground">
                  {formatGBP(subtotal, 0)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Delivery calculated at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={closeBasket}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-charcoal shadow-sm transition-colors hover:bg-gold-soft"
              >
                Proceed to Checkout
                <ArrowRight className="size-4" />
              </Link>
              <button
                type="button"
                onClick={closeBasket}
                className="mt-2 w-full py-1.5 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-maroon"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
