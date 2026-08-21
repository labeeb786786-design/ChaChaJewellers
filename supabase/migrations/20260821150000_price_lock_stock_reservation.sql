-- Stock reservation via price locks. A price lock IS a reservation — no
-- separate reserved_quantity column on products, so there is exactly one
-- source of truth (active, unexpired, unconsumed price_lock_items rows)
-- and nothing that can drift out of sync with it.
--
-- The basket itself reserves nothing and shows live prices; a lock is only
-- created when a customer proceeds to checkout (create_price_lock), is
-- released immediately on an explicit "back to basket" (release_price_lock),
-- and is turned into stock + an order on payment confirmation
-- (consume_price_lock). No storefront UI, Stripe calls or webhooks are
-- built here — this is the database layer those sit on.

-- price_locks.items stays the full JSONB snapshot (kept for the record and
-- for building order_items later). This table exists alongside it because
-- aggregating quantity-per-product out of that JSONB column cannot be
-- indexed and cannot be locked/checked atomically — price_lock_items is the
-- narrow, indexable shape available_stock() and the two functions below
-- actually reason over.
CREATE TABLE IF NOT EXISTS "public"."price_lock_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "price_lock_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price_pence" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "price_lock_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "price_lock_items_quantity_positive" CHECK (("quantity" > 0)),
    CONSTRAINT "price_lock_items_price_nonneg" CHECK (("unit_price_pence" >= 0))
);

ALTER TABLE "public"."price_lock_items" OWNER TO "postgres";

ALTER TABLE ONLY "public"."price_lock_items"
    ADD CONSTRAINT "price_lock_items_price_lock_id_fkey"
    FOREIGN KEY ("price_lock_id") REFERENCES "public"."price_locks"("id") ON DELETE CASCADE;

-- RESTRICT, not the order_items-style SET NULL: order_items must survive a
-- deleted product because it's a permanent historical record, but a price
-- lock is a live reservation — a product that's actively reserved should
-- never be deletable out from under it in the first place.
ALTER TABLE ONLY "public"."price_lock_items"
    ADD CONSTRAINT "price_lock_items_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT;

-- The index the brief calls for: available_stock() and the locking queries
-- below both filter/join on product_id per call, at checkout-path latency.
CREATE INDEX "price_lock_items_product_id_idx" ON "public"."price_lock_items" ("product_id");

-- Every new table in this schema gets GRANT ALL to anon/authenticated by
-- default (see the ALTER DEFAULT PRIVILEGES block in the base migration) —
-- RLS with zero policies is what actually keeps it locked down, the same
-- posture price_locks itself already has. Nothing reads or writes this
-- table except the SECURITY DEFINER functions below, which run as the
-- table owner and bypass RLS entirely.
ALTER TABLE "public"."price_lock_items" ENABLE ROW LEVEL SECURITY;


-- stock_quantity minus whatever's currently reserved against it by a lock
-- that is neither consumed nor expired. p_exclude_lock_id lets
-- consume_price_lock ask "how much is available if I disregard my own
-- reservation" — see the comment there for why that exclusion matters.
-- Defaults to NULL so every other caller's available_stock(id) is unchanged.
CREATE OR REPLACE FUNCTION "public"."available_stock"(
    "p_product_id" "uuid",
    "p_exclude_lock_id" "uuid" DEFAULT NULL
) RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
  select p.stock_quantity - coalesce((
    select sum(pli.quantity)
    from public.price_lock_items pli
    join public.price_locks pl on pl.id = pli.price_lock_id
    where pli.product_id = p_product_id
      and pl.consumed_at is null
      and pl.expires_at > now()
      and (p_exclude_lock_id is null or pl.id <> p_exclude_lock_id)
  ), 0)
  from public.products p
  where p.id = p_product_id;
$$;

ALTER FUNCTION "public"."available_stock"("p_product_id" "uuid", "p_exclude_lock_id" "uuid") OWNER TO "postgres";


-- Creates a reservation across every item in a basket, atomically: locks
-- every product row involved (SELECT ... FOR UPDATE, in id order — a fixed
-- order across all callers is what avoids a deadlock when two checkouts
-- share products but list them in a different order), checks
-- available_stock() for each while holding those locks, and only then
-- inserts the lock and its items. Checking and inserting happen in the same
-- transaction as the same function call, so there is no gap in which a
-- second request can read the same "stock: 1" and also proceed — the
-- exact race this whole migration exists to close.
--
-- p_items is a JSON array of {"product_id": ..., "quantity": ...}; a plain
-- SQL-callable jsonb parameter is far more robust to call over PostgREST
-- (from supabase-js .rpc()) than a composite array type. Duplicate
-- product_ids are summed rather than rejected, in case a caller ever sends
-- them that way.
--
-- p_duration_minutes is optional: pass it to pin a specific duration (tests
-- want this), leave it NULL to read site_settings.price_lock_minutes, the
-- brief's default of 15 minutes only applying if even that row is missing.
CREATE OR REPLACE FUNCTION "public"."create_price_lock"(
    "p_items" "jsonb",
    "p_shipping_pence" integer,
    "p_duration_minutes" integer DEFAULT NULL
) RETURNS "public"."price_locks"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_duration_minutes integer;
  v_expires_at       timestamptz;
  v_rounding         integer;
  v_rate_log         public.gold_price_log;
  v_lock             public.price_locks;
  v_subtotal_pence   integer := 0;
  v_items_snapshot   jsonb := '[]'::jsonb;
  v_missing_count    integer;
  v_available        integer;
  v_applies_to       public.band_applies_to_enum;
  v_band             public.pricing_bands;
  v_rate             numeric;
  v_markup           numeric;
  v_vat              numeric;
  v_unit_price       integer;
  rec                record;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'No items to lock.';
  end if;
  if p_shipping_pence is null or p_shipping_pence < 0 then
    raise exception 'Shipping must be 0 or more.';
  end if;

  if exists (
    select 1 from jsonb_to_recordset(p_items) as x("product_id" uuid, "quantity" integer)
    where x.product_id is null or x.quantity is null or x.quantity <= 0
  ) then
    raise exception 'Every item needs a product and a quantity greater than 0.';
  end if;

  select count(*) into v_missing_count
  from (
    select distinct (x->>'product_id')::uuid as product_id
    from jsonb_array_elements(p_items) x
  ) requested
  left join public.products p on p.id = requested.product_id
  where p.id is null;

  if v_missing_count > 0 then
    raise exception 'One or more items in this basket no longer exist.';
  end if;

  v_duration_minutes := coalesce(
    p_duration_minutes,
    (select (value #>> '{}')::integer from public.site_settings where key = 'price_lock_minutes'),
    15
  );
  if v_duration_minutes <= 0 then
    raise exception 'Lock duration must be greater than 0 minutes.';
  end if;
  v_expires_at := now() + make_interval(mins => v_duration_minutes);

  v_rounding := coalesce(
    (select (value #>> '{}')::integer from public.site_settings where key = 'price_rounding_pence'), 1);

  -- Same "latest successful, applied rate" resolution as
  -- current_metal_prices, done directly against gold_price_log so the row's
  -- id comes with it (needed for price_locks.gold_price_log_id). Left null
  -- when no rate has ever been applied — a basket of only fixed-price
  -- (diamond) items still needs to lock successfully in that case; the
  -- per-item check below is what actually enforces "a dynamic item needs a
  -- rate," not this.
  select * into v_rate_log
  from public.gold_price_log
  where succeeded and applied_at is not null
  order by fetched_at desc
  limit 1;

  -- Lock every product row this basket touches, in id order, before
  -- checking or reading anything about them. FOR UPDATE cannot be combined
  -- with GROUP BY/aggregates, which the per-product quantity totals below
  -- need — so locking happens here, as its own statement, and the
  -- aggregated read that follows relies on those locks already being held
  -- for the rest of this transaction.
  perform 1
  from public.products p
  where p.id in (select distinct (x->>'product_id')::uuid from jsonb_array_elements(p_items) x)
  order by p.id
  for update;

  for rec in
    select
      p.id, p.name, p.sku, p.pricing_mode, p.weight_grams, p.metal, p.purity, p.price_pence,
      sum(x.quantity)::integer as requested_qty
    from jsonb_to_recordset(p_items) as x("product_id" uuid, "quantity" integer)
    join public.products p on p.id = x.product_id
    group by p.id, p.name, p.sku, p.pricing_mode, p.weight_grams, p.metal, p.purity, p.price_pence
    order by p.id
  loop
    v_available := public.available_stock(rec.id);
    if v_available < rec.requested_qty then
      raise exception 'Not enough stock for "%": % available, % requested.',
        rec.name, v_available, rec.requested_qty;
    end if;

    if rec.pricing_mode = 'fixed' then
      -- Fixed (diamond) pricing doesn't track a rate — same split
      -- resolvePriceWriteFields() already makes application-side.
      v_unit_price := rec.price_pence;
      v_rate       := null;
      v_markup     := null;
      v_vat        := null;
    else
      v_applies_to := case rec.pricing_mode
        when 'dynamic_bullion' then 'bullion'::public.band_applies_to_enum
        else 'jewellery'::public.band_applies_to_enum
      end;
      v_rate := case rec.metal
        when 'gold'   then v_rate_log.gold_per_gram_24k_pence
        when 'silver' then v_rate_log.silver_per_gram_999_pence
      end;
      v_band       := public.find_pricing_band(v_applies_to, rec.weight_grams);
      v_markup     := v_band.markup_percent;
      v_vat        := v_band.vat_percent;
      v_unit_price := public.calculate_dynamic_price_pence(v_applies_to, rec.weight_grams, v_rate, v_rounding);
    end if;

    -- Covers every reason a dynamic price can't compute right now (no rate
    -- for this metal, no band for this weight) with one clear, product-named
    -- error, the same way canPublish()'s absence blocks a product going
    -- live for the same underlying reasons.
    if v_unit_price is null then
      raise exception 'No current price is available for "%".', rec.name;
    end if;

    v_subtotal_pence := v_subtotal_pence + v_unit_price * rec.requested_qty;

    v_items_snapshot := v_items_snapshot || jsonb_build_array(jsonb_build_object(
      'product_id', rec.id,
      'product_name', rec.name,
      'sku', rec.sku,
      'quantity', rec.requested_qty,
      'weight_grams', rec.weight_grams,
      'purity', rec.purity,
      'metal', rec.metal,
      'unit_price_pence', v_unit_price,
      'line_total_pence', v_unit_price * rec.requested_qty,
      'metal_rate_pence_per_gram', v_rate,
      'markup_percent', v_markup,
      'vat_percent', v_vat
    ));
  end loop;

  insert into public.price_locks (expires_at, gold_price_log_id, items, subtotal_pence, shipping_pence, total_pence)
  values (v_expires_at, v_rate_log.id, v_items_snapshot, v_subtotal_pence, p_shipping_pence, v_subtotal_pence + p_shipping_pence)
  returning * into v_lock;

  insert into public.price_lock_items (price_lock_id, product_id, quantity, unit_price_pence)
  select v_lock.id, (item->>'product_id')::uuid, (item->>'quantity')::integer, (item->>'unit_price_pence')::integer
  from jsonb_array_elements(v_items_snapshot) as item;

  return v_lock;
end;
$$;

ALTER FUNCTION "public"."create_price_lock"("p_items" "jsonb", "p_shipping_pence" integer, "p_duration_minutes" integer) OWNER TO "postgres";


-- Turns a lock into a real stock decrement once payment is confirmed.
-- Re-verifies availability rather than trusting that create_price_lock's
-- check still holds, because a payment can confirm after expires_at — a
-- slow bank, a delayed payment method — by which point another customer's
-- lock may have taken the stock this one no longer protects (an expired
-- lock stops counting in available_stock() the moment it expires, not only
-- once purge_expired_price_locks() eventually deletes it).
--
-- The exclusion in available_stock()'s second argument is what makes the
-- re-check correct rather than always-false: without it, this lock's own
-- still-active reservation (the normal case — most payments confirm before
-- expiry) would be subtracted from the count a second time, on top of
-- already having reduced it once by existing, making the check fail for
-- every on-time payment. Excluding this lock's own id answers the right
-- question: "is there still room for what I already reserved, given
-- everyone else."
--
-- Returns the price_locks row — its items snapshot already has everything
-- (product name, sku, weight, purity, unit/line price, rate, markup, VAT)
-- an order and its order_items should be built from; nothing further is
-- computed here.
CREATE OR REPLACE FUNCTION "public"."consume_price_lock"(
    "p_lock_id" "uuid",
    "p_payment_intent_id" "text"
) RETURNS "public"."price_locks"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_lock      public.price_locks;
  v_available integer;
  rec         record;
begin
  select * into v_lock from public.price_locks where id = p_lock_id for update;

  if v_lock.id is null then
    raise exception 'Price lock % not found.', p_lock_id;
  end if;
  if v_lock.consumed_at is not null then
    raise exception 'Price lock % has already been used.', p_lock_id;
  end if;

  -- Same locking discipline as create_price_lock: every product this lock
  -- touches, in id order, before reading availability for any of them.
  perform 1
  from public.products p
  where p.id in (select product_id from public.price_lock_items where price_lock_id = p_lock_id)
  order by p.id
  for update;

  for rec in
    select pli.product_id, pli.quantity, p.name
    from public.price_lock_items pli
    join public.products p on p.id = pli.product_id
    where pli.price_lock_id = p_lock_id
    order by p.id
  loop
    v_available := public.available_stock(rec.product_id, p_lock_id);
    if v_available < rec.quantity then
      -- The one case the caller needs to distinguish: stock genuinely
      -- gone, not just this lock being late. It should trigger a refund
      -- for p_payment_intent_id rather than create an order for stock
      -- that no longer exists.
      raise exception 'Stock for "%" is no longer available: % requested, % available now.',
        rec.name, rec.quantity, v_available;
    end if;
  end loop;

  update public.products p
  set stock_quantity = p.stock_quantity - pli.quantity
  from public.price_lock_items pli
  where pli.price_lock_id = p_lock_id
    and p.id = pli.product_id;

  update public.price_locks
  set consumed_at = now(), stripe_payment_intent_id = p_payment_intent_id
  where id = p_lock_id
  returning * into v_lock;

  return v_lock;
end;
$$;

ALTER FUNCTION "public"."consume_price_lock"("p_lock_id" "uuid", "p_payment_intent_id" "text") OWNER TO "postgres";


-- The explicit "back to basket" release. Deleting the row (rather than
-- adding a cancelled/released status) is enough: price_lock_items cascades
-- automatically on delete, and available_stock() only ever sums rows that
-- still exist, so the reservation is freed the instant this commits.
-- Idempotent on a lock that's already gone (already released, already
-- expired-and-purged) — a "back to basket" click racing its own lock's
-- natural expiry shouldn't error the checkout flow. Only a genuinely
-- consumed lock refuses: that would be deleting the record a real sale is
-- built from.
CREATE OR REPLACE FUNCTION "public"."release_price_lock"("p_lock_id" "uuid") RETURNS void
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if exists (select 1 from public.price_locks where id = p_lock_id and consumed_at is not null) then
    raise exception 'Price lock % has already been used and cannot be released.', p_lock_id;
  end if;

  delete from public.price_locks where id = p_lock_id and consumed_at is null;
end;
$$;

ALTER FUNCTION "public"."release_price_lock"("p_lock_id" "uuid") OWNER TO "postgres";


-- purge_expired_price_locks() deliberately isn't touched. Its 7-day window
-- is about how long a dead lock's row (and JSONB snapshot) sticks around
-- for the record — it has never been what keeps expired locks out of
-- available_stock()'s count. That's the "and expires_at > now()" filter in
-- available_stock() itself, which excludes an expired lock the instant it
-- expires, independent of whether this sweep has run yet. Cascade already
-- handles price_lock_items when a row is purged, same as for a release.

-- service_role only for every function above: they run from server-side
-- checkout/webhook code, never called directly by a browser session, same
-- posture as apply_metal_prices() and purge_expired_price_locks().
GRANT ALL ON FUNCTION "public"."available_stock"("p_product_id" "uuid", "p_exclude_lock_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_price_lock"("p_items" "jsonb", "p_shipping_pence" integer, "p_duration_minutes" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."consume_price_lock"("p_lock_id" "uuid", "p_payment_intent_id" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."release_price_lock"("p_lock_id" "uuid") TO "service_role";

-- price_lock_minutes already exists in this database (seeded outside the
-- migration history, currently 20) — this only fills it in on an
-- environment where it's genuinely missing, per the brief's "if no setting
-- exists, add one defaulting to 15 minutes." Never overwrites a real value.
INSERT INTO "public"."site_settings" ("key", "value", "notes")
VALUES ('price_lock_minutes', '15', 'How long a checkout price lock stays valid.')
ON CONFLICT ("key") DO NOTHING;
