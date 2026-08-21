# Sync state — Chacha Jewellers GitHub → Calendar automation

Internal state file for the daily automated check. Not a human-facing doc — see `chacha-jewellers-progress.md` and `chacha-jewellers-daily-tasks.md` for the readable versions.

- repo: https://github.com/labeeb786786-design/ChaChaJewellers (public as of baseline; re-check each run)
- last_synced_commit: 192c042b239b93daae91aec56a9f5f4996e26eea
- last_synced_commit_date: 2026-08-21 20:23:50 +0100
- last_synced_commit_message: "Completion of admin panel and light review of admin panel"
- baseline_established: 2026-08-21
- last_run: 2026-08-21 (baseline + calendar rebuild to daily-task-list model, not yet run on schedule)
- last_run_status: baseline + rebuilt as daily task list per Labeeb's request (superseded the earlier 7-checkpoint model same day)

## Model: one timed calendar event per TASK

Design has been revised twice on 21 Aug 2026: 7 phase checkpoints → one all-day event per day → (current) **one timed event per individual task**, each with a projected start and end time. See `chacha-jewellers-daily-tasks.md` for the full table.

Current constraints baked into the schedule:
- Hard cap of **6.5 hours of project work per day**. Never schedule beyond it.
- **3h "Catch-up Hours" every 4 days** (25 Aug, 29 Aug, 2 Sept, 6 Sept), counted inside that day's 6.5h.
- Free days start 09:00, 10-min gaps between tasks, 45-min lunch after ~3.5h.
- **Shop days** (Labeeb works ~3 days/week at a jewellery shop, 11:00–19:00, out of the house 10:00–20:30) use different windows: an OPTIONAL 08:00–09:15 morning block, then 21:00 onwards. Capacity ~4.75h, not 6.5h. Known shop days so far: **Sat 22 Aug, Sun 23 Aug**. Future shop days are decided ad hoc — if Labeeb reports one, reschedule that day to those windows and push the tail.
- 21 Aug was laptop/repo setup only — no build tasks.
- The final 3.5h of task 6.4 (search & filtering) sits on **launch-day morning, 10 Sept 09:00–12:30**, because the two shop days cost exactly that much capacity. This block is the designated sacrifice if anything slips — it's Track B, doesn't touch checkout, and can ship the day after launch. Never resolve a slip by moving QA or the launch instead.
- Task events are titled `[Chacha] <task id> <name>` and carry `task:` and `track:` fields in the description.

Because there are now ~45 task events rather than 21 day events, the ID table below is not exhaustively maintained. To find an event, use `mcp__Google_Calendar__list_events` on the relevant date range and match on the `[Chacha]` title prefix plus the `task:` field in the description.

Automation behaviour:

- **No new commits since last check:** no-op. Don't touch the calendar.
- **New commits found:** figure out which task(s) they most likely complete (see the mapping guidance in `chacha-jewellers-phases-0-1-2-explained.md` and `chacha-jewellers-completion-plan.md`). Find that task's event(s) and prefix the summary with "✓" — e.g. `[Chacha] ✓ 1.3 Listing & category pages (pt 1)`. Don't delete the event; the log stays legible that way.
- **A task didn't get done on its scheduled day:** reschedule its event to the next day that has room under the 6.5h cap — preferably into or adjacent to the next Catch-up Hours block, since that's what the slack exists for. Append a line to the description noting the move, e.g. "Carried from 25 Aug." Never push a day past 6.5h total to make something fit; push the tail of the schedule instead.
- **Never exceed 6.5 hours of scheduled project work on any single day.** This is Labeeb's explicit constraint, not a soft target.
- **Never repurpose a Catch-up Hours block into ordinary backlog** at schedule time. It can absorb slipped work when work has actually slipped, but it should not be pre-filled with new tasks during a routine run.
- **Never touch:** the "QA & buffer (protected)" block on 9 Sept 11:25–15:25 — no feature backlog into it, only QA/testing content — and never move the "LAUNCH" event on 10 Sept (id `p3m6u0db55n6supgrs5pb07200`) under any circumstance. If the pace genuinely can't support 10 Sept, say so clearly in the run summary and log it below, but leave the LAUNCH date alone — that's Labeeb's call to make with his client, not the automation's.
- Only ever touch events carrying `chacha-sync-managed: true` in the description — never anything else on the calendar.

## Fixed event IDs worth keeping

| What | Event id |
|---|---|
| 21 Aug — laptop/repo setup | d7te20ka610mmi81ajhchb96ag |
| 9 Sept — QA & buffer (protected) | 4haan7je2s9c60nacp9aqjneqc |
| 10 Sept — LAUNCH (never move) | p3m6u0db55n6supgrs5pb07200 |

All other events are per-task and should be located by listing the date range and matching the `[Chacha]` title prefix and `task:` field, rather than by a stored ID.

## Known gap, flagged 21 Aug 2026, unresolved

`docs/completion-plan.md`, `docs/hazard-register.md`, `docs/open-flags-register.md` are not committed to the repo — only `docs/admin-brief.md`, `docs/admin-brief-addendum.md`, `docs/admin-protoype.html`.

## Security note, flagged 21 Aug 2026, pending Labeeb's action

Repo is currently public and `supabase/migrations/20260818223510_set_confirmed_jewellery_markups.sql` exposes the client's exact confirmed markup percentages in a plaintext comment. Labeeb said he'll make the repo private once the calendar is set up to his liking, then provide a read-only token. **Once that happens, update the clone step in the trigger to use the token (ask in the run's own output if one hasn't been supplied yet, rather than failing silently) and update this note.**
