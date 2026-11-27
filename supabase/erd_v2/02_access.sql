-- ERD v2 — ownership helpers, RLS policies and storage policies.

-- ── Helpers (security definer so policies can look across tables) ───────────────────────────
create or replace function public.org_owns_variant(p_variant_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public."ProductVariant" v
    join public."Product" p on p.product_id = v.product_id
    where v.variant_id = p_variant_id and p.organization_id = (select auth.uid())
  );
$$;

create or replace function public.org_owns_inventory(p_inventory_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public."Inventory" i
    join public."ProductVariant" v on v.variant_id = i.variant_id
    join public."Product" p on p.product_id = v.product_id
    where i.inventory_id = p_inventory_id and p.organization_id = (select auth.uid())
  );
$$;

create or replace function public.org_owns_order(p_order_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public."OrderInventory" oi
    join public."Inventory" i on i.inventory_id = oi.inventory_id
    join public."ProductVariant" v on v.variant_id = i.variant_id
    join public."Product" p on p.product_id = v.product_id
    where oi.order_id = p_order_id and p.organization_id = (select auth.uid())
  );
$$;

-- Students who ordered or pre-ordered from the calling org.
create or replace function public.org_has_customer(p_student_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public."Order" o
    join public."OrderInventory" oi on oi.order_id = o.order_id
    join public."Inventory" i on i.inventory_id = oi.inventory_id
    join public."ProductVariant" v on v.variant_id = i.variant_id
    join public."Product" p on p.product_id = v.product_id
    where o.student_id = p_student_id and p.organization_id = (select auth.uid())
  ) or exists (
    select 1 from public."PreOrder" r
    where r.student_id = p_student_id and r.organization_id = (select auth.uid())
  );
$$;

create or replace function public.student_owns_order(p_order_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public."Order" o where o.order_id = p_order_id and o.student_id = (select auth.uid()));
$$;

create or replace function public.student_owns_cart(p_cart_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public."OrderCart" c where c.order_cart_id = p_cart_id and c.student_id = (select auth.uid()));
$$;

-- A product counts as a catalog pre-order once it has a reservation (unchanged rule).
create function private.has_catalog_preorder(candidate_product_id uuid, candidate_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public."Student" s where s.student_id = (select auth.uid()))
    and exists (
      select 1 from public."PreOrder" r
      join public."ProductVariant" v on v.variant_id = r.variant_id
      where v.product_id = candidate_product_id and r.organization_id = candidate_organization_id
    );
$$;
revoke execute on function private.has_catalog_preorder(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function private.has_catalog_preorder(uuid, uuid) to authenticated;

-- Unnamed Product argument → PostgREST computed column / filter.
create function public.has_catalog_preorder(public."Product")
returns boolean language sql stable set search_path = '' as $$
  select private.has_catalog_preorder($1.product_id, $1.organization_id);
$$;
revoke execute on function public.has_catalog_preorder(public."Product") from public, anon, authenticated, service_role;
grant execute on function public.has_catalog_preorder(public."Product") to authenticated;

-- ── Table policies ──────────────────────────────────────────────────────────────────────────
create policy "Organizations read their customers" on public."Student"
  for select to authenticated using (public.org_has_customer(student_id));

create policy "Authenticated can read categories" on public."Category"
  for select to authenticated using (true);

-- Visibility of variants/stock follows Product's own policies (the subquery runs under RLS).
create policy "Organizations read own variants" on public."ProductVariant"
  for select to authenticated using (public.org_owns_product(product_id));
create policy "Students read variants of visible products" on public."ProductVariant"
  for select to authenticated using (
    exists (select 1 from public."Product" p where p.product_id = "ProductVariant".product_id)
  );

create policy "Organizations read own inventory" on public."Inventory"
  for select to authenticated using (public.org_owns_variant(variant_id));
create policy "Students read stock of visible variants" on public."Inventory"
  for select to authenticated using (
    exists (select 1 from public."ProductVariant" v where v.variant_id = "Inventory".variant_id)
  );

create policy "Students manage own carts" on public."OrderCart"
  for all to authenticated
  using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));
create policy "Students manage own cart items" on public."OrderCartItem"
  for all to authenticated
  using (public.student_owns_cart(order_cart_id)) with check (public.student_owns_cart(order_cart_id));

create policy "Students manage own pre-orders" on public."PreOrder"
  for all to authenticated
  using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));
create policy "Organizations read own pre-orders" on public."PreOrder"
  for select to authenticated using (organization_id = (select auth.uid()));

create policy "Students read own orders" on public."Order"
  for select to authenticated using (student_id = (select auth.uid()));
create policy "Organizations read orders with own items" on public."Order"
  for select to authenticated using (public.org_owns_order(order_id));

create policy "Students read own order items" on public."OrderInventory"
  for select to authenticated using (public.student_owns_order(order_id));
create policy "Organizations read own order items" on public."OrderInventory"
  for select to authenticated using (public.org_owns_inventory(inventory_id));

create policy "Authenticated can read payment modes" on public."PaymentMode"
  for select to authenticated using (true);
create policy "Students read own payments" on public."Payment"
  for select to authenticated using (public.student_owns_order(order_id));
create policy "Organizations read payments for own orders" on public."Payment"
  for select to authenticated using (public.org_owns_order(order_id));

create policy "Authenticated can read ratings" on public."Rating"
  for select to authenticated using (true);
create policy "Students rate own orders" on public."Rating"
  for insert to authenticated
  with check (student_id = (select auth.uid()) and public.student_owns_order(order_id));
create policy "Authenticated can read rating images" on public."RatingImage"
  for select to authenticated using (true);

create policy "Read own notifications" on public."Notification"
  for select to authenticated using (
    (select auth.uid()) in (recipient_student_id, recipient_org_id, sender_student_id, sender_org_id)
  );
create policy "Recipients mark notifications read" on public."Notification"
  for update to authenticated
  using ((select auth.uid()) in (recipient_student_id, recipient_org_id))
  with check ((select auth.uid()) in (recipient_student_id, recipient_org_id));
revoke update on table public."Notification" from authenticated;
grant update (read_at) on table public."Notification" to authenticated;
create policy "Organizations notify their customers" on public."Notification"
  for insert to authenticated with check (
    sender_org_id = (select auth.uid()) and sender_student_id is null
    and recipient_student_id is not null and public.org_has_customer(recipient_student_id)
  );

-- ── Storage ─────────────────────────────────────────────────────────────────────────────────
-- Stock catalog photos in the private "images" bucket (tag_*.jpg, colours, laces, org logos).
create policy "Authenticated read catalog images" on storage.objects
  for select to authenticated using (bucket_id = 'images');

create policy "Organizations remove unreferenced product media" on storage.objects
  for delete to authenticated using (
    bucket_id = 'product-media'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and not exists (select from public."Product" p where p.cover_video_path = 'product-media/' || objects.name)
    and not exists (select from public."ProductImage" i where i.image_url = 'product-media/' || objects.name)
    and not exists (select from public."ProductVariant" v where v.image_url = 'product-media/' || objects.name)
  );

-- Students see a product's media whenever Product RLS lets them see the product.
create policy "Students read media of visible products" on storage.objects
  for select to authenticated using (
    bucket_id = 'product-media'
    and exists (select 1 from public."Student" s where s.student_id = (select auth.uid()))
    and exists (
      select 1 from public."Product" p
      where split_part(objects.name, '/', 1) = p.organization_id::text
        and (
          p.cover_video_path = 'product-media/' || objects.name
          or exists (select 1 from public."ProductImage" i
                     where i.product_id = p.product_id and i.image_url = 'product-media/' || objects.name)
          or exists (select 1 from public."ProductVariant" v
                     where v.product_id = p.product_id and v.image_url = 'product-media/' || objects.name)
        )
    )
  );

-- Helpers are only used by policies for signed-in users.
revoke execute on function public.org_owns_variant(uuid), public.org_owns_inventory(uuid), public.org_owns_order(uuid),
  public.org_has_customer(uuid), public.org_owns_product(uuid), public.student_owns_order(uuid), public.student_owns_cart(uuid)
  from public, anon;
grant execute on function public.org_owns_variant(uuid), public.org_owns_inventory(uuid), public.org_owns_order(uuid),
  public.org_has_customer(uuid), public.org_owns_product(uuid), public.student_owns_order(uuid), public.student_owns_cart(uuid)
  to authenticated;
