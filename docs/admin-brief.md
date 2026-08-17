# Claude Code brief — Chacha Jewellers admin panel

Build the `/admin` section of this Next.js app. The products area is a full build. Every other section is a working stub I will fill in myself — give me the route, the page shell, the heading and an empty state, and nothing more.

A visual reference prototype is at `docs/admin-prototype.html`. Open it and match the layout, spacing, wording and behaviour. It is a static mockup, not code to copy — rebuild it properly as React components.

---

## 1. Stack and conventions

- Next.js App Router, TypeScript strict, Tailwind, shadcn/ui
- Supabase for auth, database and storage
- Server Components by default. Client Components only where interactivity demands it
- All writes go through Server Actions in a colocated `actions.ts`
- No `any`. Generate types from the database if `supabase gen types` is available; otherwise hand-write the row types in `types/db.ts`

---

## 2. Security — non-negotiable

The database already has RLS on all 13 tables and an `is_admin()` function that checks the `admin_users` whitelist.

1. **Every Server Action independently verifies the session and calls `is_admin()`.** Do not trust the middleware, do not trust a layout check, do not trust a prop. Write one helper, `requireAdmin()`, in `lib/auth.ts` that returns the user or throws, and call it as the first line of every action.
2. **Middleware is a redirect convenience, not a security boundary.** It matches `/admin/:path*`, refreshes the Supabase session, and bounces users with no session to `/admin/login`. That is all it does. Never let it be the only thing standing between a request and a write.
3. **The service role key must never reach the browser.** Never prefix it with `NEXT_PUBLIC_`. Use it only inside `lib/supabase/admin.ts`, which must carry a `import 'server-only'` at the top.
4. Add `/admin` to `robots.txt` as a disallow. No public page links to it.

Create three Supabase clients:

- `lib/supabase/server.ts` — cookie-based, for Server Components and Actions
- `lib/supabase/client.ts` — browser client, anon key, used only by the login form
- `lib/supabase/admin.ts` — service role, `server-only`, used only where RLS genuinely needs bypassing (image cleanup on delete)

---

## 3. Schema facts — these are real, do not invent columns

### `products`
```
id uuid pk
sku text unique
name text
slug text unique          CHECK: ^[a-z0-9]+(-[a-z0-9]+)*$
short_description text nullable
description text nullable
category_id uuid → categories.id
product_type enum         in_stock | made_to_order          default in_stock
pricing_mode enum         dynamic_jewellery | dynamic_bullion | fixed
                                                            default dynamic_jewellery
metal enum                gold | silver                     default gold
purity enum               24k | 22k | 21k | 18k | 9k | 999 | 925   default 22k
weight_grams numeric nullable    CHECK: null or > 0
price_pence integer nullable     CHECK: null or >= 0
price_calculated_at timestamptz nullable
price_source_log_id uuid nullable → gold_price_log.id
stock_quantity integer default 0 CHECK: >= 0
lead_time_days integer nullable
is_active boolean default FALSE
is_featured boolean default false
sort_order integer default 0
tags text[] default {}
meta_title, meta_description text nullable
created_at, updated_at timestamptz
search_vector tsvector    GENERATED — never write to this
```

### `product_images`
```
id uuid pk
product_id uuid → products.id
storage_path text          a Storage path, NOT a URL
alt_text text nullable
sort_order integer default 0
is_primary boolean default false
width, height integer nullable
created_at timestamptz
```
A partial unique index allows **at most one** `is_primary = true` per product.

### `categories`
```
id, name (unique), slug (unique, same regex), description, image_path,
sort_order, is_active (default true), meta_title, meta_description
```

### `pricing_bands`
```
id, applies_to enum (jewellery | bullion), label, min_weight_g, max_weight_g,
markup_percent (0–500), vat_percent (0–100), is_active
```

### Database functions already built — call these, do not reimplement
- `is_admin()` → boolean
- `find_pricing_band(applies_to, weight_g)` → the band row for a weight
- `calculate_dynamic_price_pence(applies_to, weight_g, rate_pence, rounding)` → integer pence
- `current_metal_prices` — view, latest rate only, safe for public read

**Verified:** 3.2g at 7500 pence/g in the 0–5g band (35% markup, 20% VAT) returns `38880` = £388.80.

---

## 4. Six traps — get these wrong and it breaks quietly

**Numeric columns arrive as strings.** supabase-js returns Postgres `numeric` as a JavaScript string, because JS numbers can't hold Postgres precision. `weight_grams`, `markup_percent`, `vat_percent` and all rate columns are affected. `"3.2" + 1` gives `"3.21"`. Parse explicitly at the data boundary — write a Zod schema per table that coerces, and never touch a raw row.

**Money is integer pence.** `38880` means £388.80. Write `lib/money.ts` exporting `parseMoney(input: string): number` and `formatMoney(pence: number): string`, and use them everywhere. Never store a float. Never do arithmetic on a formatted string.

**Slugs collide.** Two products named "Gold Bangle" need `gold-bangle` and `gold-bangle-2`. Write `lib/slug.ts` with a `generateSlug(name, supabase)` that checks the table and appends a counter. The CHECK constraint rejects capitals, spaces and apostrophes, so strip them.

**SKU uniqueness is a database constraint.** Catch error code `23505` and return a friendly field-level message. Never let a raw Postgres error string reach the client.

**"Remove" means deactivate.** Set `is_active = false`. Never `DELETE` a product row — `order_items` references it and the order history breaks. The button still says "Remove"; the client does not need to know the difference.

**Zero-markup bands sell at cost.** Six of the seven jewellery bands currently sit at `markup_percent = 0`. Publishing a product whose weight lands in one of those means selling gold at the raw metal price. See section 6.

---

## 5. Design tokens

Extend the Tailwind theme with these. Do not use arbitrary hex values inline.

```
paper       #FAF9F6    page background
surface     #FFFFFF    cards, inputs
ink         #1A1917    primary text, primary button
muted       #6E6A62    secondary text
faint       #9C978D    labels, hints
rule        #E4E1D8    hairlines
ruleStrong  #CFCBBF    input borders
gold        #8A6A1F    accent, used sparingly
goldSoft    #F4EEDD    selected states, thumbnails
danger      #9B2C2C    destructive, void price
dangerSoft  #FBEDED
warn        #96601A    blocked-publish banner
warnSoft    #FDF3E4
ok          #2F6B45    live status
okSoft      #EDF5EF
```

Type: **Inter** for the interface, **IBM Plex Mono** for every number, SKU, code and the price breakdown. Load both via `next/font/google`.

All figures use `font-variant-numeric: tabular-nums` so columns align.

Radius 6px on controls, 8px on cards. Hairline borders, no drop shadows except on the modal.

---

## 6. The zero-markup guard — the highest-value check in the project

For any product where `pricing_mode` is `dynamic_jewellery` or `dynamic_bullion`:

- Look up its band with `find_pricing_band()`
- If that band's `markup_percent` is `0`, **publishing is blocked**
- The Publish button renders disabled
- The price breakdown total renders in `danger`
- An explanation appears: which band, why it's blocked, and that it's fixed under Pricing

Enforce this **in the Server Action as well as the UI**. A form-only check gets routed around the moment a CSV import lands. Add a `canPublish(product)` function in `lib/pricing.ts` and call it from both places.

The product list shows a count banner at the top when any product is in this state.

---

## 7. Files to create

```
middleware.ts

lib/
  auth.ts                 requireAdmin()
  money.ts                parseMoney, formatMoney
  slug.ts                 generateSlug
  pricing.ts              calculatePrice, findBand, canPublish
  supabase/
    server.ts
    client.ts
    admin.ts              'server-only'

app/admin/
  layout.tsx              top bar + nav, session check, redirect if not admin
  page.tsx                redirect('/admin/products')
  login/
    page.tsx
    login-form.tsx        client component, email + password + TOTP

  products/
    page.tsx              list — search, category filter, status filter, pagination
    actions.ts            createProduct, updateProduct, deactivateProduct,
                          setPrimaryImage, uploadImages, deleteImage
    new/page.tsx
    [id]/edit/page.tsx
    _components/
      product-table.tsx
      product-form.tsx        client, orchestrates the whole form
      pricing-mode-picker.tsx client, three cards
      price-breakdown.tsx     client, the receipt panel
      image-uploader.tsx      client, drag-drop, reorder, star for primary
      remove-dialog.tsx       client, confirmation
      blocked-banner.tsx

  categories/page.tsx     STUB
  orders/page.tsx         STUB
  pricing/page.tsx        STUB
  faqs/page.tsx           STUB
  settings/page.tsx       STUB
```

**Stub pages** mean: correct route, the shared admin layout, an `<h1>` matching the nav label, a one-line description, and a bordered empty state that says what will go here. No data fetching, no tables, no forms. I am building those myself.

---

## 8. The product form — behaviour spec

Two columns. Form on the left in a single card divided into fieldsets by hairline. Price breakdown panel on the right, sticky on scroll.

**Fieldset: The basics**
- Product name — typing it live-generates the slug and SKU shown as a hint beneath, in mono
- Category — select, from `categories` where `is_active`
- How many in stock — number, hint reads "One-off piece? Leave it at 1"

**Fieldset: How this is priced**

Three selectable cards. Selected card takes a `gold` border and `goldSoft` background.

| Card label | Value | Description shown |
|---|---|---|
| Gold jewellery | `dynamic_jewellery` | Price follows the live gold rate. You enter the weight. |
| Bars and coins | `dynamic_bullion` | Price follows the live gold rate, no VAT. |
| Fixed price | `fixed` | For diamond pieces. You type the price yourself. |

The fields below **change with the selection**:
- Dynamic modes → editable weight in grams, read-only calculated price
- Fixed → editable price in pounds, weight field disabled reading "Not used"

Never show both live at once.

**Fieldset: Photos**
- Drag-and-drop multi-file, click to browse, JPG/PNG, 5MB cap each
- Thumbnails below with a star toggle for the primary
- Setting a new primary must clear the old one **in the same transaction**, or the partial unique index rejects the write
- Drag to reorder writes `sort_order`
- Files go to Supabase Storage; store the returned path in `storage_path`, never a full URL

**Fieldset: Description** — short and long, both optional.

**Right panel: the price breakdown.** This is the signature element. For dynamic modes render the arithmetic as a receipt, in mono, with each step on its own line and figures right-aligned:

```
Gold, 24k, per gram          £75.00
  × Weight                    3.20g
Metal cost                  £240.00
  × Markup, 0–5g band           35%
Before VAT                  £324.00
  × VAT                         20%
─────────────────────────────────────
SELLS FOR                   £388.80
```

Below it, a band note naming the band and its markup. When the band is at 0%, that note turns `danger` and explains the block.

For fixed mode the panel instead shows what was typed, what will be stored in pence, and a note that the price does not track the gold rate.

**Actions**, stacked under the panel: `Publish to the site` (primary, disabled when blocked) and `Save as draft`.

---

## 9. The product list

Table columns: Product (thumbnail, name, SKU beneath in mono), Category, Weight, Price, Status, actions.

Status pill: `Live` in ok, `Draft` in muted grey, `Can't publish` in warn for zero-markup items.

Row actions: Edit, Remove. Remove opens a confirmation reading "It disappears from the site straight away. Any past orders for it stay exactly as they are."

Above the table: search box, category filter, status filter. Above those, the blocked-count banner when relevant.

Server-side pagination, 25 per page. Search hits `search_vector` with `websearch_to_tsquery`.

---

## 10. Copy rules

The client is a jeweller, not a developer. Nothing in the interface uses a database term.

- "Gold jewellery", never `dynamic_jewellery`
- "How many in stock", never "Stock quantity"
- "Web address", never "slug"
- "Code", never "SKU", in customer-adjacent labels
- Buttons say what happens: "Publish to the site", not "Submit"
- The word on the button matches the word in the confirmation: Publish → Published
- Errors state what went wrong and how to fix it. They do not apologise and they are never vague

---

## 11. Build order

Work through these in order and stop after each so I can check it.

1. `lib/` utilities and the three Supabase clients, with unit tests for `money.ts` and `slug.ts`
2. `middleware.ts`, `lib/auth.ts`, the login page and the admin layout shell with nav
3. The five stub pages
4. The product list
5. The product form, form fields and mode picker
6. The price breakdown panel
7. The image uploader
8. Server Actions and wiring

Do not scaffold everything at once. Stop at the end of each step, tell me what you changed, and wait.

---

## 12. Before any of this works

I need to have done these in the Supabase dashboard. Ask me to confirm before step 2.

- Public signups disabled
- One admin user created, their `user_id` inserted into `admin_users`
- TOTP 2FA enabled
- A `product-images` Storage bucket created, public read, admin-only write
