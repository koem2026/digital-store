# Digital Marketplace — Starter Scaffold

A single-seller digital goods store (ebooks, courses, design templates, business
proposals, web templates, journal/research, project files, idea briefs), built
so it can open up to multiple sellers later without a rewrite.

## Stack
- **Next.js** — frontend + API routes
- **Supabase** — Postgres database, auth, and file storage
- **Paystack** — payments (NGN)

## Setup

1. **Create a Supabase project** at supabase.com, then in the SQL editor run
   `supabase/schema.sql` to create all tables.
2. In Supabase Storage, create a **private** bucket called `product-files`
   (for the actual paid files) and a **public** bucket called `previews`
   (for screenshots/thumbnails).
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings
   - `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings (keep this secret, server-only)
   - `PAYSTACK_SECRET_KEY` — from your Paystack dashboard
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` — from your Paystack dashboard
4. `npm install`
5. `npm run dev`

## What's built

- **schema.sql** — full data model, all 8 categories, row-level security so
  buyers only see their own orders/downloads
- **Checkout flow** — `/api/paystack/checkout` creates a pending order with
  the price pulled from the database (never trusts the browser), then
  `/api/paystack/verify` confirms the payment directly with Paystack's
  servers before generating a 24-hour signed download link
- **Homepage** — lists published products grouped by category
- **Product page** — Paystack inline popup checkout, then reveals the
  download link once payment is verified

## What's intentionally left for you to fill in

- **Auth** — the product page has a placeholder `REPLACE_WITH_AUTH_USER_ID`.
  Add Supabase Auth (email/password or magic link) and swap that for the
  real logged-in user's ID.
- **Seller upload form** — an admin page for you to add products (title,
  price, upload file to `product-files`, upload preview images to `previews`).
- **Visual design** — this scaffold is intentionally unstyled so the design
  can be built deliberately around your brand once you're ready, rather than
  defaulting to a generic template look.
- **Phase 5 (multi-seller)** — once you're ready, add a seller signup flow,
  Paystack subaccounts (for split payouts), and a seller dashboard. The
  `seller_id` field is already wired through products, orders, and payouts.

## A note on the journal/research category

Worth stating clearly in your listings that this content is reference
material — templates, examples, methodology guides — not meant for
submission as someone else's original coursework.
