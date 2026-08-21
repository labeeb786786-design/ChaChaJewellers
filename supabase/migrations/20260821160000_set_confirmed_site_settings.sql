-- Confirmed by the client: delivery is £15 per item (no minimum order —
-- there's no separate setting for that, it's just the absence of a
-- minimum), and order notifications go to
-- chachajewellersofficial@gmail.com. Plain UPDATEs, not INSERTs: both keys
-- already exist (seeded outside migration history, like price_lock_minutes
-- — see 20260821150000's comment), currently 0 and [] respectively.
-- Idempotent by construction — setting a value to what it should already be
-- is a harmless no-op if this ever runs twice.
UPDATE "public"."site_settings"
SET "value" = '1500', "updated_at" = "now"()
WHERE "key" = 'shipping_flat_pence';

UPDATE "public"."site_settings"
SET "value" = '["chachajewellersofficial@gmail.com"]', "updated_at" = "now"()
WHERE "key" = 'order_alert_emails';
