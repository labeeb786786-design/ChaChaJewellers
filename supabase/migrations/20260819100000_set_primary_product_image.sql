-- A naive "clear the old primary, then set the new one" from application
-- code is two separate requests, each its own transaction: an interruption
-- between them (or the wrong order) either leaves the product with no
-- primary image at all, or trips product_images_one_primary_idx (the
-- partial unique index allowing at most one is_primary per product) by
-- momentarily having two rows claim it. Wrapping both updates in one
-- function call makes them one transaction — atomic from the caller's side,
-- and immune to partial application.
--
-- Deliberately SECURITY INVOKER (the default): it runs as the calling
-- user, so the existing product_images_admin_all RLS policy (is_admin())
-- still gates it. No need to re-check admin status or bypass RLS here.
CREATE OR REPLACE FUNCTION "public"."set_primary_product_image"("p_product_id" "uuid", "p_image_id" "uuid") RETURNS void
    LANGUAGE "plpgsql"
    AS $$
begin
  if not exists (
    select 1 from public.product_images
    where id = p_image_id and product_id = p_product_id
  ) then
    raise exception 'Image % not found for product %', p_image_id, p_product_id;
  end if;

  update public.product_images
  set is_primary = false
  where product_id = p_product_id
    and is_primary;

  update public.product_images
  set is_primary = true
  where id = p_image_id;
end;
$$;

ALTER FUNCTION "public"."set_primary_product_image"("p_product_id" "uuid", "p_image_id" "uuid") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."set_primary_product_image"("p_product_id" "uuid", "p_image_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_primary_product_image"("p_product_id" "uuid", "p_image_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_primary_product_image"("p_product_id" "uuid", "p_image_id" "uuid") TO "service_role";
