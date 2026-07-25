"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { ShopProduct } from "@/lib/catalog";

/**
 * Front-end-only basket (no backend/persistence yet). Tracks the products a
 * customer has added, their quantities and the price captured at add-time, plus
 * the open/closed state of the slide-out panel. Swap in a real cart/order API
 * later without changing call sites — the hook shape stays the same.
 */
export type BasketItem = {
  slug: string;
  name: string;
  image: string;
  gradient: [string, string];
  karat?: string;
  /** Price per item in GBP, captured when added. */
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
  const [items, setItems] = useState<BasketItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((product: ShopProduct, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === product.slug);
      if (existing) {
        return prev.map((i) =>
          i.slug === product.slug
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          slug: product.slug,
          name: product.name,
          image: product.image,
          gradient: product.gradient,
          karat: product.karat,
          price: product.priceGBP,
          quantity,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.slug !== slug)
        : prev.map((i) => (i.slug === slug ? { ...i, quantity } : i))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const openBasket = useCallback(() => setIsOpen(true), []);
  const closeBasket = useCallback(() => setIsOpen(false), []);

  const { count, subtotal } = useMemo(
    () =>
      items.reduce(
        (acc, i) => {
          acc.count += i.quantity;
          acc.subtotal += i.price * i.quantity;
          return acc;
        },
        { count: 0, subtotal: 0 }
      ),
    [items]
  );

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
