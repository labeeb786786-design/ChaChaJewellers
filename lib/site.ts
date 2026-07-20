/**
 * Central business info for Chacha Jewellers.
 * Real, confirmed details — keep these in sync across the site.
 */
export const SITE = {
  name: "Chacha Jewellers",
  tagline: "South Asian Gold Jewellery — Oldham",
  phone: "0161 633 1340",
  phoneHref: "tel:+441616331340",
  address: {
    line1: "94-96 Waterloo St",
    city: "Oldham",
    postcode: "OL4 1EQ",
    full: "94-96 Waterloo St, Oldham, OL4 1EQ",
  },
  hours: "Open 7 days a week",
  rating: {
    stars: 4.6,
    count: 138,
  },
  instagram: {
    handle: "@chachajewellers.oldham",
    followers: "20.2k+",
    url: "https://www.instagram.com/chachajewellers.oldham/",
  },
  facebookUrl: "https://www.facebook.com/chachajewellersoldham/",
  // WhatsApp on the shop number: 0161 633 1340 → +44 161 633 1340.
  whatsappUrl: "https://wa.me/441616331340",
  // Google Maps embed (place search for the confirmed address).
  mapsEmbedSrc:
    "https://www.google.com/maps?q=94-96+Waterloo+St,+Oldham+OL4+1EQ&output=embed",
  mapsDirectionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=94-96+Waterloo+St+Oldham+OL4+1EQ",
} as const;

export type NavLink = { label: string; href: string };

/** Top header navigation. */
export const HEADER_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Sell Your Gold", href: "/sell-your-gold" },
  { label: "Services", href: "/services" },
  { label: "Precious Metals", href: "/precious-metals" },
  { label: "FAQs", href: "/faq" },
];

export const OPENING_HOURS: { day: string; hours: string }[] = [
  { day: "Monday", hours: "11:00 – 19:00" },
  { day: "Tuesday", hours: "11:00 – 19:00" },
  { day: "Wednesday", hours: "11:00 – 19:00" },
  { day: "Thursday", hours: "11:00 – 19:00" },
  { day: "Friday", hours: "11:00 – 13:00, 15:00 – 19:00" },
  { day: "Saturday", hours: "11:00 – 19:00" },
  { day: "Sunday", hours: "12:00 – 19:00" },
];
