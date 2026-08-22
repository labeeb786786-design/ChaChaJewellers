-- Queue of Storage objects awaiting deletion.
--
-- cleanup_abandoned_draft_products() returns storage paths rather than
-- deleting the files, because Postgres has no access to the Supabase
-- Storage object backend. run_abandoned_draft_cleanup() writes those paths
-- here so that an out-of-database sweeper can drain the queue later.
--
-- product_id is deliberately NOT a foreign key: the product row is already
-- gone by the time its paths are queued. It is kept for traceability only.
--
-- NOTE: applied directly to the live project via MCP; this file records
-- that change after the fact.
create table if not exists public.storage_cleanup_queue (
  id uuid primary key default gen_random_uuid(),
  product_id uuid,
  bucket_id text not null default 'product-images',
  storage_path text not null,
  queued_at timestamptz not null default now(),
  deleted_at timestamptz,
  last_error text
);

comment on table public.storage_cleanup_queue is
  'Storage objects awaiting deletion, queued by run_abandoned_draft_cleanup(). Pending rows are those with deleted_at is null.';

-- Partial index: the sweeper only ever scans pending rows.
create index if not exists storage_cleanup_queue_pending_idx
  on public.storage_cleanup_queue (queued_at)
  where deleted_at is null;

alter table public.storage_cleanup_queue enable row level security;

-- Admins may read the queue for diagnostics. Writes come from
-- run_abandoned_draft_cleanup() (security definer) and the service_role
-- sweeper, both of which bypass RLS.
drop policy if exists storage_cleanup_queue_admin_select on public.storage_cleanup_queue;
create policy storage_cleanup_queue_admin_select
  on public.storage_cleanup_queue
  for select
  to authenticated
  using (is_admin());
