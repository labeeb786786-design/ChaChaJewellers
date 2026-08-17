"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-admin-control border border-admin-rule-strong bg-admin-surface px-2.5 py-1.5 text-xs font-medium text-admin-ink hover:bg-[#f5f3ee]"
    >
      Sign out
    </button>
  );
}
