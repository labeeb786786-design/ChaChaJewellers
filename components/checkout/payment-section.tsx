import { Lock } from "lucide-react";

/**
 * Payment placeholder — isolated on purpose. When real Stripe integration lands,
 * replace the inner dashed box with Stripe Elements here without touching the
 * rest of the checkout. Payment-method logos (Visa, Mastercard, Apple/Google
 * Pay) are intentionally omitted until then, when Stripe's official icon set
 * will be used.
 */
export function PaymentSection() {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-serif text-xl font-bold text-foreground">Payment</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Card payment will be available soon.
      </p>

      <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-cream-soft/50 px-6 py-10 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-cream-soft text-gold-deep">
          <Lock className="size-5" />
        </span>
        <p className="font-medium text-foreground">Secure payment — coming soon</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          You won&rsquo;t be charged now. Complete your order and we&rsquo;ll be
          in touch to arrange payment.
        </p>
      </div>
    </section>
  );
}
