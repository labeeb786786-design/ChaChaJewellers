import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Phone } from "lucide-react";

import {
  CATEGORIES,
  getCategory,
  getProductsByCategory,
} from "@/lib/catalog";
import { ProductCard } from "@/components/shop/product-card";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategory(category);
  return { title: cat ? cat.name : "Shop" };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const products = getProductsByCategory(cat.slug);

  return (
    <div className="bg-cream">
      {/* Header */}
      <section className="hero-vignette border-b border-cream/10 text-cream">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:py-16">
          {/* Breadcrumb */}
          <nav className="mb-5 flex items-center gap-1.5 text-sm text-cream/60">
            <Link href="/" className="transition-colors hover:text-gold">
              Home
            </Link>
            <ChevronRight className="size-4" />
            <Link href="/shop" className="transition-colors hover:text-gold">
              Shop
            </Link>
            <ChevronRight className="size-4" />
            <span className="text-cream">{cat.name}</span>
          </nav>

          <h1 className="font-serif text-4xl font-bold sm:text-5xl">
            {cat.name}
          </h1>
          <p className="mt-3 max-w-2xl text-cream/70">{cat.tagline}</p>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-6 py-14 lg:py-20">
        {products.length > 0 ? (
          <>
            <p className="mb-8 text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? "piece" : "pieces"}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, i) => (
                <ProductCard key={product.slug} product={product} priority={i < 3} />
              ))}
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              More pieces coming soon
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We&rsquo;re adding more {cat.name.toLowerCase()} to the site. In the
              meantime, we hold plenty in-store — call us and we&rsquo;ll help.
            </p>
            <a
              href={SITE.phoneHref}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-maroon-deep"
            >
              <Phone className="size-4" />
              Call {SITE.phone}
            </a>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon transition-colors hover:text-gold-deep"
          >
            <ChevronRight className="size-4 rotate-180" />
            All categories
          </Link>
        </div>
      </section>
    </div>
  );
}
