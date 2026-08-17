import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function AdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (isAdmin) {
      redirect("/admin/products");
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-baseline gap-2.5">
          <strong className="text-[15px] font-bold tracking-tight text-admin-ink">
            Chacha Jewellers
          </strong>
          <span className="rounded-[3px] border border-admin-rule-strong px-1.5 py-0.5 font-admin-mono text-[10px] tracking-[0.12em] text-admin-faint uppercase">
            Admin
          </span>
        </div>

        <div className="rounded-admin-card border border-admin-rule bg-admin-surface p-6">
          <h1 className="text-xl font-bold tracking-tight text-admin-ink">Sign in</h1>
          <p className="mt-1 mb-6 text-sm text-admin-muted">
            Admin access only. Use the account you were given.
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
