-- Photo activity (upload, star, reorder, delete) only ever touches
-- product_images — it never updates the parent products row. Left alone,
-- that means a long photo-organising session on a still-unsaved draft
-- doesn't bump products.updated_at, which defeats the entire point of
-- keying cleanup off updated_at rather than created_at: the draft could be
-- deleted mid-edit exactly because the edit was "only" photos.
--
-- Fixes it generally, at the table level, so any current or future code
-- path that touches product_images keeps the parent row's updated_at
-- honest — not something every Server Action has to remember to do itself.
CREATE OR REPLACE FUNCTION "public"."touch_product_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.products
  set updated_at = now()
  where id = coalesce(new.product_id, old.product_id);
  return coalesce(new, old);
end;
$$;

ALTER FUNCTION "public"."touch_product_updated_at"() OWNER TO "postgres";

CREATE OR REPLACE TRIGGER "product_images_touch_product"
  AFTER INSERT OR UPDATE OR DELETE ON "public"."product_images"
  FOR EACH ROW EXECUTE FUNCTION "public"."touch_product_updated_at"();

GRANT ALL ON FUNCTION "public"."touch_product_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_product_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_product_updated_at"() TO "service_role";


-- Cleans up draft product rows that ensureDraftProduct() creates when an
-- image is added on the "new product" page before the form has been saved
-- (see app/admin/(protected)/products/actions.ts). A draft qualifies once
-- it's been untouched for an hour — updated_at, not created_at, so a
-- genuinely long editing session (photos included, per the trigger above)
-- is never at risk mid-edit.
--
-- The order_items check should never actually exclude anything — nothing
-- this function targets (is_active = false, never published) can have been
-- purchased. It's here anyway as a backstop: order_items.product_id is
-- ON DELETE SET NULL, not RESTRICT, so the foreign key alone would not
-- stop this function from deleting a product with real order history if
-- some future bug ever let one match. The NOT EXISTS check is what
-- actually prevents that.
--
-- Deletes only the products and product_images rows (product_images
-- cascades automatically via product_images_product_id_fkey ON DELETE
-- CASCADE). It does NOT touch the storage bucket — Postgres has no way to
-- call the Storage API directly. It returns the storage_path of every
-- image that was freed so a caller (a scheduled Edge Function or Route
-- Handler, not built yet — this migration only adds the function, per the
-- brief, no schedule) can delete those files via the service-role client,
-- the same way deleteProductImage() already does.
CREATE OR REPLACE FUNCTION "public"."cleanup_abandoned_draft_products"()
RETURNS TABLE("deleted_product_id" "uuid", "storage_path" "text")
    LANGUAGE "sql"
    AS $$
  with abandoned as (
    select p.id
    from public.products p
    where p.is_active = false
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

-- service_role only — a privileged background job, not something an admin
-- triggers ad hoc, matching purge_expired_price_locks().
GRANT ALL ON FUNCTION "public"."cleanup_abandoned_draft_products"() TO "service_role";
