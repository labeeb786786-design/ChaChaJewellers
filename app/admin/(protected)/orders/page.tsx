import type { Metadata } from "next";

import { AdminStubPage } from "../_components/stub-page";

export const metadata: Metadata = {
  title: "Orders",
};

export default function AdminOrdersPage() {
  return (
    <AdminStubPage
      title="Orders"
      description="See what's been ordered and its status."
      emptyState="Order history will go here."
    />
  );
}
