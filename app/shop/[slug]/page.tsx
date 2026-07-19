import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Phone, Weight, Ruler, Gem, ShieldCheck } from "lucide-react";

import {
  getShopProductBySlug,
  getShopProducts,
  priceLabel,
  weightLabel,
} from "@/lib/catalog";
import { ProductImage } from "@/components/shop/product-image";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return getShopProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getShopProductBySlug(slug);
  return { title: product ? product.name : "Product" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getShopProductBySlug(slug);

  if (!product) notFound();

  const specs = [
    product.karat
      ? { icon: Gem, label: "Purity", value: `${product.karat} gold` }
      : null,
    { icon: Weight, label: "Weight", value: weightLabel(product) },
    product.measure
      ? { icon: Ruler, label: product.measure.label, value: product.measure.value }
      : null,
  ].filter((s): s is { icon: typeof Gem; label: string; value: string } => s !== null);

  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-maroon">
            Home
          </Link>
          <ChevronRight className="size-4" />
          <Link href="/shop" className="transition-colors hover:text-maroon">
            Shop
          </Link>
          <ChevronRight className="size-4" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image */}
          <div className="group relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-cream-soft shadow-sm">
            <ProductImage
              src={product.image}
              alt={product.name}
              gradient={product.gradient}
              name={product.name}
              priority
            />
            {product.karat && (
              <span className="absolute left-4 top-4 z-10 rounded-full bg-charcoal/85 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-gold backdrop-blur">
                {product.karat} Gold
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-4 font-serif text-3xl font-bold text-maroon">
              {priceLabel(product)}
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {/* Specs */}
            <dl
              className={`mt-7 grid gap-3 ${
                specs.length === 2 ? "grid-cols-2" : "grid-cols-3"
              }`}
            >
              {specs.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border bg-card p-4 text-center"
                >
                  <s.icon className="mx-auto mb-2 size-5 text-gold-deep" />
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </dt>
                  <dd className="mt-0.5 font-semibold text-foreground">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Enquire */}
            <div className="mt-7 rounded-2xl border border-gold/30 bg-gold/5 p-5">
              <p className="text-sm text-foreground/80">
                This piece is available to view and reserve in-store. For
                availability, a firm quote, or to arrange a viewing, get in touch —
                we&rsquo;re happy to help.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={SITE.phoneHref}
                  className="inline-flex items-center gap-2 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-maroon-deep"
                >
                  <Phone className="size-4" />
                  Call {SITE.phone}
                </a>
                <Link
                  href="/appointments"
                  className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-5 py-2.5 text-sm font-semibold text-gold-deep transition-colors hover:bg-gold/10"
                >
                  Book a Viewing
                </Link>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-gold-deep" />
              Purity and weight confirmed in-store · {SITE.hours}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
