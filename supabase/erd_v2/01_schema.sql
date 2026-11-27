-- The Quiver — ERD v2 (STSWENG_ERD_1.pdf, 2026-11-28)
-- Replaces the catalog + transactional side of the schema. Identity tables (auth, Student,
-- StudentAffiliation, Organization, OrganizationImage, StudentImage) keep their data.
-- Pre-change copy of every public table: schema backup_20261128.

-- ── 1. Things that depend on the tables being dropped ───────────────────────────────────────
drop policy if exists "Organizations remove unreferenced product media" on storage.objects;
drop policy if exists "Students read cover videos of visible products" on storage.objects;
drop policy if exists "Students read images of active products from joined organizatio" on storage.objects;
drop policy if exists "Students read media for open non-exclusive pre-orders" on storage.objects;
drop policy if exists "Students read variant media from joined organizations" on storage.objects;
drop policy if exists "Organizations read their customers" on public."Student";

drop function if exists public.get_student_product_details(uuid);
drop function if exists public.has_catalog_preorder(public."Product");
drop function if exists private.has_catalog_preorder(uuid, uuid);
drop function if exists public.create_inventory_product(jsonb);
drop function if exists public.edit_inventory_product(jsonb);
drop function if exists inventory_private.create_inventory_product(jsonb);
drop function if exists inventory_private.edit_inventory_product(jsonb);

-- ── 2. Drop the old catalog/transactional tables (all orgs' data goes) ──────────────────────
drop table public."RatingImage";
drop table public."Rating";
drop table public."Payment";
drop table public."PaymentMode";
drop table public."OrderInventory";
drop table public."Order";
drop table public."OrderCartItem";
drop table public."OrderCart";
drop table public."PreOrder";
drop table public."Inventory";
drop table public."CombinationOption";
drop table public."VariantOption";
drop table public."VariantTypes";
drop table public."ProductVariantCombination";
drop table public."ProductTag";
drop table public."Tag";

drop function public.org_has_customer(uuid);
drop function public.org_owns_inventory(uuid);
drop function public.org_owns_order(uuid);

delete from public."ProductImage";
delete from public."Product";

-- Renamed rather than recreated (backup_20261128.PaymentMode still uses the type).
alter type public.payment_mode_type rename value 'Physical' to 'PHYSICAL';
alter type public.payment_mode_type rename value 'Digital' to 'DIGITAL';

-- ── 3. Enums ────────────────────────────────────────────────────────────────────────────────
create type public.product_size as enum ('S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL');
create type public.notification_type as enum ('ORDER_UPDATE', 'PREORDER_BROADCAST');
-- order_status already matches the ERD: Processing | R4P | Claimed | Unclaimed
alter type public.college rename value 'CLTSOE' to 'SOE';

-- ── 4. Student ──────────────────────────────────────────────────────────────────────────────
alter table public."Student" add column personal_email text;

-- ── 5. Catalog ──────────────────────────────────────────────────────────────────────────────
create table public."Category" (
  category_id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0)
);
create unique index category_normalized_name_key on public."Category" (lower(btrim(name)));

alter table public."Product" rename column is_member_exclusive to is_for_members_only;
alter table public."Product"
  alter column organization_id drop default,
  add column category_id uuid references public."Category" (category_id) on delete set null;
create index product_organization_id_idx on public."Product" (organization_id);
create index product_category_id_idx on public."Product" (category_id);
create index product_image_product_id_idx on public."ProductImage" (product_id);

create table public."ProductVariant" (
  variant_id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public."Product" (product_id) on delete cascade,
  name text not null check (length(btrim(name)) > 0), -- color/design; 'Default' = no named variant
  size public.product_size,                              -- null = free size / not sized
  price_override numeric check (price_override >= 0),    -- null = Product.price
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index product_variant_unique_key
  on public."ProductVariant" (product_id, lower(btrim(name)), size) nulls not distinct;

create table public."Inventory" (
  inventory_id uuid primary key default gen_random_uuid(),
  variant_id uuid not null unique references public."ProductVariant" (variant_id) on delete cascade,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  sku text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 6. Carts and pre-orders ─────────────────────────────────────────────────────────────────
create table public."OrderCart" (
  order_cart_id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public."Student" (student_id) on delete cascade,
  organization_id uuid not null references public."Organization" (organization_id) on delete cascade,
  unique (student_id, organization_id)
);
create index order_cart_organization_id_idx on public."OrderCart" (organization_id);

create table public."OrderCartItem" (
  cart_item_id uuid primary key default gen_random_uuid(),
  order_cart_id uuid not null references public."OrderCart" (order_cart_id) on delete cascade,
  inventory_id uuid not null references public."Inventory" (inventory_id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_cart_id, inventory_id)
);
create index order_cart_item_inventory_id_idx on public."OrderCartItem" (inventory_id);

create table public."PreOrder" (
  preorder_id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public."ProductVariant" (variant_id) on delete restrict,
  student_id uuid not null references public."Student" (student_id) on delete cascade,
  organization_id uuid not null references public."Organization" (organization_id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index preorder_variant_id_idx on public."PreOrder" (variant_id);
create index preorder_student_id_idx on public."PreOrder" (student_id);
create index preorder_organization_id_idx on public."PreOrder" (organization_id);

-- ── 7. Orders and payments ──────────────────────────────────────────────────────────────────
create table public."Order" (
  order_id uuid primary key default gen_random_uuid(),
  status public.order_status not null default 'Processing',
  student_id uuid not null references public."Student" (student_id),
  placed_at timestamptz not null default now()
);
create index order_student_id_idx on public."Order" (student_id);

create table public."OrderInventory" (
  order_inventory_id uuid primary key default gen_random_uuid(),
  inventory_id uuid references public."Inventory" (inventory_id) on delete set null, -- nullable per ERD
  order_id uuid not null references public."Order" (order_id) on delete cascade,
  quantity integer not null check (quantity > 0),
  total_cost numeric not null check (total_cost >= 0), -- unit price at sale × quantity
  unique (order_id, inventory_id)
);
create index order_inventory_inventory_id_idx on public."OrderInventory" (inventory_id);

create table public."PaymentMode" (
  payment_mode_id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type public.payment_mode_type not null
);

create table public."Payment" (
  payment_id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public."Order" (order_id) on delete cascade,
  payment_mode_id uuid not null references public."PaymentMode" (payment_mode_id),
  amount numeric not null check (amount >= 0),
  made_at timestamptz not null default now()
);
create index payment_order_id_idx on public."Payment" (order_id);
create index payment_payment_mode_id_idx on public."Payment" (payment_mode_id);

-- ── 8. Ratings ──────────────────────────────────────────────────────────────────────────────
create table public."Rating" (
  rating_id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public."Student" (student_id) on delete cascade,
  order_id uuid not null references public."Order" (order_id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index rating_student_id_idx on public."Rating" (student_id);
create index rating_order_id_idx on public."Rating" (order_id);

create table public."RatingImage" (
  image_id uuid primary key default gen_random_uuid(),
  rating_id uuid not null references public."Rating" (rating_id) on delete cascade,
  image_url text not null
);
create index rating_image_rating_id_idx on public."RatingImage" (rating_id);

-- ── 9. Notifications ────────────────────────────────────────────────────────────────────────
create table public."Notification" (
  notification_id uuid primary key default gen_random_uuid(),
  sender_student_id uuid references public."Student" (student_id) on delete cascade,
  sender_org_id uuid references public."Organization" (organization_id) on delete cascade,
  recipient_student_id uuid references public."Student" (student_id) on delete cascade,
  recipient_org_id uuid references public."Organization" (organization_id) on delete cascade,
  title text not null,
  body text not null,
  notification_type public.notification_type not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (num_nonnulls(sender_student_id, sender_org_id) <= 1),
  check (num_nonnulls(recipient_student_id, recipient_org_id) = 1)
);
create index notification_recipient_student_idx on public."Notification" (recipient_student_id, created_at desc);
create index notification_recipient_org_idx on public."Notification" (recipient_org_id, created_at desc);
create index notification_sender_student_idx on public."Notification" (sender_student_id);
create index notification_sender_org_idx on public."Notification" (sender_org_id);

alter table public."Category" enable row level security;
alter table public."ProductVariant" enable row level security;
alter table public."Inventory" enable row level security;
alter table public."OrderCart" enable row level security;
alter table public."OrderCartItem" enable row level security;
alter table public."PreOrder" enable row level security;
alter table public."Order" enable row level security;
alter table public."OrderInventory" enable row level security;
alter table public."PaymentMode" enable row level security;
alter table public."Payment" enable row level security;
alter table public."Rating" enable row level security;
alter table public."RatingImage" enable row level security;
alter table public."Notification" enable row level security;
