import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { Category } from "@/lib/catalog";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/shop/category/${category.slug}`}
      className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-2xl border border-border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Gradient backdrop */}
      <div
        className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
        style={{
          backgroundImage: `linear-gradient(150deg, ${category.gradient[0]} 0%, ${category.gradient[1]} 100%)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      <div className="relative z-10 text-cream">
        <h3 className="font-serif text-2xl font-bold">{category.name}</h3>
        <p className="mt-0.5 text-sm text-cream/80">{category.tagline}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold-soft">
          Explore
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}
