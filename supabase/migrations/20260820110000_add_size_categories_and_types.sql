-- New top-level category, slotted between Necklaces (30) and Earrings (40).
insert into categories (name, slug, sort_order, is_active, size_type) values
  ('Chains', 'chains', 35, true, 'length_inches')
on conflict (slug) do nothing;

-- New children of Earrings. Earrings itself becomes a non-selectable group
-- header in the product form now that it has children — see the category
-- dropdown in product-form.tsx.
insert into categories (name, slug, sort_order, is_active, parent_id, size_type) values
  ('Studs',  'studs',  10, true, (select id from categories where slug = 'earrings'), 'none'),
  ('Hoops',  'hoops',  20, true, (select id from categories where slug = 'earrings'), 'hoop_mm'),
  ('Kantai', 'kantai', 30, true, (select id from categories where slug = 'earrings'), 'none')
on conflict (slug) do nothing;

-- size_type for categories that already existed before this migration
-- (Chains, Studs, Hoops, Kantai got theirs at insert, above).
update categories set size_type = 'ring_letter'     where slug in ('rings', 'diamond');
update categories set size_type = 'bangle_diameter' where slug = 'bangles';
update categories set size_type = 'length_inches'   where slug in ('necklaces', 'sets');
update categories set size_type = 'none'            where slug in ('earrings', 'bullion');
