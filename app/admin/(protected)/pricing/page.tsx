import type { Metadata } from "next";

import { AdminStubPage } from "../_components/stub-page";

export const metadata: Metadata = {
  title: "Pricing",
};

export default function AdminPricingPage() {
  return (
    <AdminStubPage
      title="Pricing"
      description="Control the gold rate and the markup bands that turn weight into price."
      emptyState="Pricing bands will go here."
    />
  );
}
