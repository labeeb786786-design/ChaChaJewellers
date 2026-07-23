import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CATEGORIES } from "@/lib/catalog";
import { CategoryCard } from "@/components/shop/category-card";
import { Button } from "@/components/ui/button";

export function FeaturedCollections() {
  return (
    <section className="bg-cream py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold-deep">
            Our Collection
          </p>
          <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
            Shop by category
          </h2>
          <p className="mt-3 text-muted-foreground">
            Explore our fine South Asian gold by the pieces you love — tap a
            category to see what&rsquo;s inside.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {CATEGORIES.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild variant="maroon" size="lg">
            <Link href="/shop">
              Browse the Shop
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
