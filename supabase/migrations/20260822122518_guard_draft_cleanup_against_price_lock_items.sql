-- Bug fix found during an audit of the newly scheduled cleanup jobs.
--
-- price_lock_items.product_id is ON DELETE RESTRICT.
-- cleanup_abandoned_draft_products() already excluded products referenced
-- by order_items, but had no equivalent guard for price_lock_items.
--
-- Because the function body is a single SQL statement, one abandoned draft
-- still referenced by a price lock raised SQLSTATE 23503 and aborted the
-- ENTIRE nightly run -- deleting nothing at all, including unrelated
-- drafts, and failing again every night until someone cleared the row by
-- hand.
--
-- Reproduced against the live schema: two eligible drafts, one holding a
-- price_lock_items row -> 0 products deleted, error raised. After this fix
-- the locked draft is skipped, the clean draft is deleted, and its storage
-- path is queued.
--
-- Identical to 20260822115658 apart from the added price_lock_items guard
-- in the "abandoned" CTE.
--
-- NOTE: applied directly to the live project via MCP; this file records
-- that change after the fact.
create or replace function public.cleanup_abandoned_draft_products()
returns table(deleted_product_id uuid, storage_path text)
language sql
as $function$
  with abandoned as (
    select p.id
    from public.products p
    where p.is_active = false
      and p.removed_at is null
      and p.updated_at < now() - interval '7 days'
      and not exists (
        select 1 from public.order_items oi where oi.product_id = p.id
      )
      and not exists (
        select 1 from public.price_lock_items pli where pli.product_id = p.id
      )
  ),
  paths as (
    select pi.product_id, pi.storage_path
    from public.product_images pi
    where pi.product_id in (select id from abandoned)
  ),
  deleted as (
    delete from public.products p
    where p.id in (select id from abandoned)
    returning p.id
  )
  select d.id as deleted_product_id, pa.storage_path
  from deleted d
  left join paths pa on pa.product_id = d.id;
$function$;
