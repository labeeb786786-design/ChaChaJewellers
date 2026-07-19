# Chacha Jewellers — Preview Website

A **client-pitch preview** website for **Chacha Jewellers**, a family-run South
Asian gold jewellery specialist in Oldham, UK. This is a polished, front-end-only
demo — **no real backend, database, auth, or payments.** Prioritise visual polish
and navigation over backend robustness.

## Business facts (real — use these, don't invent alternatives)

- **Name:** Chacha Jewellers
- **Address:** 94-96 Waterloo St, Oldham, OL4 1EQ
- **Phone:** 0161 633 1340
- **Hours:** Open 7 days a week, 11am–7pm
- **Google rating:** 4.6★ from 138 reviews
- **Instagram:** @chachajewellers.oldham (20.2k+ followers)
- **Specialty:** South Asian gold — bridal sets, 22k gold, bangles (bhalia),
  rings, necklace sets, earrings; plus gold buying / valuations. Bespoke
  commissions are real (confirmed by a customer review).

⚠️ **Do not invent** specific certifications, a founding year, or extra reviews
beyond what the client provides. Keep such claims generic where unconfirmed.
Single source of truth for business info: [`lib/site.ts`](lib/site.ts).

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS v4** (CSS-first config in [`app/globals.css`](app/globals.css) —
  there is no `tailwind.config.js`; theme tokens live in `@theme`)
- **shadcn/ui** (new-york style) — configured in [`components.json`](components.json);
  primitives in [`components/ui/`](components/ui). `cn()` in [`lib/utils.ts`](lib/utils.ts).
- **Recharts** for price charts
- **lucide-react** for icons
- Static/mock data via JSON in `lib/data/` — no DB
- Deploy target: **Vercel**

## Commands

```bash
npm run dev     # local dev server (http://localhost:3000)
npm run build   # production build
npm run start   # serve production build
npm run lint    # eslint
```

## Folder structure

```
app/
  layout.tsx            # fonts, Navbar, Footer, site-wide AI assistant, metadata
  page.tsx              # homepage (composes the home/ sections)
  globals.css           # Tailwind v4 theme + brand palette + marquee keyframes
  shop/                 # + shop/[slug]/  (stub "coming soon")
  sell-your-gold/       # stub
  services/             # stub
  about/                # stub
  contact/              # stub
  appointments/         # stub
  precious-metals/      # REAL page: full gold/silver price charts
components/
  ui/                   # shadcn primitives (button, card, badge)
  layout/               # navbar, footer, coming-soon
  home/                 # homepage sections (hero, featured-collections, …)
  assistant/            # ai-assistant floating widget
  precious-metals/      # price-chart
lib/
  site.ts               # business info + nav links + opening hours
  products.ts           # product/category loaders + CATEGORIES
  reviews.ts            # getReviews() with min-rating filter
  gold.ts               # getGoldPrices() + formatGBP()
  utils.ts              # cn()
  data/                 # products.json, reviews.json, gold-prices.json
```

## Design tone

Premium South Asian gold-jewellery brand — should feel **established, trustworthy
and celebratory** (weddings/occasions), NOT a generic Western jewellery template.

- **Palette:** warm **gold** (`#c9a227`), deep **charcoal/black**, deep **maroon**
  (`#5c1a1a`), soft **cream** (`#faf6ee`). Available as Tailwind utilities:
  `bg-gold`, `text-maroon`, `bg-charcoal`, `bg-cream`, etc. (see `@theme` in globals.css).
- **Type:** Playfair Display (serif) for headings via `--font-serif`; Inter (sans)
  for body via `--font-sans`. Both wired through `next/font` in `layout.tsx`.
- Generous whitespace, subtle hover lifts/animations, rich gradient placeholder
  imagery (no external image service). Mobile-first responsive.

## Mocked / demo behaviours (flagged for future real implementation)

- **Gold/silver prices** — mock JSON (`lib/data/gold-prices.json`). Swap
  `getGoldPrices()` in `lib/gold.ts` for a real metals API (server-side key).
- **Reviews** — local JSON (`lib/data/reviews.json`). `getReviews()` in
  `lib/reviews.ts` is async and filters sub-4★ reviews so it can later be
  swapped for the **Google Places API** (capped at 5 reviews) with no call-site
  changes. NOTE: seed reviews are **placeholders** — replace with the client's
  5 real verbatim Google reviews.
- **AI Jewellery Assistant** — `components/assistant/ai-assistant.tsx` is a
  **scripted** keyword matcher (not a real LLM) that answers a few FAQs and
  navigates to the relevant page.
- **Shop / other inner pages** — "Coming soon" stubs so nav never 404s.
