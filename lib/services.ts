import type { ComponentType } from "react";
import {
  Wrench,
  Ruler,
  Sparkles,
  PenTool,
  Scale,
  Gem,
  Landmark,
  Watch,
  Link2,
  Repeat,
} from "lucide-react";

export type Service = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
};

/**
 * Single source of truth for the services offered.
 * The homepage previews the first HOME_SERVICES_COUNT; the /services page
 * lists them all (core services first, then the extras below).
 */
export const SERVICES: Service[] = [
  // --- Core services (also shown on the homepage) ---
  {
    icon: Wrench,
    title: "Repairs",
    body: "Chain soldering, clasp replacement and restoration for treasured pieces.",
  },
  {
    icon: Ruler,
    title: "Ring Resizing",
    body: "Expert resizing for the perfect fit — many done while you wait.",
  },
  {
    icon: Sparkles,
    title: "Cleaning & Polishing",
    body: "Bring the shine back to your gold with a professional clean.",
  },
  {
    icon: PenTool,
    title: "Engraving",
    body: "Personalise rings and bands with names, dates and messages.",
  },
  {
    icon: Scale,
    title: "Valuations",
    body: "Same-day, no-obligation valuations for insurance or resale.",
  },
  {
    icon: Gem,
    title: "Bespoke Jewellery",
    body: "Commission a one-of-a-kind piece — bring your design and we'll craft it.",
  },
  // --- Additional services (shown on the /services page) ---
  {
    icon: Landmark,
    title: "Gold Investment Bullion",
    body: "Buy investment-grade gold bars and coins to grow and protect your savings.",
  },
  {
    icon: Watch,
    title: "Watch Repairs & Batteries",
    body: "Battery replacement, strap fitting and servicing to keep your watch ticking.",
  },
  {
    icon: Link2,
    title: "Pearl & Bead Restringing",
    body: "Careful restringing and knotting to bring necklaces and malas back to life.",
  },
  {
    icon: Repeat,
    title: "Gold Part-Exchange",
    body: "Trade in old gold against a new piece and put its value towards something you'll love.",
  },
];

/** How many services the homepage previews. */
export const HOME_SERVICES_COUNT = 6;
export const HOME_SERVICES: Service[] = SERVICES.slice(0, HOME_SERVICES_COUNT);
