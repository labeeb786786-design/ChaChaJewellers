"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Bullion product image. Shows the photo when present, otherwise falls back to
 * a branded "999.9 FINE" gold-bar panel — so cards without a photo yet still
 * look intentional. The parent must be `relative`.
 */
export function BullionImage({ src, alt }: { src?: string; alt: string }) {
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
        className="object-contain p-3"
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-gold-soft via-gold to-gold-deep">
      <span className="font-serif text-xs font-bold tracking-[0.2em] text-charcoal/70">
        999.9 FINE
      </span>
      <div className="pointer-events-none absolute -left-3 -top-8 h-14 w-28 rotate-12 bg-white/25 blur-md" />
    </div>
  );
}
