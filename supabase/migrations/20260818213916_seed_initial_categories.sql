-- Initial product categories.
-- sort_order left in steps of 10 so new categories can be slotted
-- between existing ones without renumbering everything.
-- Descriptions and meta fields intentionally null; SEO copy is
-- written by the developer, not the client.

insert into categories (name, slug, sort_order, is_active) values
  ('Rings',     'rings',     10, true),
  ('Bangles',   'bangles',   20, true),
  ('Necklaces', 'necklaces', 30, true),
  ('Earrings',  'earrings',  40, true),
  ('Sets',      'sets',      50, true),
  ('Diamond',   'diamond',   60, true),
  ('Bullion',   'bullion',   70, true)
on conflict (slug) do nothing;
