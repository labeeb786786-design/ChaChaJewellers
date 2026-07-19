"use client";

import { Star } from "lucide-react";

import type { Review } from "@/lib/reviews";

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="flex w-80 shrink-0 flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={
              i < review.rating
                ? "size-4 fill-gold text-gold"
                : "size-4 text-border"
            }
          />
        ))}
      </div>
      <blockquote className="flex-1 text-sm leading-relaxed text-foreground/85">
        &ldquo;{review.text}&rdquo;
      </blockquote>
      <figcaption className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
        <span className="text-sm font-semibold text-foreground">
          {review.author}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <GoogleGlyph className="size-4" />
          Google review
        </span>
      </figcaption>
    </figure>
  );
}

export function ReviewsMarquee({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  // Duplicate the set so the track can loop seamlessly (translateX -50%).
  const track = [...reviews, ...reviews];

  return (
    <section className="overflow-hidden bg-charcoal py-20 lg:py-24">
      <div className="mx-auto mb-12 max-w-7xl px-6 text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold">
          Loved by our customers
        </p>
        <h2 className="font-serif text-3xl font-bold text-cream sm:text-4xl">
          Rated 4.6★ across 138 reviews
        </h2>
        <p className="mt-3 text-cream/60">
          A few kind words from the families we&rsquo;ve served in Oldham.
        </p>
      </div>

      {/* marquee-paused wrapper pauses the animation on hover */}
      <div className="marquee-paused group relative">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-charcoal to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-charcoal to-transparent" />

        <div className="flex w-max animate-marquee gap-5 px-5">
          {track.map((review, i) => (
            <ReviewCard key={`${review.id}-${i}`} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
