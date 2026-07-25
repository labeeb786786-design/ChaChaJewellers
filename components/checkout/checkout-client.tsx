"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Store,
  Truck,
  ShieldCheck,
  Check,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import { useBasket } from "@/components/basket/basket-provider";
import { PaymentSection } from "@/components/checkout/payment-section";
import { OrderSummary } from "@/components/checkout/order-summary";
import { cn } from "@/lib/utils";

type DeliveryMethod = "collect" | "delivery";

const DELIVERY_OPTIONS: {
  id: DeliveryMethod;
  icon: typeof Store;
  label: string;
  sub: string;
  cost: number;
}[] = [
  {
    id: "collect",
    icon: Store,
    label: "Collect in-store",
    sub: "Ready at our Oldham showroom",
    cost: 0,
  },
  {
    id: "delivery",
    icon: Truck,
    label: "Insured delivery",
    sub: "Tracked & fully insured to your door",
    cost: 15,
  },
];

export function CheckoutClient() {
  const { items, subtotal, clear } = useBasket();
  const [delivery, setDelivery] = useState<DeliveryMethod>("collect");
  const [placed, setPlaced] = useState(false);

  const deliveryOption = DELIVERY_OPTIONS.find((o) => o.id === delivery)!;

  function handlePlaceOrder() {
    setPlaced(true);
    clear();
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  // Order-placed confirmation
  if (placed) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
          <CheckCircle2 className="size-9" />
        </span>
        <h1 className="mt-6 font-serif text-3xl font-bold text-foreground">
          Thank you for your order
        </h1>
        <p className="mt-3 text-muted-foreground">
          This is a preview checkout, so no payment has been taken. In a live
          store we&rsquo;d confirm your order by email and arrange{" "}
          {deliveryOption.id === "collect"
            ? "in-store collection"
            : "insured delivery"}
          .
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-maroon px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-maroon-deep"
        >
          Continue shopping
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  // Empty basket
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-cream-soft text-gold-deep">
          <ShoppingBag className="size-8" />
        </span>
        <h1 className="mt-6 font-serif text-3xl font-bold text-foreground">
          Your basket is empty
        </h1>
        <p className="mt-3 text-muted-foreground">
          Add a piece to your basket before heading to checkout.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-maroon px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-maroon-deep"
        >
          Explore the Shop
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
      <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
        Checkout
      </h1>
      <p className="mt-2 text-muted-foreground">
        Almost there — just a few details to complete your order.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Contact Details */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-xl font-bold text-foreground">
              Contact Details
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="fullName">
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  className={inputClass}
                />
              </Field>
              <Field label="Phone number" htmlFor="phone">
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="07…"
                  className={inputClass}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Email address" htmlFor="email">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Delivery Method */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-xl font-bold text-foreground">
              Delivery Method
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {DELIVERY_OPTIONS.map((opt) => {
                const active = delivery === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDelivery(opt.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                      active
                        ? "border-gold bg-gold/5 ring-1 ring-gold"
                        : "border-border hover:border-gold/50"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                        active
                          ? "bg-gold text-charcoal"
                          : "bg-cream-soft text-gold-deep"
                      )}
                    >
                      <opt.icon className="size-4" />
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          {opt.label}
                        </span>
                        {active && <Check className="size-4 text-gold-deep" />}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {opt.sub}
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-maroon">
                        {opt.cost === 0 ? "Free" : `£${opt.cost}`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Payment (isolated for future Stripe) */}
          <PaymentSection />

          {/* Trust line */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-gold-deep" />
            Secured checkout, insured items
          </div>
        </div>

        {/* Right column */}
        <div>
          <OrderSummary
            items={items}
            subtotal={subtotal}
            deliveryLabel={deliveryOption.label}
            deliveryCost={deliveryOption.cost}
            onPlaceOrder={handlePlaceOrder}
          />
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold focus:ring-2 focus:ring-gold/30";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
