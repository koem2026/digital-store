-- Digital Goods Marketplace — core schema
-- Designed as single-seller for launch, but every table already carries
-- what's needed to open up to multiple sellers later (see seller_id / role).

create type product_category as enum (
  'ebook',
  'course',
  'design_template',
  'business_proposal',
  'web_template',
  'journal_research',
  'project_files',
  'idea_brief'
);

create type order_status as enum ('pending', 'paid', 'failed', 'refunded');
create type user_role as enum ('buyer', 'seller', 'admin');

-- Users (Supabase auth.users holds login; this holds app-level profile data)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'buyer',
  paystack_subaccount_code text, -- filled in when a seller is onboarded (Phase 5)
  created_at timestamptz not null default now()
);

-- Products
create table products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles(id) on delete cascade,
  category product_category not null,
  title text not null,
  slug text not null unique,
  description text not null,
  abstract text, -- short summary, mainly used for journal_research / idea_brief
  field_of_study text, -- e.g. 'Textiles', 'Computer Science' — for research/project content
  citation_style text, -- APA / MLA / Chicago, only relevant for academic content
  price_kobo integer not null, -- store in kobo (smallest unit) to avoid float rounding issues
  currency text not null default 'NGN',
  file_path text not null, -- private Supabase Storage path, never public
  file_type text not null, -- pdf, zip, epub, docx, figma_link, etc.
  file_size_bytes bigint,
  preview_images text[] default '{}', -- public Storage paths, screenshots/mockups
  live_preview_url text, -- mainly for web_template category
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create index products_category_idx on products(category);
create index products_seller_idx on products(seller_id);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id),
  status order_status not null default 'pending',
  total_kobo integer not null,
  paystack_reference text unique,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  seller_id uuid not null references profiles(id), -- denormalized for payout reporting later
  price_kobo integer not null -- price at time of purchase, in case seller changes it later
);

-- Signed, time-limited download grants — created only after payment is verified
create table downloads (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  buyer_id uuid not null references profiles(id),
  signed_url text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Row Level Security: buyers only see their own orders/downloads,
-- sellers only manage their own products
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table downloads enable row level security;

create policy "Published products are public" on products
  for select using (is_published = true);

create policy "Sellers manage their own products" on products
  for all using (auth.uid() = seller_id);

create policy "Buyers see their own orders" on orders
  for select using (auth.uid() = buyer_id);

create policy "Buyers see their own downloads" on downloads
  for select using (auth.uid() = buyer_id);
