# Delivery schedule — Chacha Jewellers

Compiled 21 August 2026. Supersedes the "what I'd cut" section of `chacha-jewellers-completion-plan.md` — **nothing is being cut. All six phases ship by 10 September.**

## The arithmetic that makes this work

- Total scope, all phases: ~115 hrs
- Today (Fri 21 Aug) to launch (Thu 10 Sept): 20 calendar days available to work (Sept 10 itself reserved as launch day, not build day)
- Real availability, not a flat average: ~3 days/week at a jewellery-shop sales job (irregular, occasionally an extra day, sometimes a full week off the shop when behind on this project), evenings only on shop days (~3.5 hrs, ~4.75 hrs if an optional morning block gets used), full days when off (~9.5 hrs, with 4 hours of personal time protected). See `chacha-jewellers-daily-schedule.md` for the actual hour-by-hour blocks.
- Over 20 days at roughly 3/7 shop-days and 4/7 free-days, that works out to **~139–149 hours available** against the 115-hour target — roughly **24–34 hours of slack**, not a tight squeeze.

This means hours were never really the constraint, even before this was confirmed with real numbers. It's comfortably achievable **if** the two client dependencies move this week. It is not achievable if they don't — no amount of schedule slack fixes a missing solicitor or missing product photos.

## Dependency map (why the order below isn't just 0→1→2→3→4→5→6)

- **Hard serial chain:** Phase 0 → Phase 1 (core) → Phase 2. Each genuinely needs the last.
- **Independent of everything else, can run any time:** Phase 3 (pricing automation), Phase 4's static pages (4.2–4.5), Phase 5's 5.2/5.3 (CI secret check, dependency monitoring).
- **Pulled forward from where the original plan put them:**
  - 5.4 (Supabase dev branch) — move to right after Phase 0. Testing Stripe against the live database once real orders can exist is the kind of mistake the traps list warns about; get a dev branch before Phase 2 starts, not after.
  - 5.1 (login rate limiting) — pair with 0.4 (TOTP) since both touch the login route in the same sitting.
- **Gated on the client, chase starting today, not when the plan reaches them:** 1.1 (product data/photos), 4.1 (T&Cs), 6.2's ~60 Q&A answers for the assistant. All three are client-side text/asset requests — there's no reason to wait until "Phase 4" or "Phase 6" to ask. Send one message today covering all three.
- **Gated on Phase 1 pages existing:** 6.4 (search/filtering) refines pages that already work, so it sits in week 3.

## Week 1 — Fri 21 to Thu 27 Aug (7 days, ~30–35 hrs)

**Build:**
- Phase 0 in full (11 hrs) — env vars, cleanup jobs scheduled, FAQs migrated, TOTP + 5.1 rate limiting together, email service
- 5.2 + 5.3 + 5.4 (4 hrs) — CI secret-key check, Dependabot, Supabase dev branch. Small, do them before Stripe work starts.
- Start Phase 1: 1.2 data layer (3 hrs), begin 1.3/1.4 listing and detail pages against seed/test products (~10 hrs) — don't wait for real product data to start the plumbing, only the final content pass waits on it
- Phase 4 static pages in parallel as low-focus filler: 4.2 privacy, 4.4 returns, 4.5 delivery (~4 hrs)

**Chase today:** one message to the client covering product data/photos (1.1), confirmation the solicitor is engaged for T&Cs (4.1), and the ~60 assistant Q&A answers (6.2). Put a date on it — e.g. "need the first batch by Wed 26th to stay on track."

## Week 2 — Fri 28 Aug to Thu 3 Sept (7 days incl. Mon 31 Aug UK bank holiday, ~35–40 hrs)

**Build:**
- Finish Phase 1: 1.5 basket, 1.6 the 75g+ call-us state, 1.7 caching/revalidation (~16 hrs). Hold 1.8 (remove mock data) until real product data is confirmed in.
- Phase 2, the big one: 2.1 Stripe checkout, 2.2 reservation wiring, 2.3 webhooks/order creation (~18 hrs). This is the phase that doesn't tolerate "nearly working" — give it the focused weekend hours, not tired weekday leftovers.
- Phase 3 in full as parallel filler on lighter evenings (13 hrs) — fully independent of Stripe.
- 4.3 cookie consent (3 hrs).

**Checkpoint by end of week 2:** if product data/photos still haven't arrived, this is the point to escalate — not week 3.

## Week 3 — Fri 4 to Wed 9 Sept (6 days, ~35–40 hrs) — then Thu 10 Sept launch

**Build:**
- Finish Phase 2: 2.4 late-payment refund path, 2.5 order confirmation emails, 2.6 payment routing by category (~10 hrs)
- 1.8 remove mock data, once real data is in (1 hr)
- Phase 6, whatever isn't already client-blocked: 6.1 Google Reviews sync, 6.3 local SEO, 6.4 search/filtering (~16 hrs). 6.2 the AI assistant (8 hrs) only once the 60 answers are in — if they're not in by now, this is the one piece that could genuinely slip past launch without threatening the shop's ability to trade.
- Reserve the last 2 days (8–9 Sept) as buffer/QA: cross-device pass, real-money Stripe test transaction, checking every "traps that have caused problems" item against the live build.

**Thu 10 Sept:** deploy, smoke-test the full purchase path end to end, monitor.

## What could still move this date

- Product data/photography (1.1) arriving late or thin
- T&Cs (4.1) stuck with the solicitor
- The 60 assistant answers (6.2) not landing — lowest-risk of the three since the assistant isn't required for the shop to trade
- Phase 2 taking longer than 28 hrs once real edge cases show up — it's the one phase where "roughly on schedule" isn't good enough to skip careful review

None of these are fixed by working faster. They're fixed by asking the client today and following up if the answer doesn't come by the dates above.
