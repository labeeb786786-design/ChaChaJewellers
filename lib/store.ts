/**
 * Store photography for the homepage hero.
 *
 * To use the REAL Chacha Jewellers photos later, just drop the files into
 * /public/store-images keeping these same filenames (store-wide, store-1…4) —
 * no code changes needed. Add or remove carousel entries below to change how
 * many close-ups scroll.
 *
 * Current images are free-licence placeholders from Unsplash.
 */

/** Large, wide shot used as the section background. */
export const STORE_BACKDROP = "/store-images/store-wide.jpg";

/** Close-up shots scrolled through in the hero carousel. */
export const STORE_IMAGES: { src: string; alt: string }[] = [
  { src: "/store-images/store-1.jpg", alt: "Gold necklace sets on display in-store" },
  { src: "/store-images/store-2.jpg", alt: "A gold necklace and matching earring set on display" },
  { src: "/store-images/store-3.jpg", alt: "Gold jewellery display cabinets in the showroom" },
  { src: "/store-images/store-4.jpg", alt: "Rings and fine jewellery in the display window" },
];
