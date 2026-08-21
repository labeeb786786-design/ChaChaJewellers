# Daily task schedule — Chacha Jewellers, 22 Aug to 10 Sept

Hour-by-hour schedule, every day to launch. Rebuilt to account for shop shifts on Sat 22 and Sun 23 Aug.

**Rules this is built on:**
- No day exceeds **6.5 hours** of project work.
- **3 hours of Catch-up Hours every 4 days** (25 Aug, 29 Aug, 2 Sept, 6 Sept), counted inside that day's 6.5.
- **Shop days** use your real windows: optional 08:00–09:15 morning block before leaving at 10:00, then 21:00 onwards after getting home at 20:30 and eating. ~4.75h, not 6.5.
- Free days start 09:00, 10-minute break between tasks, 45-minute lunch once ~3.5h is done.
- 21 Aug was laptop/repo setup only.
- Every task is its own calendar event, tagged `chacha-sync-managed: true`.

**Track A** = critical path (Phase 0/1/2). **Track B** = parallel-eligible (Phase 3/4/6). **CU** = catch-up.

## The schedule

| Date | Time | Task |
|---|---|---|
| **Sat 22 Aug** 🏪 | 08:00–09:15 | **A** 0.1 Vercel env vars + 0.2 cleanup jobs *(optional morning)* |
| | 21:00–22:00 | **A** 0.3 Migrate FAQs into `ai_faqs` |
| | 22:10–00:40 | **A** 0.5 Email service (pt 1) |
| **Sun 23 Aug** 🏪 | 08:00–09:15 | **A** 0.5 Email service (pt 2) + 0.4 TOTP start *(optional morning)* |
| | 21:00–00:30 | **A** 0.4+5.1 TOTP + rate limiting (pt 2) |
| **Mon 24 Aug** | 09:00–10:45 | **A** 0.4+5.1 TOTP + rate limiting (pt 3) |
| | 10:55–12:55 | **A** 0.6 Small correctness items |
| | 13:50–14:50 | **A** 5.2 CI secret-key check |
| | 15:00–16:00 | **A** 5.3 Dependency monitoring |
| | 16:10–16:55 | **A** 5.4 Supabase dev branch (pt 1) |
| **Tue 25 Aug** ⚡ | 09:00–10:15 | **A** 5.4 Supabase dev branch (pt 2) — *Phase 0 done* |
| | 10:25–12:40 | **A** 1.2 Storefront data layer (pt 1) |
| | 13:35–16:35 | **CU** Catch-up Hours |
| **Wed 26 Aug** | 09:00–09:45 | **A** 1.2 Storefront data layer (pt 2) |
| | 09:55–15:40 | **A** 1.3 Listing & category pages (pt 1) — *chase client today* |
| **Thu 27 Aug** | 09:00–11:15 | **A** 1.3 Listing & category pages (pt 2) |
| | 11:25–15:40 | **A** 1.4 Product detail pages (pt 1) |
| **Fri 28 Aug** | 09:00–10:45 | **A** 1.4 Product detail pages (pt 2) |
| | 10:55–13:55 | **A** 1.5 Basket on live prices |
| | 14:50–16:35 | **A** 1.6 75g+ call-us state (pt 1) |
| **Sat 29 Aug** ⚡ | 09:00–10:15 | **A** 1.6 75g+ call-us state (pt 2) |
| | 10:25–12:25 | **A** 1.7 Caching & revalidation |
| | 12:35–12:50 | **A** 1.8 Remove mock data (pt 1) |
| | 13:45–16:45 | **CU** Catch-up Hours |
| **Sun 30 Aug** | 09:00–09:45 | **A** 1.8 Remove mock data (pt 2) — *Phase 1 done* |
| | 09:55–15:40 | **A** 2.1 Stripe checkout (pt 1) |
| **Mon 31 Aug** | 09:00–11:15 | **A** 2.1 Stripe checkout (pt 2) |
| | 11:25–15:25 | **A** 2.2 Reservation wiring |
| | 16:20–16:35 | **A** 2.3 Webhooks (pt 1 — setup) |
| **Tue 1 Sept** | 09:00–14:45 | **A** 2.3 Webhooks & order creation (pt 2) |
| | 15:40–16:25 | **A** 2.4 Late-payment refund path (pt 1) |
| **Wed 2 Sept** ⚡ | 09:00–11:15 | **A** 2.4 Late-payment refund path (pt 2) |
| | 11:25–12:40 | **A** 2.5 Order confirmation emails (pt 1) |
| | 13:35–16:35 | **CU** Catch-up Hours |
| **Thu 3 Sept** | 09:00–10:45 | **A** 2.5 Confirmation emails (pt 2) |
| | 10:55–14:55 | **A** 2.6 Payment routing — *Phase 2 done* |
| | 15:50–16:35 | **B** 3.1 Rate source (pt 1 — research) |
| **Fri 4 Sept** | 09:00–12:15 | **B** 3.1 Rate fetch job (pt 2) |
| | 12:25–13:25 | **B** 3.2 Schedule 11am/3pm |
| | 14:20–16:20 | **B** 3.3 Two stale-rate alarms |
| | 16:30–16:45 | **B** 3.4 Test rate guards (pt 1) |
| **Sat 5 Sept** | 09:00–10:45 | **B** 3.4 Test rate guards (pt 2) |
| | 10:55–14:55 | **B** 3.5 Public metals display — *Phase 3 done* |
| | 15:50–16:35 | **B** 4.2 Privacy policy (pt 1) |
| **Sun 6 Sept** ⚡ | 09:00–10:15 | **B** 4.2 Privacy policy (pt 2) |
| | 10:25–12:40 | **B** 4.3 Cookie consent (pt 1) |
| | 13:35–16:35 | **CU** Catch-up Hours *(or 6.2 AI assistant if answers arrived)* |
| **Mon 7 Sept** | 09:00–09:45 | **B** 4.3 Cookie consent (pt 2) |
| | 09:55–10:55 | **B** 4.4 Returns policy page |
| | 11:05–12:05 | **B** 4.5 Delivery page — *Phase 4 done bar T&Cs* |
| | 12:15–16:00 | **B** 6.1 Google Reviews sync (pt 1) |
| **Tue 8 Sept** | 09:00–09:15 | **B** 6.1 Google Reviews sync (pt 2) |
| | 09:25–15:25 | **B** 6.3 Local SEO |
| | 16:20–16:35 | **B** 6.4 Search & filtering (pt 1) |
| **Wed 9 Sept** | 09:00–11:15 | **B** 6.4 Search & filtering (pt 2) |
| | 11:25–15:25 | **QA** QA & buffer (protected) |
| **Thu 10 Sept** | 09:00–12:30 | **B** 6.4 Search & filtering (pt 3) — *all phases done* |
| | afternoon | **LAUNCH** — deploy, smoke-test, monitor |

🏪 = shop day · ⚡ = catch-up day

## What the two shop days cost

Sat and Sun drop from 6.5h to ~4.75h each — **3.5 hours of capacity gone**. That shortfall didn't disappear; it pushed the tail of the schedule into launch-day morning.

The 3.5h that landed there is **6.4 (search & filtering)**, chosen deliberately:

- It's Track B — nothing depends on it
- It doesn't touch checkout, so finishing it late can't break the purchase path
- It's refinement on pages that already work

**If anything slips between now and then, 6.4 is the block to sacrifice.** Ship without search rather than delaying launch or eating the QA block. It can follow the day after launch with no commercial impact.

## The numbers

- Backlog scheduled: **~111 hrs**
- Catch-up reserved: **12 hrs** (4 × 3h)
- Every day at or under the 6.5h cap
- QA block on 9 Sept stays protected

## Contingent and blocked items

- **1.8 (remove mock data)** — scheduled 29–30 Aug, blocked until real product data arrives. Rolls forward rather than being done against fake data.
- **6.2 (AI assistant, 8h)** — no fixed slot, blocked on the client's ~60 Q&A answers. Natural home is the 6 Sept catch-up block. Not on the critical path.
- **4.1 (T&Cs)** — with the client's solicitor, not schedulable.

## A note on the morning blocks

The 08:00–09:15 blocks on shop days are marked optional in the calendar. You said you *may* have time before leaving — not that you will. If you skip them, that work rolls into Tuesday's catch-up, which is exactly why the first catch-up block sits right after the weekend.
