import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getShopProducts } from "@/lib/catalog";
import { ProductScroller } from "@/components/home/product-scroller";
import { Button } from "@/components/ui/button";

// Homepage previews at most this many products; the rest live on /shop.
const HOME_PRODUCT_LIMIT = 5;

export function FeaturedCollections() {
  const products = getShopProducts().slice(0, HOME_PRODUCT_LIMIT);

  return (
    <section className="bg-cream py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold-deep">
            Our Collection
          </p>
          <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
            Gold for every celebration
          </h2>
          <p className="mt-3 text-muted-foreground">
            A handpicked selection of our finest South Asian gold — tap any piece
            to see the full details.
          </p>
        </div>

        <ProductScroller products={products} />

        <div className="mt-12 text-center">
          <Button asChild variant="maroon" size="lg">
            <Link href="/shop">
              View Full Collection
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
