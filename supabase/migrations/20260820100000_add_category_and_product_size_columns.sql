-- Category hierarchy: one level of nesting only (e.g. Earrings > Studs).
-- ON DELETE RESTRICT — deleting a parent with children present must fail
-- loudly, not silently orphan or cascade-delete the children.
ALTER TABLE "public"."categories" ADD COLUMN "parent_id" "uuid";
ALTER TABLE "public"."categories"
  ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT;

CREATE INDEX "categories_parent_idx" ON "public"."categories" USING "btree" ("parent_id");

-- Enforces "one level of nesting only" — something a plain CHECK
-- constraint can't express, since CHECK can't reference other rows. A
-- category's parent must itself be a top-level category (no parent of its
-- own), never another child.
CREATE OR REPLACE FUNCTION "public"."check_category_nesting_depth"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_grandparent uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'A category cannot be its own parent';
  end if;

  select parent_id into v_grandparent from public.categories where id = new.parent_id;

  if v_grandparent is not null then
    raise exception 'Categories support one level of nesting only — the chosen parent is itself a child category';
  end if;

  return new;
end;
$$;

ALTER FUNCTION "public"."check_category_nesting_depth"() OWNER TO "postgres";

CREATE OR REPLACE TRIGGER "categories_nesting_depth_check"
  BEFORE INSERT OR UPDATE OF "parent_id" ON "public"."categories"
  FOR EACH ROW EXECUTE FUNCTION "public"."check_category_nesting_depth"();

GRANT ALL ON FUNCTION "public"."check_category_nesting_depth"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_category_nesting_depth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_category_nesting_depth"() TO "service_role";


-- What kind of size a category's products are sized by, if any — drives
-- which size control the product form renders (see lib/size.ts).
CREATE TYPE "public"."size_type_enum" AS ENUM (
  'ring_letter',
  'length_inches',
  'bangle_diameter',
  'hoop_mm',
  'none'
);

ALTER TABLE "public"."categories" ADD COLUMN "size_type" "public"."size_type_enum" NOT NULL DEFAULT 'none';


-- size_label is what the admin sees ("N½", "18\"", "2.6"); size_sort is
-- what filtering/ordering actually uses. size_sort is never entered
-- directly — always computed from size_label by the category's size_type
-- (see resolveSizeFields in lib/size.ts). Bangle sizes in particular are
-- not decimals: "2.10" means two and ten-sixteenths of an inch (2.625"),
-- which is LARGER than "2.8" (two and a half, 2.5") — sorted as the
-- decimal 2.10, it would wrongly land before 2.8.
ALTER TABLE "public"."products" ADD COLUMN "size_label" "text";
ALTER TABLE "public"."products" ADD COLUMN "size_sort" numeric;
