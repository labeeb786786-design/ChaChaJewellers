-- Wrapper that is what actually gets scheduled -- NOT
-- cleanup_abandoned_draft_products() directly.
--
-- The raw function returns storage paths rather than deleting files,
-- because Postgres cannot reach Supabase Storage. Scheduling it directly
-- would discard that result set and silently orphan every image file. This
-- wrapper captures the paths into storage_cleanup_queue in the same
-- statement, and returns counts suitable for the cron job log.
--
-- NOTE: applied directly to the live project via MCP; this file records
-- that change after the fact.
create or replace function public.run_abandoned_draft_cleanup()
returns table(deleted_products bigint, storage_paths_queued bigint)
language sql
security definer
set search_path to 'public'
as $function$
  with cleaned as (
    select deleted_product_id, storage_path
    from public.cleanup_abandoned_draft_products()
  ),
  queued as (
    insert into public.storage_cleanup_queue (product_id, storage_path)
    select deleted_product_id, storage_path
    from cleaned
    where storage_path is not null
    returning 1
  )
  select
    (select count(distinct deleted_product_id) from cleaned),
    (select count(*) from queued);
$function$;

-- security definer: reachable only by the scheduler, never by a client.
revoke execute on function public.run_abandoned_draft_cleanup() from anon, authenticated;
grant execute on function public.run_abandoned_draft_cleanup() to service_role;
