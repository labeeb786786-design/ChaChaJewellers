# Chacha Jewellers — Backend Architecture (as of Aug 2026)

Snapshot of what's actually built, for use in ongoing "explain how this works" conversations with the user, who is learning web dev through this project.

## Status vs. the repo's CLAUDE.md
The root `CLAUDE.md` still describes the site as a front-end-only demo with no real backend/database/auth. That's now **stale** — a real Supabase backend, auth, and a partial admin panel exist. `docs/admin-brief.md` (the actual spec Claude was given for the admin build) is the accurate source for the backend/admin work.

## Stack
- Next.js 16 (App Router) + TypeScript + React 19, Tailwind v4, shadcn/ui
- Supabase: Postgres database, Auth, Storage — 13 tables, all with Row Level Security (RLS)
- Zod for runtime schema validation/coercion at the data boundary
- Vitest for unit tests (currently: `lib/money.ts`, `lib/slug.ts`)

## Database (Supabase Postgres)
Key tables: `products`, `product_images`, `categories`, `pricing_bands`, `admin_users`, `gold_price_log`, `order_items` (+ others, 13 total). RLS is enabled on all of them.

Key DB functions (business logic lives in Postgres, not just the app):
- `is_admin()` — checks the calling user against `admin_users`
- `find_pricing_band(applies_to, weight_g)` — matches a weight to a markup/VAT band
- `calculate_dynamic_price_pence(applies_to, weight_g, rate_pence, rounding)` — the price arithmetic
- `current_metal_prices` — view exposing the latest gold/silver rate for public read

Products have three pricing modes: `dynamic_jewellery` (gold-rate-linked, with VAT), `dynamic_bullion` (gold-rate-linked, no VAT), `fixed` (manual price, e.g. diamond pieces).

Money is stored as **integer pence**, never floats. Postgres `numeric` columns (weights, percentages) come back from supabase-js **as strings** — always coerced with `z.coerce.number()` via per-table Zod schemas in `lib/schemas/`, never used raw.

"Removing" a product sets `is_active = false`; rows are never hard-deleted (order history references them).

## The zero-markup guard
The standout business rule: if a dynamic-priced product's weight falls into a pricing band with `markup_percent = 0`, publishing is blocked (would sell gold at raw cost). Enforced in `lib/pricing.ts` (`canPublish()`) and called from **both** the UI and the Server Action — never just one, since a form-only check can be bypassed by e.g. a future CSV import route.

## Auth / admin security model
Three separate Supabase clients, each scoped to its job:
- `lib/supabase/server.ts` — cookie-based, RLS-respecting, used in Server Components/Actions
- `lib/supabase/client.ts` — anon key, browser-only, used only by the login form
- `lib/supabase/admin.ts` — service-role key, bypasses RLS, marked `import "server-only"` so it can never ship to the browser bundle

`proxy.ts` (this Next.js version's middleware) only redirects signed-out users away from `/admin/*` — it is explicitly **not** the real security boundary. The real gate is `requireAdmin()` in `lib/auth.ts`, which every Server Action must call first: it checks for a session AND calls the DB's `is_admin()` function. Login form has a TOTP/MFA assurance-level check stubbed in, ready for 2FA enrolment.

## Admin panel build status
Only the **Products** area is a full build (list with search/filter/pagination, zero-markup blocked-count banner, per-row status pills). Categories, Orders, Pricing, FAQs, and Settings are intentionally empty stub pages — routed, laid out, but no data/forms yet (client's own choice, per `docs/admin-brief.md`).

## Learning-mode note
User is building this project with Claude but wants to understand it deeply rather than just have it built — expect ongoing questions like "what does X do", "why is it built this way", "what's the difference between Y and Z". Answer from the actual code, not generic explanations, and correct stale docs (like the CLAUDE.md front-end-only claim) when noticed.
