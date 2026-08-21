# Phases 0, 1 and 2 explained — Chacha Jewellers

For understanding, not just doing. Each item below repeats the plan's one-liner, then explains what it actually means, why it exists, and what could go wrong if it's skipped or rushed.

## Phase 0 — Unblockers

### 0.1 · Vercel environment variables (15 min)

- Your Next.js app reads config like the Supabase URL and API keys from environment variables (`process.env.SOMETHING`). Locally these live in `.env.local` on your machine, which Vercel never sees — it has its own separate copy you set in its dashboard.
- `/admin` errors on the deployed site because those variables simply aren't set there yet — the code runs, tries to create a Supabase client with `undefined` as the URL, and fails.
- Variables that matter most: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (safe for the browser — RLS still protects the data), and the service-role key used server-side only (never prefixed `NEXT_PUBLIC_`, or it would ship into the browser bundle).
- Anything prefixed `NEXT_PUBLIC_` gets baked into the JavaScript bundle *at build time* — which is why setting the variable alone isn't enough. You need a fresh deploy (redeploy, don't just restart) for it to take effect.
- Remember the trap from the handover: the URL must end at `.supabase.co`, not include `/rest/v1` — that specific mistake already cost an evening once.

### 0.2 · Schedule the three cleanup jobs (1 hr)

- `cleanup_abandoned_draft_products()`, `purge_expired_price_locks()`, and an orphaned-storage-file sweep already exist as Postgres functions — they work, but nothing calls them on a schedule. Right now they'd only ever run if you manually executed them.
- Two ways to schedule a Postgres function: (a) Supabase's `pg_cron` extension, which runs the function directly inside Postgres on a cron schedule — no app code involved; or (b) a Vercel Cron Job that hits a Next.js API route, which then calls the function. Since the logic already lives entirely in the database, `pg_cron` is the simpler path here — one less moving part, no API route to secure.
- Why it matters even though nothing breaks today: every abandoned draft product and every price lock that expires without being cleaned up just sits there. It's silent — no error, no crash — the database just slowly fills with dead rows and orphaned files in Storage (which you pay for). By the time it's visibly a problem, you're doing a manual cleanup under time pressure instead of a scheduled non-event.

### 0.3 · Migrate hardcoded FAQs into `ai_faqs` (1 hr)

- Right now the storefront's FAQ content is presumably a hardcoded array or JSON file in the codebase — editing it means editing code and redeploying.
- The admin panel's FAQs section is already built (per the handover) with a full write path to the `ai_faqs` table — this task is just: take the existing hardcoded questions/answers and insert them as real rows, once, by hand or with a small one-off script.
- The payoff: once this is done, the client can add or edit an FAQ from the admin panel with no code change and no deploy. It also gives them something real to look at in that section instead of an empty page.

### 0.4 · TOTP enrolment (4 hrs)

- TOTP = Time-based One-Time Password — the six-digit code Google Authenticator / Authy generate, same mechanism as most "authenticator app" 2FA.
- "Forced first login" means: after entering the password, if the account has no MFA factor enrolled yet, the app redirects to an enrolment screen (scan QR code, confirm a code) before granting access — it can't be skipped or postponed.
- "Per-device challenge" means a session on a new browser/device has to complete a fresh TOTP challenge even if the password is already known — a stolen password alone isn't enough to get in from an unrecognised device.
- "Recovery codes" are a batch of one-time-use backup codes generated at enrolment, shown once, meant to be stored somewhere safe — the escape hatch if the phone with the authenticator app is lost.
- Supabase Auth has this natively (`supabase.auth.mfa.enroll` / `.challenge` / `.verify`) — the architecture doc already notes an assurance-level check is stubbed into the login form, so this is largely wiring up Supabase's existing MFA flow rather than building 2FA from scratch.
- Why urgent: right now a single password is the only thing standing between the internet and full admin control of a shop that will shortly be taking real payments.

### 0.5 · Email service — Resend or similar (3 hrs)

- Supabase has a built-in email sender, but it's meant for its own auth emails (password resets, magic links) — it's rate-limited and not built for general transactional email at any real volume or with custom templates.
- A dedicated service (Resend, Postmark, SendGrid) gives you an API you call from a Server Action: `send({to, subject, html})`. Setup is an API key (env variable) plus verifying your sending domain (SPF/DKIM/DMARC DNS records) so emails don't land in spam.
- This single piece of infrastructure is a dependency for three later items: order confirmation emails (2.5), the two rate-staleness alarms (3.3), and made-to-order enquiry notifications. Building it once now means those three later tasks are just "call the function that already works," not three separate integrations.

### 0.6 · Small correctness items from the flags register (2 hrs)

- **Bangle size cap at `.15`** — bangle sizes are recorded in sixteenths (the handover's trap: `2.10` means 2 and 10/16, bigger than `2.8`). The fractional part should never reach `.16`, because at that point it should roll over into the next whole number (e.g. `2.16` should really be stored as `3.00`). The cap is a validation guard stopping `.16` or higher from ever being entered.
- **`findBlockedProductIds` counting query** — this is the query behind the dashboard's "blocked products" count (products stuck because they landed in a 0%-markup pricing band). Flagged as needing a fix, most likely an inaccurate count from a join or filter that's off — worth checking against a known test case before trusting the dashboard number.
- **The formula-mirror comment** — the price formula exists in two places: as a Postgres function (`calculate_dynamic_price_pence`) and mirrored in TypeScript (`lib/pricing.ts`) for the admin UI to preview prices without a round-trip to the database. Those two implementations must always agree exactly, or the admin preview will show one number and checkout will charge another. This item is about making that dependency explicit in a code comment so a future edit to one side doesn't silently forget the other.
- **Unpriceable-band failure readability** — when a product's weight doesn't land in any defined pricing band, something has to fail. This item confirms that failure surfaces as a clear message to the admin ("no pricing band matches this weight") rather than a raw database error or a silent `null`.

---

## Phase 1 — Storefront foundation

### 1.1 · Real product data (client dependency)

- Everything downstream in this phase gets built and tested against whatever data exists. Two test rings won't exercise a product with no photos yet, a bangle at an edge-case size, a category with children, or a 75g+ item — all of which are real cases the real catalogue will hit on day one. Bugs that only show up with variety get found *after* launch instead of before, which is the expensive way to find them.

### 1.2 · Data layer (3 hrs)

- One module (e.g. `lib/storefront/queries.ts`) holding every read query the public site needs: list products, get one by slug, get a category tree. Centralising this means there's exactly one place that defines what the public can see.
- **Published-only** — every query filters to `is_active = true` (and not `removed_at`), so a draft or removed product can never leak onto the live site through a code path someone forgot to filter.
- **RLS-respecting** — built on the anon-key Supabase client, the same pattern as `lib/supabase/client.ts`. Row Level Security policies on the `products` table enforce the published-only rule *at the database level* too — so even if a bug in the query layer forgets a filter, Postgres itself still won't return unpublished rows. Belt and braces.
- **Anon key** — the public, safe-for-the-browser key, explicitly not the service-role key (which bypasses RLS entirely and must never reach client code, per the architecture doc's `admin.ts` being marked `server-only`).

### 1.3 · Listing and category pages (8 hrs)

- The shop page and category pages are routed by slug (`/shop/rings`, etc.) using Next.js's dynamic route segments.
- **Resolving by slug and including children** — categories nest one level (Studs/Hoops/Kantai under Earrings). Visiting `/shop/earrings` should show products from all three children, not just products directly tagged "Earrings" with nothing in it — the query needs to expand to child category IDs before filtering products.
- **Pagination** — with ~600 products eventually, a listing page can't fetch and render all of them in one request; needs a page size and offset/cursor.
- **Image placeholders** — some products won't have photos yet (especially early on). Rather than a broken image icon, a designed placeholder keeps the grid looking intentional rather than broken.

### 1.4 · Product detail pages (6 hrs)

- Routed by slug (`/product/18ct-gold-band`), pulling one product plus its images.
- **Image gallery from `storage_path`** — product photos live in Supabase Storage; the page needs to turn stored paths into actual public URLs and render them as a gallery, not just a single image.
- **Weight, purity, size via `size_label`** — `size_label` is the human-readable display form (handles the bangle-sixteenths formatting so `2.10` displays correctly rather than looking like "two point one zero").
- **Proper 404 on unpublished** — if someone has an old bookmarked link, or guesses a slug, to a product that's now a draft or removed, the page must return Next.js's `notFound()` rather than a broken partial render or (worse) leaking data that shouldn't be public.

### 1.5 · Basket on live prices (3 hrs)

- The basket only ever stores product IDs and quantities — never a price.
- Every time the basket is rendered, prices are fetched fresh from the current data. Since gold-linked prices move at 11am and 3pm daily (once Phase 3 is live), a price shown when something was added two hours ago could already be stale — the basket is deliberately never a source of truth for price, only for "what's in it."
- This is distinct from the price *lock*, which happens later, at checkout (1.6/2.2) — that's the one moment a price is actually frozen.

### 1.6 · The 75g+ "call us" state (3 hrs)

- The three existing pricing modes (`dynamic_jewellery`, `dynamic_bullion`, `fixed`) all assume there's a displayable price. Nothing currently represents "publish this product, but show no price at all."
- Needs: a way to flag a product as enquiry-only, `canPublish()` (the zero-markup guard) skipping its markup check for that flag since there's no price to validate against a band, and the product page rendering a "call us for a quote" button in place of a price/add-to-basket control.
- This exists because of the settled payment-routing decision: 75g+ necklaces aren't sold through Stripe over the 1.5% fee on a high-value item — they're a phone enquiry instead.

### 1.7 · Caching and revalidation (2 hrs)

- Next.js's App Router caches aggressively by default — fetched data, rendered pages, and route segments can all be cached far longer than feels intuitive.
- Without explicit revalidation, publishing a product in the admin panel might not appear on the storefront for a long time, because the storefront page is still serving a cached version from before the publish.
- Fix is calling `revalidatePath` / `revalidateTag` from the admin's publish Server Action (so the specific page is invalidated the moment it changes) and/or setting a short `revalidate` time on storefront routes as a safety net.

### 1.8 · Remove mock data (1 hr)

- The literal deletion of the hardcoded arrays/JSON currently standing in for real data — done last, only once every storefront page has been confirmed working against the real data layer, so there's no way for the app to silently fall back to fake data if a real query fails.

---

## Phase 2 — Commerce

### 2.1 · Stripe checkout (8 hrs)

- Stripe's Payment Intents API: the server creates a `PaymentIntent` for the locked (frozen) price, and the client renders Stripe's Payment Element, which handles card entry, Apple Pay, and Google Pay all through one integration rather than three separate ones.
- The server never sees raw card details — Stripe's client-side element handles that directly, which is also what keeps you out of the heaviest PCI-compliance scope.

### 2.2 · Reservation wiring (4 hrs)

- `create_price_lock` and `release_price_lock` already exist as tested Postgres functions (per the handover) — this task is purely about calling them from the app at the right moments, not building new database logic.
- `create_price_lock` fires the moment a customer enters checkout — it reserves the specific item and freezes its current price into a snapshot.
- `release_price_lock` fires if they navigate back to the basket, or after an expiry timer — freeing the item for someone else to reserve.

### 2.3 · Webhooks and order creation (6 hrs)

- Stripe sends events (payment succeeded, failed, etc.) to a webhook endpoint your app exposes — which must verify Stripe's signature on every request so it can't be spoofed.
- On `payment_intent.succeeded`, call `consume_price_lock` — this finalises the reservation and returns the frozen price snapshot from step 2.2. The order is built *from that snapshot*, not from a fresh product lookup, because the live price may have moved in the minutes since checkout began.
- Every Stripe event matters, not just the success case — a failed or cancelled payment needs handling too, or a lock can end up stuck in limbo, neither consumed nor released.

### 2.4 · The late-payment refund path (3 hrs)

- The race condition this covers: a price lock expires and releases (say after 15 minutes), the item gets reserved by someone else, and *then* the first customer's payment confirms anyway — a slow bank authorisation or a 3D Secure step that took too long.
- `consume_price_lock` is built to raise an error in exactly this situation, since the lock it's being asked to consume no longer exists. The app's job is to catch that specific error and automatically trigger a Stripe refund, rather than either crashing or — much worse — silently creating an order for an item that's already sold to someone else.
- Rare in practice, but the kind of edge case that's very bad if it's ever hit unhandled — a customer charged for something they can't have.

### 2.5 · Order confirmation emails (3 hrs)

- Fires from inside the webhook handler once an order is successfully created — two emails, one to the customer (their receipt) and one internal to the shop (so staff know there's an order to fulfil).
- Depends on 0.5 already existing — this task is just calling `send()` with the right template and order data, not building email infrastructure from scratch.

### 2.6 · Payment routing by category (4 hrs)

- Business logic sitting in front of checkout: before a customer can start the Stripe flow, the app checks the product's category / pricing mode. Bullion and 75g+ items are never allowed to reach Stripe at all — that's a settled decision over the 1.5% fee on high-value items.
- Bullion shows a price and directs to a bank-transfer/in-store flow; 75g+ shows the "call us" state from 1.6 instead of any price.
- Worth building this as a configuration check (category/mode → allowed payment path) rather than scattering `if` statements through the checkout code — the handover notes this decision may reverse if a Stripe consultation gets a better rate, and a config-driven version is far cheaper to flip later than logic buried across multiple files.
