/**
 * Store photography for the homepage.
 *
 * To use the REAL Chacha Jewellers photos later, just drop the files into
 * /public/store-images keeping these same filenames — no code changes needed.
 * The gallery reads best with WIDE (landscape) photos; portrait shots will be
 * centre-cropped to the 16:9 frame.
 *
 * Current images are free-licence placeholders from Unsplash.
 */

/** Large, wide shot used as the hero background. */
export const STORE_BACKDROP = "/store-images/store-wide.jpg";

export type GalleryImage = {
  src: string;
  alt: string;
  title: string;
  description: string;
};

/** Showroom shots viewed one at a time in the "look inside" gallery section. */
export const STORE_GALLERY: GalleryImage[] = [
  {
    src: "/store-images/store-wide.jpg",
    alt: "Inside the Chacha Jewellers showroom",
    title: "Welcome to Our Showroom",
    description:
      "Step through our doors in the heart of Oldham and into a world of gold. Every cabinet is arranged with intention, inviting you to browse in comfort while our family guides you, never rushes you.",
  },
  {
    src: "/store-images/store-1.jpg",
    alt: "Gold bridal necklace sets on display in-store",
    title: "Bridal Gold, Made to Dazzle",
    description:
      "Our bridal collection is the centrepiece of the showroom — opulent 22k necklace sets hand-chosen for weddings, Eid and the moments a family remembers forever. Each is crafted to be worn, treasured and passed on.",
  },
  {
    src: "/store-images/store-3.jpg",
    alt: "Gold jewellery display cabinets lining the showroom wall",
    title: "The Gold Wall",
    description:
      "A floor-to-eye wall of fine gold, glowing under warm light. From delicate everyday chains to statement pieces, this is where our decades of curation come together in one breathtaking display.",
  },
  {
    src: "/store-images/store-2.jpg",
    alt: "A gold necklace and matching earring set on display",
    title: "The Art of Fine Detail",
    description:
      "Look closer and the craftsmanship reveals itself. Matching necklace and earring sets finished with intricate, hand-worked detailing — the quiet artistry our customers return to us for, generation after generation.",
  },
  {
    src: "/store-images/store-4.jpg",
    alt: "Rings and fine jewellery in the display window",
    title: "Rings & Treasures",
    description:
      "Rings, bangles and gifts for every occasion, each waiting to become part of your story. Whether you're marking a milestone or simply treating yourself, our team will help you find the perfect piece.",
  },
];
