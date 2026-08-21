"use client";

import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "live", label: "Live" },
  { value: "draft", label: "Draft" },
  { value: "blocked", label: "Can't publish" },
] as const;

const inputClasses =
  "w-full rounded-admin-control border border-admin-rule-strong bg-admin-surface px-3 py-2 text-sm text-admin-ink outline-none focus:border-admin-gold focus:outline-2 focus:-outline-offset-1 focus:outline-admin-gold";
const selectClasses =
  "rounded-admin-control border border-admin-rule-strong bg-admin-surface px-2.5 py-2 text-sm text-admin-ink outline-none focus:border-admin-gold focus:outline-2 focus:-outline-offset-1 focus:outline-admin-gold";

export function ProductFilters({
  categories,
  q,
  categoryId,
  status,
}: {
  categories: { id: string; name: string }[];
  q: string;
  categoryId: string;
  status: string;
}) {
  const router = useRouter();

  function navigate(next: Partial<{ q: string; category: string; status: string }>) {
    const merged = { q, category: categoryId, status, ...next };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.category) params.set("category", merged.category);
    if (merged.status) params.set("status", merged.status);

    const qs = params.toString();
    router.push(`/admin/products${qs ? `?${qs}` : ""}`);
  }

  return (
    <form
      className="mb-3.5 flex flex-wrap gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        navigate({ q: String(formData.get("q") ?? "").trim() });
      }}
    >
      <div className="min-w-45 flex-1">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name or SKU"
          className={inputClasses}
        />
      </div>
      <select
        aria-label="Filter by category"
        defaultValue={categoryId}
        onChange={(event) => navigate({ category: event.target.value })}
        className={selectClasses}
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Filter by status"
        defaultValue={status}
        onChange={(event) => navigate({ status: event.target.value })}
        className={selectClasses}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </form>
  );
}
