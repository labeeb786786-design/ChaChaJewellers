"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { duplicateProduct } from "../actions";

export function DuplicateProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsDuplicating(true);
    setError(null);

    const result = await duplicateProduct(productId);
    if ("error" in result) {
      setError(result.error);
      setIsDuplicating(false);
      return;
    }

    router.push(`/admin/products/${result.id}/edit`);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDuplicating}
        className="rounded-admin-control border border-admin-rule-strong bg-admin-surface px-2.5 py-1.25 text-xs font-medium text-admin-ink hover:bg-[#f5f3ee] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isDuplicating ? "Duplicating…" : "Duplicate"}
      </button>
      {error && (
        <p className="absolute top-full right-0 z-10 mt-1 w-40 rounded-admin-control bg-admin-danger-soft px-2 py-1 text-[11px] text-admin-danger shadow-sm">
          {error}
        </p>
      )}
    </div>
  );
}
