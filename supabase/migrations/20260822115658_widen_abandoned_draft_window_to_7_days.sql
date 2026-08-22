-- Widens the abandoned-draft window from 1 hour to 7 days.
--
-- The 1-hour window was far too aggressive for real admin use: a product
-- part-created in one sitting and finished the next day would be deleted
-- out from under the admin. 7 days means only a genuinely abandoned draft
-- qualifies.
--
-- Everything else is unchanged from
-- 20260819130000_exclude_removed_from_draft_cleanup.sql.
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
