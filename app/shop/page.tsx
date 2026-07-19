import { Phone } from "lucide-react";

import { getShopProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/shop/product-card";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Shop the Collection",
  description:
    "Browse fine South Asian gold jewellery from Chacha Jewellers — bangles, rings, necklace sets and earrings in 22k and 24k gold.",
};

export default function ShopPage() {
  const products = getShopProducts();

  return (
    <div className="bg-cream">
      {/* Header */}
      <section className="hero-vignette border-b border-cream/10 text-cream">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold">
            Our Collection
          </p>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">
            Shop Fine Gold
          </h1>
          <p className="mt-4 max-w-2xl text-cream/70">
            A handpicked selection of our finest South Asian gold jewellery, in
            radiant 22k and 24k gold. Each piece is available to view and reserve
            in-store — call us on{" "}
            <a href={SITE.phoneHref} className="font-medium text-gold hover:underline">
              {SITE.phone}
            </a>{" "}
            to enquire.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-6 py-14 lg:py-20">
        <div className="mb-8 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </p>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Prices reflect current 24k / 22k gold weight &amp; craftsmanship.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, i) => (
            <ProductCard key={product.slug} product={product} priority={i < 3} />
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
