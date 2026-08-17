import type { Metadata } from "next";

import { AdminStubPage } from "../_components/stub-page";

export const metadata: Metadata = {
  title: "FAQs",
};

export default function AdminFaqsPage() {
  return (
    <AdminStubPage
      title="FAQs"
      description="Manage the questions and answers shown to customers."
      emptyState="FAQ management will go here."
    />
  );
}
