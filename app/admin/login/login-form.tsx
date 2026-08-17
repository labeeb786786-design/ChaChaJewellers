"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-admin-control border border-admin-rule-strong bg-admin-surface px-2.75 py-2 text-sm text-admin-ink outline-none focus:border-admin-gold focus:outline-2 focus:-outline-offset-1 focus:outline-admin-gold";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("That email and password don't match. Check them and try again.");
      setIsSubmitting(false);
      return;
    }

    // Second-factor hook: password login is all that's wired up for now.
    // Once an admin enrols a TOTP factor, signing in raises the required
    // assurance level from aal1 to aal2 — this check is what will notice
    // that and route to a challenge step, instead of straight to
    // /admin/products. Nothing above this line needs to change when that
    // lands.
    const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (level && level.nextLevel === "aal2" && level.currentLevel !== level.nextLevel) {
      setError(
        "This account has a second factor that isn't set up in this build yet. Contact the site admin.",
      );
      await supabase.auth.signOut();
      setIsSubmitting(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div>
        <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-admin-ink">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-admin-ink">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </div>

      {error && (
        <div className="rounded-admin-control border border-[#efcfcf] bg-admin-danger-soft px-3 py-2.5 text-sm text-[#7a2020]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-admin-control bg-admin-ink px-3.5 py-2.5 text-sm font-medium text-white hover:bg-[#33312c] disabled:cursor-not-allowed disabled:bg-admin-rule-strong"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
