-- Storage policies for the product-images bucket.
-- Public read so the storefront can render images without signed URLs.
-- Write operations restricted to whitelisted admins via public.is_admin().

create policy "product_images_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'product-images');

create policy "product_images_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
