"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { getShopProductBySlug, type ShopProduct } from "@/lib/catalog";

/**
 * Front-end-only basket (no backend/persistence yet).
 *
 * The basket stores ONLY what the customer chose — a slug and a quantity —
 * never a price, name or image. Everything displayed is looked up fresh from
 * the catalogue on each render, so a basket left open across a gold-rate
 * change shows the new price rather than the one that happened to be on
 * screen when the item went in. Freezing a price is checkout's job, via the
 * price lock (`create_price_lock`), not the basket's.
 *
 * Swap in a real cart/order API later without changing call sites — the hook
 * shape stays the same, and `lines` is already the shape a server-side cart
 * would persist.
 */
type BasketLine = {
  slug: string;
  quantity: number;
};

/**
 * A basket line joined to its current catalogue entry. Derived per render —
 * never stored, never persisted.
 */
export type BasketItem = {
  slug: string;
  name: string;
  image: string;
  gradient: [string, string];
  karat?: string;
  /** Price per item in GBP, read live from the catalogue — not captured at add-time. */
  price: number;
  quantity: number;
};

type BasketContextValue = {
  items: BasketItem[];
  /** Total quantity across all lines (for the header badge). */
  count: number;
  subtotal: number;
  isOpen: boolean;
  openBasket: () => void;
  closeBasket: () => void;
  addItem: (product: ShopProduct, quantity?: number) => void;
  removeItem: (slug: string) => void;
  setQuantity: (slug: string, quantity: number) => void;
  clear: () => void;
};

const BasketContext = createContext<BasketContextValue | null>(null);

export function BasketProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<BasketLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((product: ShopProduct, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.slug === product.slug);
      if (existing) {
        return prev.map((l) =>
          l.slug === product.slug ? { ...l, quantity: l.quantity + quantity } : l
        );
      }
      return [...prev, { slug: product.slug, quantity }];
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setLines((prev) => prev.filter((l) => l.slug !== slug));
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.slug !== slug)
        : prev.map((l) => (l.slug === slug ? { ...l, quantity } : l))
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const openBasket = useCallback(() => setIsOpen(true), []);
  const closeBasket = useCallback(() => setIsOpen(false), []);

  /*
   * Joined fresh on every render. A line whose product has since left the
   * catalogue is dropped rather than rendered from a stale copy — a delisted
   * piece should leave the basket, not linger at a price nobody honours.
   */
  const items = useMemo<BasketItem[]>(
    () =>
      lines.flatMap((line) => {
        const product = getShopProductBySlug(line.slug);
        if (!product) return [];
        return [
          {
            slug: product.slug,
            name: product.name,
            image: product.image,
            gradient: product.gradient,
            karat: product.karat,
            price: product.priceGBP,
            quantity: line.quantity,
          },
        ];
      }),
    [lines]
  );

  /*
   * Summed in integer pence, then converted back once at the end. Adding
   * GBP floats accumulates representation error across lines (the classic
   * 0.1 + 0.2 problem), which is the same hazard `lib/money.ts` exists to
   * avoid on the admin side.
   */
  const { count, subtotal } = useMemo(() => {
    const totals = items.reduce(
      (acc, i) => {
        acc.count += i.quantity;
        acc.subtotalPence += Math.round(i.price * 100) * i.quantity;
        return acc;
      },
      { count: 0, subtotalPence: 0 }
    );
    return { count: totals.count, subtotal: totals.subtotalPence / 100 };
  }, [items]);

  const value = useMemo<BasketContextValue>(
    () => ({
      items,
      count,
      subtotal,
      isOpen,
      openBasket,
      closeBasket,
      addItem,
      removeItem,
      setQuantity,
      clear,
    }),
    [
      items,
      count,
      subtotal,
      isOpen,
      openBasket,
      closeBasket,
      addItem,
      removeItem,
      setQuantity,
      clear,
    ]
  );

  return (
    <BasketContext.Provider value={value}>{children}</BasketContext.Provider>
  );
}

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) {
    throw new Error("useBasket must be used within a BasketProvider");
  }
  return ctx;
}
