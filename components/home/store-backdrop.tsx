"use client";

import Image from "next/image";
import { useState } from "react";

import { STORE_BACKDROP } from "@/lib/store";

/**
 * Full-bleed store photo behind the hero. If the file is missing it renders
 * nothing, so the section's `hero-vignette` gradient shows through instead.
 */
export function StoreBackdrop() {
  const [broken, setBroken] = useState(false);
  if (broken) return null;

  return (
    <div className="absolute inset-0">
      <Image
        src={STORE_BACKDROP}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        onError={() => setBroken(true)}
      />
    </div>
  );
}
