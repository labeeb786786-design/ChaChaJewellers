"use client";

import Image from "next/image";
import { useState } from "react";
import { Gem } from "lucide-react";

/**
 * Product image with a zoom-on-hover effect (driven by the parent card's
 * `group` hover) and a branded gradient fallback if the file isn't present yet.
 */
export function ProductImage({
  src,
  alt,
  gradient,
  name,
  priority = false,
}: {
  src: string;
  alt: string;
  gradient: [string, string];
  name: string;
  priority?: boolean;
}) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-3 text-cream transition-transform duration-700 ease-out group-hover:scale-110"
        style={{
          backgroundImage: `linear-gradient(150deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
        }}
      >
        <Gem className="size-8 opacity-80" />
        <span className="px-4 text-center font-serif text-lg font-semibold">
          {name}
        </span>
        <span className="text-[11px] uppercase tracking-widest text-cream/70">
          Photo coming soon
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      priority={priority}
      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      onError={() => setErrored(true)}
    />
  );
}
