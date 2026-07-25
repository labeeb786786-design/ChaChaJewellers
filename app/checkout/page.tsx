import { CheckoutClient } from "@/components/checkout/checkout-client";

export const metadata = {
  title: "Checkout",
  description:
    "Complete your Chacha Jewellers order — contact details, delivery and secure checkout.",
};

export default function CheckoutPage() {
  return (
    <div className="bg-cream">
      <CheckoutClient />
    </div>
  );
}
