"use client";

import Image from "next/image";
import { useState } from "react";
import { Gem } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Small square product thumbnail for the basket panel and order summary.
 * Falls back to the product's brand gradient if the photo isn't present yet,
 * matching the fallback used on the shop cards.
 */
export function BasketThumb({
  src,
  alt,
  gradient,
  className,
}: {
  src: string;
  alt: string;
  gradient: [string, string];
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg bg-cream-soft",
        className
      )}
    >
      {errored ? (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            backgroundImage: `linear-gradient(150deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
          }}
        >
          <Gem className="size-5 text-cream/90" />
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="80px"
          className="object-cover"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}
