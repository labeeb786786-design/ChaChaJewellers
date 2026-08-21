# Completion plan — Chacha Jewellers

Ordered by dependency, then by risk. Compiled 21 August 2026, target 10 September.

Estimates assume focused work, not calendar days. ★ = launch-critical. Items without a star can ship after launch without stopping the shop trading.

## Phase 0 — Unblockers

Small, but everything downstream waits on them.

- **0.1 · Vercel environment variables ★ — 15 min.** Three variables, then redeploy. `/admin` currently errors on the deployed site, so the client can't see anything.
- **0.2 · Schedule the three cleanup jobs ★ — 1 hr.** `cleanup_abandoned_draft_products()`, `purge_expired_price_locks()`, and the orphaned-file sweep. All written, none scheduled. From day one of real use, drafts and orphaned files accumulate with nothing collecting them.
- **0.3 · Migrate hardcoded FAQs into `ai_faqs` — 1 hr.** One-off. Gets real rows into the panel and gives the client a starting point rather than a blank page.
- **0.4 · TOTP enrolment ★ — 4 hrs.** Forced on first login, per-device challenge, recovery codes. One password currently guards everything.
- **0.5 · Email service (Resend or similar) ★ — 3 hrs.** Needed by three separate things: order confirmations, the two rate alarms, and made-to-order enquiries. Do it once, early. Supabase's built-in sender is not sufficient.
- **0.6 · Small correctness items from the flags register — 2 hrs.** Bangle size cap at `.15`, the `findBlockedProductIds` counting query, the formula-mirror comment, and confirming the unpriceable-band failure is readable.

Phase total: ~11 hrs

## Phase 1 — Storefront foundation

The largest single block, and everything commercial sits on it.

- **1.1 · Real product data ★ — client dependency.** At least 20–30 products with weights, purity, sizes and photos. Wired pages built against two test rings will look broken and hide real bugs. This is the critical path — chase it hard.
- **1.2 · Data layer ★ — 3 hrs.** One file holding every storefront query. Published-only, RLS-respecting, anon key.
- **1.3 · Listing and category pages ★ — 8 hrs.** Shop page, category pages resolving by slug and including children, pagination, image placeholders for products without photos.
- **1.4 · Product detail pages ★ — 6 hrs.** Route by slug, image gallery from `storage_path`, weight, purity, size via `size_label`, proper 404 on unpublished.
- **1.5 · Basket on live prices ★ — 3 hrs.** Holds IDs and quantities only. Prices fetched fresh each render, so they move while items sit in the basket.
- **1.6 · The 75g+ "call us" state ★ — 3 hrs.** No pricing mode currently expresses "publish with no price". Needs an enquiry state, `canPublish()` skipping the markup check for it, and a call-us button instead of a price.
- **1.7 · Caching and revalidation ★ — 2 hrs.** Next.js caches hard. A newly published product must appear promptly.
- **1.8 · Remove mock data ★ — 1 hr.** Only once every page is confirmed on real data.

Phase total: ~26 hrs, plus the client dependency

## Phase 2 — Commerce

Where real money starts moving. Nothing here tolerates "nearly working".

- **2.1 · Stripe checkout ★ — 8 hrs.** Payment intents, Apple Pay and Google Pay, card handling.
- **2.2 · Reservation wiring ★ — 4 hrs.** `create_price_lock` on entering checkout, `release_price_lock` on returning to basket. The database layer is built and tested; nothing calls it.
- **2.3 · Webhooks and order creation ★ — 6 hrs.** `consume_price_lock`, build the order from the lock's snapshot, handle every Stripe event including the failure cases.
- **2.4 · The late-payment refund path ★ — 3 hrs.** A payment can confirm after a lock expires and the item has gone to someone else. `consume_price_lock` raises correctly; the caller must catch it and auto-refund. Rare, and very bad unhandled.
- **2.5 · Order confirmation emails ★ — 3 hrs.** To the customer, and to the shop. Not on your feature list, and a shop cannot launch without it.
- **2.6 · Payment routing by category ★ — 4 hrs.** Bullion and 75g+ are bank transfer or in store. New scope from the client's requirements document — worth pricing separately if this is fixed-fee.

Phase total: ~28 hrs

## Phase 3 — Pricing automation

Self-contained. Can slot into any gap. The manual rate holds until it's done.

- **3.1 · Rate source and fetch job ★ — 4 hrs.** Choose an API, check commercial terms, store the key, write the fetch. Must insert AND call `apply_metal_prices()` — inserting alone leaves prices frozen while the log fills with healthy-looking rows.
- **3.2 · Schedule at 11am and 3pm ★ — 1 hr.** Vercel Cron or Supabase scheduled functions.
- **3.3 · The two stale alarms ★ — 2 hrs.** Fetch alarm at 6+ hours, apply alarm at 21+ hours, both emailing you. Dashboard cards already highlight; nothing sends.
- **3.4 · Test the rate guards — 2 hrs.** Five guard values have never seen a real API response. Feed them deliberately bad data.
- **3.5 · Public metals display — 4 hrs.** Homepage, Sell Your Gold, Precious Metals pages. Informational, reads `current_metal_prices`.

Phase total: ~13 hrs

## Phase 4 — Legal and compliance

Not on your feature list. Genuinely blocks launch for a UK shop taking payments.

- **4.1 · Terms and conditions ★ — client dependency.** Solicitor or accountant, not adapted from online, given high-value goods and bank transfers.
- **4.2 · Privacy policy ★ — 2 hrs.** Required by UK GDPR. Must cover Stripe, Supabase and Google.
- **4.3 · Cookie consent ★ — 3 hrs.** Required before any non-essential cookie is set. Google Reviews and analytics both trigger this.
- **4.4 · Returns policy page ★ — 1 hr.** Content confirmed: two weeks, unused items. Needs publishing as a page.
- **4.5 · Delivery information page ★ — 1 hr.** £15 per item, Royal Mail insured, no minimum.

Phase total: ~7 hrs, plus the T&Cs dependency

## Phase 5 — Security and hardening

- **5.1 · Rate limiting on login ★ — 2 hrs.** Unlimited attempts currently.
- **5.2 · CI check for the service role key ★ — 1 hr.** Grep the build output, fail the build.
- **5.3 · Dependency monitoring — 1 hr.** Dependabot or equivalent.
- **5.4 · Supabase branch for development — 2 hrs.** `localhost` currently talks to the live database. Increasingly risky once real orders exist.

Phase total: ~6 hrs

## Phase 6 — Content and discovery

None of this stops the shop trading. All of it can follow launch.

- **6.1 · Google Reviews sync — 4 hrs.** Places API, capped at five by Google.
- **6.2 · AI assistant — 8 hrs.** Blocked on roughly 60 client answers. The widget shell exists; the content doesn't.
- **6.3 · Local SEO — 6 hrs.** Google Business Profile, NAP consistency, local keyword copy, schema markup.
- **6.4 · Search and filtering — 6 hrs.** Full-text on `search_vector`, filter by category, price, weight, size. Refinement on pages that already work.

Phase total: ~24 hrs

## The honest arithmetic

- Launch-critical (★): roughly 85 hours
- Everything: roughly 115 hours
- Working days to 10 September: 14

That's 6 hours a day of focused build, every day, with no slippage — and it assumes the client's product data and photography arrive this week.

**What I'd cut to make the date:** Phase 6 entirely. Reviews, the assistant, SEO and search are the four features nobody's purchase depends on. That gets launch-critical work to roughly 85 hours, which is tight but real.

**What can't be cut:** Phases 0 through 4. A shop that can't take payment, send a confirmation email, or show a privacy policy isn't launchable.

The real risk isn't the code. It's 1.1 and 4.1 — product data, photography, and the T&Cs. Every line could ship on time and there could still be nothing to sell.

## Suggested framing for the client

A working shop on 10 September with a partial catalogue — 100 well-photographed pieces, Stripe live, prices tracking gold. Then reviews, the assistant, SEO and search across the following fortnight.

That's deliverable. It gets him trading on schedule instead of explaining a delay, and a site with 100 good photos sells better than one with 600 poor ones.
