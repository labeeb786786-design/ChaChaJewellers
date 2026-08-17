import type { Metadata } from "next";

import { AdminStubPage } from "../_components/stub-page";

export const metadata: Metadata = {
  title: "Settings",
};

export default function AdminSettingsPage() {
  return (
    <AdminStubPage
      title="Settings"
      description="Shop details, hours and other site-wide settings."
      emptyState="Site settings will go here."
    />
  );
}
