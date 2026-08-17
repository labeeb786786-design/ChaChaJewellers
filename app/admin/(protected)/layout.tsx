import { redirect } from "next/navigation";

import { AdminAuthError, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "./_components/nav";
import { AdminTopBar } from "./_components/top-bar";

/**
 * Gates every route under it: /admin/login sits outside this group
 * (app/admin/login/, a sibling of this folder) specifically so it isn't
 * wrapped by this check — a session check on the sign-in page would just
 * redirect back to itself.
 */
export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/admin/login");
    }
    throw error;
  }

  const supabase = await createClient();
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("label, email")
    .eq("user_id", user.id)
    .maybeSingle();

  const label = adminRow?.label || adminRow?.email || user.email || "Admin";

  return (
    <div className="flex min-h-full flex-col">
      <AdminTopBar label={label} />
      <AdminNav />
      <main className="flex-1 px-5 py-5.5">{children}</main>
    </div>
  );
}
