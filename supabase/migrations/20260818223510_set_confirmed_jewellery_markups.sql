-- Jewellery markup percentages confirmed by the client and by Labeeb.
-- Applied as: rate x weight x (1 + markup) x 1.20 VAT.
-- The 0-5g band was already correct at 35% and is included for completeness.
--
-- Deliberately NOT set here:
--   jewellery 75g+  - client has not supplied a figure
--   bullion         - premium per certified size still to be agreed
-- Both remain at 0% and stay blocked from publishing.

update pricing_bands set markup_percent = 35 where applies_to = 'jewellery' and label = '0-5g';
update pricing_bands set markup_percent = 30 where applies_to = 'jewellery' and label = '5-10g';
update pricing_bands set markup_percent = 25 where applies_to = 'jewellery' and label = '10-20g';
update pricing_bands set markup_percent = 20 where applies_to = 'jewellery' and label = '20-40g';
update pricing_bands set markup_percent = 19 where applies_to = 'jewellery' and label = '40-60g';
update pricing_bands set markup_percent = 15 where applies_to = 'jewellery' and label = '60-75g';
