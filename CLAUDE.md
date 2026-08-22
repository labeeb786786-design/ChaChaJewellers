# Chacha Jewellers

Production e-commerce site for **Chacha Jewellers**, a family-run South Asian gold
jewellery specialist in Oldham, UK. Next.js App Router + Supabase, deployed on Vercel.
Target launch: **10 September 2026**.

## The most important thing to know

**This repo is two halves at different stages.**

- **Admin panel (`/admin`) — real and complete.** Supabase Postgres, Supabase Auth,
  RLS, Server Actions, Storage. Products, categories, pricing bands, orders, FAQs,
  settings all read and write live data.
- **Storefront (everything else) — still mock.** `lib/catalog.ts`, `lib/gold.ts`,
  `lib/reviews.ts` read JSON from `lib/data/`. None of it is wired to Supabase yet.
  That wiring is "Phase 1" and is the current critical path.

So: a change under `app/admin/` is backend work against a real database with real
rules. A change to a storefront page is probably touching mock data that is about to
be deleted. Know which one you are in before you start.

Checkout, Stripe, and the price-lock/reservation flow exist **in the database only** —
`create_price_lock`, `consume_price_lock`, `release_price_lock` are written and tested,
but nothing in the app calls them yet.

## Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Supabase** — Postgres, Auth, Storage, RLS. `@supabase/ssr` + `@supabase/supabase-js`
- **Tailwind CSS v4** — CSS-first config in `app/globals.css`; there is no
  `tailwind.config.js`, theme tokens live in `@theme`
- **shadcn/ui** (new-york) — `components.json`; primitives in `components/ui/`;
  `cn()` in `lib/utils.ts`
- **Zod** for every schema boundary — `lib/schemas/`
- **Vitest** for unit tests, **Recharts** for price charts, **lucide-react** for icons

```bash
npm run dev     # http://localhost:3000
npm run build
npm run lint
npm run test    # vitest run
```

## Non-negotiable rules

These have each already caused a real problem. Do not relax them.

1. **Every Server Action calls `requireAdmin()` as its own first line.** Not the second
   line, not inside a helper. `proxy.ts` is a redirect convenience, **not** a security
   boundary — a direct action invocation routes straight around it. See `lib/auth.ts`.
2. **Schema changes go via migration files only.** No edits in the Supabase SQL editor
   or via MCP without a matching file in `supabase/migrations/`. Drift is unacceptable
   on a retainer. Filenames are version keys — never renumber an applied migration.
3. **`lib/supabase/admin.ts` is the service-role client and bypasses RLS entirely.**
   It is marked `server-only` so bundling it into client JS is a build error. Use
   `lib/supabase/server.ts` (RLS-respecting) unless you specifically need to bypass RLS.
4. **Money is integer pence.** `53457` is £534.57. Use `parseMoney` / `formatMoney` in
   `lib/money.ts`. Never floats.
5. **Postgres `numeric` arrives from supabase-js as a JavaScript string.** `"3.2" + 1`
   gives `"3.21"`. Always coerce through the Zod schemas in `lib/schemas/`.
6. **The price formula lives in the database, not here.** `calculate_dynamic_price_pence`
   and `find_pricing_band` are Postgres functions; `lib/pricing.ts` calls them by RPC and
   deliberately does not reimplement them. Keep it that way — a TypeScript copy that
   drifts means the admin preview shows one price and checkout charges another.
7. **Bangle sizes are sixteenths, not decimals.** `2.10` means two and ten-sixteenths —
   *larger* than `2.8`. `size_sort` holds the true measurement; `size_label` is what
   humans see. See `lib/size.ts`.
8. **`NEXT_PUBLIC_SUPABASE_URL` must end at `.supabase.co`** — not the Data API path with
   `/rest/v1`. That mistake broke login and cost an evening.
9. **`apply_metal_prices()` must be called after inserting a metal rate.**
   `current_metal_prices` only exposes rows with `applied_at` set. Insert alone leaves
   prices frozen while the log fills with healthy-looking rows.
10. **A hard delete of a product is only partly blocked by the database.**
    `order_items.product_id` is `ON DELETE SET NULL` and order lines snapshot
    everything, so history survives; `product_images` cascades. But
    `price_lock_items.product_id` is `ON DELETE RESTRICT` — a product held by a live
    price lock cannot be hard-deleted, and an unguarded bulk delete aborts the whole
    statement on it (see
    `20260822122518_guard_draft_cleanup_against_price_lock_items.sql`). The
    "remove means deactivate" rule (`is_active = false`, `removed_at = now()`) is
    still application code only.

## Layout

```
app/
  admin/
    login/                    # password + stubbed MFA assurance check
    (protected)/              # dashboard, products, categories, pricing,
                              #   orders, faqs, settings — all real
  api/admin/                  # price-preview, product image upload routes
  shop/, shop/[slug]/         # storefront — MOCK data
  shop/category/[category]/   # storefront — MOCK data
  bullions/, precious-metals/ # gold & silver price pages — MOCK prices
  checkout/                   # UI only, no payment integration
  faq/, about/, contact/, services/, sell-your-gold/

lib/
  supabase/client.ts          # browser, anon key, RLS applies
  supabase/server.ts          # server components + actions, RLS applies
  supabase/admin.ts           # service role, BYPASSES RLS, server-only
  auth.ts                     # requireAdmin()
  schemas/                    # Zod — the coercion boundary for all DB reads
  pricing.ts                  # RPC wrappers + canPublish() zero-markup guard
  size.ts                     # ring letters + bangle sixteenths
  money.ts, slug.ts, db-errors.ts, relative-time.ts
  catalog.ts, gold.ts, reviews.ts, data/*.json   # MOCK — deleted in Phase 1

supabase/migrations/          # the only place schema changes are allowed
types/db.ts                   # generated Supabase types
proxy.ts                      # session refresh + redirect. NOT a security boundary
```

## Scheduled database jobs

Two `pg_cron` jobs run nightly (schedules are **UTC** — 03:00 UTC is 04:00 BST):

- `purge-expired-price-locks` 03:00 — retention sweep only. It deletes locks that
  expired **more than 7 days** ago. It is *not* what returns reserved stock to sale —
  that is `available_stock()`, checked live on every read. Anything that looks like
  "stock stuck as reserved" is an `available_stock()` question, not a cron question.
- `cleanup-abandoned-draft-products` 03:15 — calls `run_abandoned_draft_cleanup()`,
  never `cleanup_abandoned_draft_products()` directly. The raw function *returns*
  storage paths rather than deleting files, because Postgres cannot reach Supabase
  Storage. The wrapper captures those paths into `storage_cleanup_queue`; scheduling
  the raw function would discard them and orphan every file silently.

A third job — the orphaned-storage-file sweep that drains `storage_cleanup_queue` —
**does not exist yet** and cannot be a plain Postgres function. It needs an HTTP path
out of the database (Edge Function + `pg_net`, or a Next.js route + Vercel Cron).

## Business facts (real — do not invent alternatives)

- **Founded** 1997 · **94-96 Waterloo St, Oldham, OL4 1EQ** · **0161 633 1340**
- Open 7 days, 11am–7pm · Google 4.6★ from 138 reviews · Instagram
  @chachajewellers.oldham (20.2k+)
- South Asian gold — bridal sets, 22k, bangles (bhalia), rings, necklace sets,
  earrings; plus gold buying and valuations. Bespoke commissions are real.

⚠️ **Do not invent** certifications, reviews, or claims beyond what the client provides.
Single source of truth for business info: `lib/site.ts`.

Settled business decisions that constrain the code:

- **Payment routing** — bullion and 75g+ necklaces are **not** sold via Stripe, by
  client decision over the 1.5% fee. Bullion shows a price and pays offline; 75g+ shows
  no price at all, just "call us for a quote". Build this as configuration, not scattered
  `if` statements — the decision may reverse if a better Stripe rate is negotiated.
- **Pricing mode is derived from category, not chosen** by the admin.
- **Categories nest exactly one level.** Chains is separate from Necklaces. Studs, Hoops
  and Kantai sit under Earrings. Bridal will be tags, not a category.
- **Basket holds IDs and quantities only** — never a price. Prices are fetched fresh on
  every render; the freeze happens at checkout via the price lock.
- **No CSV import** — the client has no spreadsheet. All ~600 products go in by hand.

## Design tone

Premium South Asian gold-jewellery brand — **established, trustworthy, celebratory**
(weddings and occasions), not a generic Western jewellery template.

- **Palette:** gold `#c9a227`, charcoal `#13110e`, maroon `#591826`, cream `#faf6ee`.
  Available as `bg-gold`, `text-maroon`, `bg-charcoal`, `bg-cream` (see `@theme`).
- **Type:** Playfair Display (serif) headings via `--font-serif`; Inter body via
  `--font-sans`. Both wired through `next/font` in `layout.tsx`.
- Generous whitespace, subtle hover lifts, gradient placeholder imagery (no external
  image service). Mobile-first.

## Known-stale and mock things

- **Gold/silver prices** — `lib/data/gold-prices.json`. Swap `getGoldPrices()` in
  `lib/gold.ts` for a real metals API (server-side key). Phase 3.
- **Reviews** — `lib/data/reviews.json`, placeholders. `getReviews()` is already async
  and filters sub-4★ so it can be swapped for the Google Places API with no call-site
  changes. Phase 6.
- **AI Jewellery Assistant** — `components/assistant/ai-assistant.tsx` is a scripted
  keyword matcher, not an LLM. It also imports `gold-prices.json` directly.
- **FAQ content is hardcoded** in `lib/site.ts` / `app/faq/page.tsx`. The `ai_faqs` table
  and its admin UI both exist and are empty; migrating the content is Phase 0 task 0.3.
- **MFA is stubbed.** `app/admin/login/login-form.tsx` checks the authenticator assurance
  level but there is no enrolment flow, no per-device challenge and no recovery codes.
  A single password currently guards the whole admin panel.
- **No transactional email provider.** Order confirmations, rate alarms and enquiry
  notifications all wait on it.

## Further reading

`docs/` holds the plan and the reasoning: `project-handover.md` (start here),
`backend-architecture.md`, `completion-plan.md`, `phases-0-1-2-explained.md`,
`admin-brief.md` + `admin-brief-addendum.md` (the addendum supersedes the brief where
they differ). Note the `docs/` copies are point-in-time snapshots and may lag the live
plan; treat anything in a task prompt as newer.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
