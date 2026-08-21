# Project handover — Chacha Jewellers

Upload this at the start of the new chat, alongside `completion-plan.md`.

Compiled 21 August 2026, at the end of the admin panel build. That work happened in a separate chat dedicated to the admin panel; this document carries it forward.

## What this is

E-commerce site and admin panel for a UK gold jewellery business. Real client work on a long-term maintenance retainer. Target launch: 10 September 2026.

The developer is early-career and learning this stack as the project is built — explain reasoning, not just instructions. He prefers bullet points over prose for briefings and lists.

The shop sells 22k gold jewellery, gold bullion, and diamond pieces. Gold items are priced from the live gold rate; diamond pieces are priced by hand.

## Stack

- Next.js 16.3.0, App Router, Turbopack, React 19, TypeScript strict
- Tailwind v4, shadcn/ui
- Supabase — Postgres 17, Auth, Storage. Project `bnwvmqhunipmpldnwikc`, eu-central-1
- Vitest, 87 tests passing
- Vercel, GitHub repo `labeeb786786-design/ChaChaJewellers`
- Local path `C:\dev\chacha-jewellers`

`middleware.ts` is deprecated in Next 16.3 — this project uses `proxy.ts`.

## State: what is built

**Database — complete**
13 tables, RLS on all. Pricing engine, stock reservation layer, and cleanup functions all built and tested.

**Admin panel — complete**
- Login, auth, gated layout via a `(protected)` route group
- Dashboard — gold rate freshness with two alarms, blocked products, published vs draft, recent orders
- Products — list, form, price breakdown, image uploader, full write path
- Categories, Orders, Pricing, FAQs, Settings — all five built

**Storefront — NOT connected**
Homepage, basket, checkout page and AI assistant shell exist but read hardcoded mock data. A product published in the admin panel does not appear on the shop. Stripe is not integrated. This is the largest remaining block.

## Key decisions already settled — do not reopen

- **Markups** — 35/30/25/20/19/15% across the six jewellery bands, 0–5g through 60–75g. Formula is `rate × weight × (1 + markup) × 1.20 VAT`, multiplicative not additive. Confirmed by both the developer and the client. Settled.
- 75g+ and bullion remain at 0% markup, pending the client (back from holiday ~26 August). Bullion needs premiums per certified size, not one figure.
- **Pricing modes** — `dynamic_jewellery` for most of the catalogue, `dynamic_bullion` for bars and coins (live rate, own bands, 0% VAT), `fixed` for diamond jewellery only. Mode is derived from category, not chosen.
- **Payment routing** — bullion and 75g+ necklaces are not sold via Stripe, by client decision over the 1.5% fee. Bullion shows a price and pays offline; 75g+ shows no price at all, just a "call us for a quote" button. Not built. May reverse if a Stripe consultation yields a better rate.
- **Remove means deactivate** — sets `is_active = false` and `removed_at = now()`, disappears from every admin view with no restore. Images deleted from storage.
- Basket shows live prices; the price lock happens at checkout, not when something enters the basket.
- **Reservation model** — first to reach checkout holds the item, released on an expiry timer or an explicit return to basket.
- **CSV import dropped** — the client has no spreadsheet. All ~600 products go in by hand.
- Categories are nested one level. Chains is separate from Necklaces. Studs, Hoops and Kantai sit under Earrings. Bridal will be handled by tags later, not as a category.

## Traps that have already caused problems

- **Numeric columns arrive as strings.** Postgres `numeric` comes back from supabase-js as a JavaScript string. `"3.2" + 1` gives `"3.21"`. Always coerce through the Zod schemas.
- **Money is integer pence.** `53457` is £534.57. Use `parseMoney` / `formatMoney`.
- **`NEXT_PUBLIC_SUPABASE_URL` must end at `.supabase.co`** — not the Data API path with `/rest/v1`. That mistake broke login and cost an evening.
- **`apply_metal_prices()` must be called after inserting a rate.** `current_metal_prices` only exposes rows where `applied_at` is set. Insert alone leaves prices frozen while the log fills with healthy-looking rows.
- **Bangle sizes are sixteenths, not decimals.** `2.10` means two and ten-sixteenths — larger than `2.8`. `size_sort` holds the true measurement.
- **Nothing in the database prevents a hard delete of a product.** `order_items.product_id` is `ON DELETE SET NULL`. Order lines snapshot everything, so history survives, but the rule lives in code only.
- **Every Server Action must call `requireAdmin()` as its own first line.** `proxy.ts` is a redirect convenience, not a security boundary.
- **Schema changes go via migration files only.** No direct SQL editor edits — drift is unacceptable on a retainer.

## Documents in `docs/`

- `admin-brief.md` — the admin panel spec
- `admin-brief-addendum.md` — supersedes the brief where they differ
- `admin-prototype.html` — visual reference
- `hazard-register.md` — earlier risk list
- `open-flags-register.md` — every unresolved flag from the admin build, nine sections
- `completion-plan.md` — the ordered plan to finish the site

`CLAUDE.md` at the repo root is stale — still describes the site as front-end-only. A replacement was written but never placed.

## Immediate next steps

From `completion-plan.md`, Phase 0:

1. Vercel environment variables — `/admin` currently errors on the deployed site
2. Schedule the three cleanup functions — all written, none run
3. Migrate hardcoded FAQs into `ai_faqs`
4. TOTP enrolment — forced first login, per-device challenge, recovery codes
5. Email service — needed by order confirmations, rate alarms and enquiries

Then Phase 1, storefront wiring, which is the critical path.

## The real risk

Not the code. Two client dependencies decide whether 10 September is achievable:

- Product data and photography — nothing has arrived. Wired storefront pages built against two test rings will look broken and hide real bugs
- Terms and conditions — needs a solicitor, and the client hasn't started

Roughly 85 hours of launch-critical work remain against 14 working days. Achievable, with no slippage, only if those two land this week.

## Deferred to their own sessions

- Live gold rate job — the developer wants this in a separate chat after the admin panel
- Out-of-stock notifications — auto-switch to made-to-order, plus a possible email-the-business feature. Discussed, not designed
- Tags section — for the bridal cross-category filter
