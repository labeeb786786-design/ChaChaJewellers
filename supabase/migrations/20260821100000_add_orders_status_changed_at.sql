-- Recorded for the record and for the dashboard's 72-hour "not actioned"
-- rule — not displayed anywhere yet. Distinct from updated_at, which the
-- existing orders_updated_at trigger already bumps on ANY edit: this only
-- moves when status itself actually changes.
ALTER TABLE "public"."orders" ADD COLUMN "status_changed_at" timestamptz NOT NULL DEFAULT now();

-- Backfill: no status history exists before this column did, so the best
-- available signal for "when did this order last change status" is when
-- it was created.
UPDATE "public"."orders" SET "status_changed_at" = "created_at";

-- BEFORE UPDATE OF status only fires when status is part of the UPDATE's
-- column list at all; the IS DISTINCT FROM guard inside additionally
-- covers the case where a statement sets status to the value it already
-- had (e.g. `update orders set status = status, internal_notes = ...`) —
-- belt and braces, so this only ever moves on a genuine status change.
CREATE OR REPLACE FUNCTION "public"."set_order_status_changed_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

ALTER FUNCTION "public"."set_order_status_changed_at"() OWNER TO "postgres";

CREATE OR REPLACE TRIGGER "orders_status_changed_at"
  BEFORE UPDATE OF "status" ON "public"."orders"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_order_status_changed_at"();

GRANT ALL ON FUNCTION "public"."set_order_status_changed_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_order_status_changed_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_order_status_changed_at"() TO "service_role";
