-- Read access the org dashboard needs (run in the Supabase SQL editor).
-- Org accounts log in with auth.uid() = Organization.organization_id.
-- All policies are SELECT-only and PERMISSIVE, so they only add access; existing policies are untouched.

-- Helper functions run as the table owner (security definer) so the policies below
-- don't recurse through each other's RLS and stay fast.
create or replace function public.org_owns_product(p_product_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from "Product" p
    where p.product_id = p_product_id and p.organization_id = auth.uid()
  );
$$;

create or replace function public.org_owns_inventory(p_inventory_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from "Inventory" i
    join "Product" p on p.product_id = i.product_id
    where i.inventory_id = p_inventory_id and p.organization_id = auth.uid()
  );
$$;

create or replace function public.org_owns_order(p_order_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from "Order" o
    join "Inventory" i on i.inventory_id = o.inventory_id
    join "Product" p on p.product_id = i.product_id
    where o.order_id = p_order_id and p.organization_id = auth.uid()
  );
$$;

create or replace function public.org_has_customer(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from "Order" o
    join "Inventory" i on i.inventory_id = o.inventory_id
    join "Product" p on p.product_id = i.product_id
    where o.student_id = p_student_id and p.organization_id = auth.uid()
  );
$$;

-- Org's own products / stock / orders / payments
drop policy if exists "Organizations read own products" on "Product";
create policy "Organizations read own products" on "Product"
  for select to authenticated using (organization_id = auth.uid());

drop policy if exists "Organizations read own inventory" on "Inventory";
create policy "Organizations read own inventory" on "Inventory"
  for select to authenticated using (public.org_owns_product(product_id));

drop policy if exists "Organizations read own orders" on "Order";
create policy "Organizations read own orders" on "Order"
  for select to authenticated using (public.org_owns_inventory(inventory_id));

drop policy if exists "Organizations read payments for own orders" on "Payment";
create policy "Organizations read payments for own orders" on "Payment"
  for select to authenticated using (public.org_owns_order(order_id));

-- Customer names on Recent Orders
drop policy if exists "Organizations read their customers" on "Student";
create policy "Organizations read their customers" on "Student"
  for select to authenticated using (public.org_has_customer(student_id));

-- Lookup tables, safe for any logged-in user
drop policy if exists "Authenticated can read payment modes" on "PaymentMode";
create policy "Authenticated can read payment modes" on "PaymentMode"
  for select to authenticated using (true);

drop policy if exists "Authenticated can read product images" on "ProductImage";
create policy "Authenticated can read product images" on "ProductImage"
  for select to authenticated using (true);

drop policy if exists "Authenticated can read variant options" on "VariantOption";
create policy "Authenticated can read variant options" on "VariantOption"
  for select to authenticated using (true);

drop policy if exists "Authenticated can read variant types" on "VariantType";
create policy "Authenticated can read variant types" on "VariantType"
  for select to authenticated using (true);

-- Check which tables have RLS on and which policies exist:
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;
-- select tablename, policyname, cmd from pg_policies where schemaname = 'public' order by 1, 2;
