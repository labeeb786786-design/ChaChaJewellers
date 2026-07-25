import { Lock } from "lucide-react";

import type { BasketItem } from "@/components/basket/basket-provider";
import { BasketThumb } from "@/components/basket/basket-thumb";
import { formatGBP } from "@/lib/gold";

/**
 * Charcoal order-summary card (hero tone). Presentational — receives basket
 * lines and the chosen delivery, renders totals and the Place order action.
 */
export function OrderSummary({
  items,
  subtotal,
  deliveryLabel,
  deliveryCost,
  onPlaceOrder,
  disabled = false,
}: {
  items: BasketItem[];
  subtotal: number;
  deliveryLabel: string;
  deliveryCost: number;
  onPlaceOrder: () => void;
  disabled?: boolean;
}) {
  const total = subtotal + deliveryCost;

  return (
    <div className="rounded-2xl border border-gold/20 bg-charcoal p-6 text-cream shadow-xl lg:sticky lg:top-24">
      <h2 className="font-serif text-xl font-bold">Order Summary</h2>

      {/* Items */}
      <ul className="mt-5 flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.slug} className="flex items-center gap-3">
            <BasketThumb
              src={item.image}
              alt={item.name}
              gradient={item.gradient}
              className="size-14"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-cream">{item.name}</p>
              <p className="text-xs text-cream/50">Qty {item.quantity}</p>
            </div>
            <p className="font-serif text-sm font-semibold text-cream">
              {formatGBP(item.price * item.quantity, 0)}
            </p>
          </li>
        ))}
      </ul>

      {/* Totals */}
      <div className="mt-5 space-y-2.5 border-t border-cream/10 pt-5 text-sm">
        <div className="flex items-center justify-between text-cream/70">
          <span>Subtotal</span>
          <span className="text-cream">{formatGBP(subtotal, 0)}</span>
        </div>
        <div className="flex items-center justify-between text-cream/70">
          <span>Delivery · {deliveryLabel}</span>
          <span className="text-cream">
            {deliveryCost === 0 ? "Free" : formatGBP(deliveryCost, 0)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-cream/10 pt-4">
        <span className="font-serif text-lg font-bold text-cream">Total</span>
        <span className="font-serif text-2xl font-bold text-gold">
          {formatGBP(total, 0)}
        </span>
      </div>

      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={disabled}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-charcoal shadow-sm transition-colors hover:bg-gold-soft disabled:pointer-events-none disabled:opacity-50"
      >
        <Lock className="size-4" />
        Place Order
      </button>

      <p className="mt-3 text-center text-xs text-cream/50">
        By placing your order you agree to our terms. 14-day returns on eligible
        items. No payment taken at this step.
      </p>
    </div>
  );
}
