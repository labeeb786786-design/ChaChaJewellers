# Admin brief — Addendum A

**Supersedes parts of `docs/admin-brief.md`. Where the two disagree, this document wins.**

Decisions taken 18 August 2026. Read alongside the original brief, which remains correct on schema facts, the security model, the six traps, design tokens and copy rules.

---

## Superseded sections

### §7 Products — CSV import is removed from v1
The client has no spreadsheet of his stock. Every product will be entered by hand. Building an import for a file that does not exist is wasted work.

**Do not build the CSV import.** The effort goes into making the form fast for repetitive entry instead — see "Bulk entry ergonomics" below.

Note this does not relax the rule about `canPublish()` living in the Server Action as well as the UI. It still must, because a future import route is still likely.

### §7 Pricing bands — now full CRUD, not just editable percentages
Bullion and coins come certified in fixed weights, and new sizes appear over time. The client must be able to **add, edit and delete bands**, not only change percentages on a fixed set of rows.

Two constraints to handle in the form:

- `pricing_bands` carries an exclusion constraint on overlapping ranges. Adding 20–50g while 20–40g exists is rejected by Postgres. Catch it and say "this overlaps the existing 20–40g band", never the raw error.
- Gaps are the quieter danger. If bands exist for 10–20g and 30–40g, a 25g item matches nothing and cannot be priced at all. **Default a new band's minimum to the previous band's maximum** so ranges stay continuous by construction.

### §9 Product list — 50 per page, not 25
The catalogue will be roughly 500–600 products: about 100 in each of rings, bangles, necklaces, earrings and sets, and 10–50 each in bullion and diamond.

- 50 per page
- Category filter is the primary control, not an afterthought — filtering to one category cuts 600 to 100 before searching
- Default sort newest first; offer sort by weight and by price
- `findBlockedProductIds()` currently reads every product row on every page load. At 600 rows, running on every keystroke, that is wasteful. **Convert it to a single counting query.**

### §10 Open questions — resolved
- Image upload: drag-and-drop multi-file, uploaded immediately
- Duplicate product: yes, and now essential rather than optional
- Order editing: status only
- Dashboard: yes
- CSV import: dropped
- Hiding individual Google reviews: still open with the client

---

## New requirements

### Publish confirmation
Clicking Publish does not publish immediately. It opens a small confirmation showing the calculated price, with two buttons:

- **Yes** — publishes
- **No, review pricing formula** — closes and routes to the pricing bands page, not merely back to the form

The purpose is catching a mistyped weight — 32g entered for 3.2g — at the moment the price becomes real.

### Remove behaviour
Confirmation widget, then the product disappears from the admin panel **permanently**. No filter, no restore, nothing to find. The client experiences it as deletion.

Underneath: `is_active` is set false and the row is retained, because `order_items` and `price_locks` hold foreign keys to it. A real `DELETE` either fails on any product that has ever sold, or orphans the order history.

Its images **are** deleted from storage for real — nothing needs those.

**Consequence to handle:** the SKU and slug stay taken. If the client later adds a product reusing a removed SKU, the unique constraint rejects it. Catch error 23505 and say "this code was used by a product you removed, please use a different one" — not a Postgres error.

### Image upload timing
Files upload **immediately on selection**, not on save. Thumbnails appear while the client continues filling the form, and saving stays fast.

This leaves orphaned files when a product is abandoned. Accepted. A **fortnightly sweep** deletes any file in `product-images` with no matching `product_images` row. Build it alongside the gold rate job — both are scheduled functions.

### Bulk entry ergonomics
Roughly 600 products entered by hand. The difference between a four-minute product and a seven-minute one is about thirty hours of the client's time. Build for repetition:

- **Save and add another** — keeps category and pricing mode selected, clears everything else
- **Duplicate** — copies a product as a starting point, clearing SKU and slug
- **Full keyboard operation** — tab order must be sane, Enter must not submit prematurely
- **Bulk publish** from the list — tick multiple rows, publish together, with the same zero-markup guard applied per row

---

## Pricing — settled, do not re-derive

Markups confirmed by the client and by Labeeb. Enter exactly these:

| Band | Markup |
|---|---|
| 0–5g | 35% |
| 5–10g | 30% |
| 10–20g | 25% |
| 20–40g | 20% |
| 40–60g | 19% |
| 60–75g | 15% |

Formula: `rate × weight × (1 + markup) × 1.20`. The 0–5g band is already correct in the database.

**Still empty, pending the client:** 75g+ and bullion. Leave both at 0%.

### Pricing modes in practice
- `dynamic_jewellery` — most of the catalogue
- `dynamic_bullion` — bars and coins, priced from the **live gold rate** like jewellery, with its own bands and 0% VAT. Bands split by certified size.
- `fixed` — **diamond jewellery only.** Nothing else uses fixed pricing.

---

## Out of scope for the admin panel

Recorded here so it is not built by accident. These are storefront and checkout concerns:

- Bullion and 75g+ items are not sold through Stripe, by client decision, because of the 1.5% fee
- 75g+ necklaces show **no price at all** — a "Call us for a priced quote" button instead
- Bullion **does** show a price, but pays offline
- This may reverse if a Stripe consultation yields a lower rate

The admin panel does not implement any of this. Do not add payment fields to the product form.

---

## Form layout — confirmed

**Always visible:** name, category, how many in stock, pricing mode, weight or price, short description, full description.

**Behind a collapsed "More options":** purity, metal, product type, lead time, featured, sort order, tags.

**Never shown:** SKU and slug, which generate from the name and appear as a hint beneath it. `is_active` is controlled by the Publish button, not a checkbox.

**Field defaults:** stock quantity defaults to **1**, not the database default of 0. A product saved with 0 stock is published and unbuyable with no warning. Lead time appears only when product type is made-to-order.
