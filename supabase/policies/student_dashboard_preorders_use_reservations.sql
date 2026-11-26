create schema if not exists private;
grant usage on schema private to authenticated;

-- PreOrder and Inventory retain their seller-only read policies.
-- The catalog lookup checks for a matching reservation and returns only a boolean.
create function private.has_catalog_preorder(candidate_product_id uuid, candidate_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public."Student" student
    where student.student_id = (select auth.uid())
  ) and exists (
    select 1
    from public."PreOrder" reservation
    join public."Inventory" inventory using (inventory_id)
    join public."ProductVariantCombination" variant using (combination_id)
    where variant.product_id = candidate_product_id
      and reservation.organization_id = candidate_organization_id
  );
$$;

revoke execute on function private.has_catalog_preorder(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function private.has_catalog_preorder(uuid, uuid) to authenticated;

-- An unnamed Product argument lets PostgREST use this as a catalog filter.
create function public.has_catalog_preorder(public."Product")
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.has_catalog_preorder($1.product_id, $1.organization_id);
$$;

revoke execute on function public.has_catalog_preorder(public."Product") from public, anon, authenticated, service_role;
grant execute on function public.has_catalog_preorder(public."Product") to authenticated;

alter policy "Students read open non-exclusive pre-orders"
  on public."Product" to authenticated
  using (
    is_active is true
    and is_member_exclusive is false
    and private.has_catalog_preorder(product_id, organization_id)
  );

alter policy "Students read variant images for non-exclusive pre-orders"
  on public."ProductVariantCombination" to authenticated
  using (
    nullif(image_url, '') is not null
    and exists (
      select 1 from public."Product" product
      where product.product_id = "ProductVariantCombination".product_id
        and product.is_active is true
        and product.is_member_exclusive is false
        and private.has_catalog_preorder(product.product_id, product.organization_id)
    )
  );

alter policy "Students read media for open non-exclusive pre-orders"
  on storage.objects to authenticated
  using (
    bucket_id = 'product-media'
    and exists (
      select 1 from public."Product" product
      where split_part(objects.name, '/', 1) = product.organization_id::text
        and product.is_active is true
        and product.is_member_exclusive is false
        and private.has_catalog_preorder(product.product_id, product.organization_id)
        and (
          exists (
            select 1 from public."ProductImage" image
            where image.product_id = product.product_id
              and image.image_url = 'product-media/' || objects.name
          )
          or exists (
            select 1 from public."ProductVariantCombination" variant
            where variant.product_id = product.product_id
              and variant.image_url = 'product-media/' || objects.name
          )
        )
    )
  );

notify pgrst, 'reload schema';
