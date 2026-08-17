import type { Metadata } from "next";

import { AdminStubPage } from "../_components/stub-page";

export const metadata: Metadata = {
  title: "Categories",
};

export default function AdminCategoriesPage() {
  return (
    <AdminStubPage
      title="Categories"
      description="Group products so customers can browse by type."
      emptyState="Category management will go here."
    />
  );
}
