-- cleanup_abandoned_draft_products() predates products.removed_at. Its
-- original WHERE clause (is_active = false AND updated_at stale) also
-- matches a "removed" product once enough time has passed — is_active is
-- false for those too, deliberately, and their updated_at stops moving
-- once nothing touches the row anymore. Left alone, the cleanup job would
-- eventually hard-delete a removed product, which is exactly what
-- removeProduct() is designed not to do (order_items and price_locks hold
-- foreign keys to that row on purpose).
--
-- Adds removed_at IS NULL to the target set: only a genuinely abandoned,
-- never-finished draft qualifies, never a deliberately removed product.
CREATE OR REPLACE FUNCTION "public"."cleanup_abandoned_draft_products"()
RETURNS TABLE("deleted_product_id" "uuid", "storage_path" "text")
    LANGUAGE "sql"
    AS $$
  with abandoned as (
    select p.id
    from public.products p
    where p.is_active = false
      and p.removed_at is null
      and p.updated_at < now() - interval '1 hour'
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
$$;

ALTER FUNCTION "public"."cleanup_abandoned_draft_products"() OWNER TO "postgres";
