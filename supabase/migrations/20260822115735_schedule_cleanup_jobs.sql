-- Task 0.2: the two nightly cleanup jobs.
--
-- cron.schedule() upserts by job name, so this migration is safe to re-run.
--
-- Schedules are evaluated in UTC on Supabase regardless of the database
-- timezone -- 03:00 UTC is 04:00 BST. Both jobs are staggered 15 minutes
-- apart so the price-lock purge has settled before the draft cleanup runs
-- (the draft cleanup skips products still referenced by price_lock_items).
--
-- The third planned job -- the orphaned Storage file sweep that drains
-- storage_cleanup_queue -- is NOT here. It cannot be a plain Postgres
-- function, since Postgres has no access to the Storage object backend;
-- the implementation is still to be decided.
--
-- NOTE: applied directly to the live project via MCP; this file records
-- that change after the fact.
select cron.schedule(
  'purge-expired-price-locks',
  '0 3 * * *',
  $$ select public.purge_expired_price_locks(); $$
);

select cron.schedule(
  'cleanup-abandoned-draft-products',
  '15 3 * * *',
  $$ select public.run_abandoned_draft_cleanup(); $$
);
