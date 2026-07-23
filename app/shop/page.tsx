import { Phone } from "lucide-react";

import { CATEGORIES } from "@/lib/catalog";
import { CategoryCard } from "@/components/shop/category-card";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Shop the Collection",
  description:
    "Browse fine South Asian gold jewellery from Chacha Jewellers by category — rings, bracelets, studs & earrings and necklaces in 22k and 24k gold.",
};

export default function ShopPage() {
  return (
    <div className="bg-cream">
      {/* Header */}
      <section className="hero-vignette border-b border-cream/10 text-cream">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold">
            Our Collection
          </p>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">
            Shop by Category
          </h1>
          <p className="mt-4 max-w-2xl text-cream/70">
            Choose a category to explore our fine South Asian gold. Every piece
            is available to view and reserve in-store — call us on{" "}
            <a href={SITE.phoneHref} className="font-medium text-gold hover:underline">
              {SITE.phone}
            </a>{" "}
            to enquire.
          </p>
        </div>
      </section>

      {/* Category grid */}
      <section className="mx-auto max-w-7xl px-6 py-14 lg:py-20">
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {CATEGORIES.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>

        {/* Enquire banner */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 rounded-2xl bg-charcoal px-6 py-8 text-center text-cream sm:flex-row sm:text-left">
          <div>
            <h2 className="font-serif text-xl font-semibold">
              Looking for something specific?
            </h2>
            <p className="mt-1 text-sm text-cream/70">
              We also craft bespoke pieces and hold much more in-store than we can
              show online.
            </p>
          </div>
          <a
            href={SITE.phoneHref}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-gold-soft"
          >
            <Phone className="size-4" />
            {SITE.phone}
          </a>
        </div>
      </section>
    </div>
  );
}
