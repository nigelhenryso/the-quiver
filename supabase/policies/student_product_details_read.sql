-- Product details page for students (/products/[productId]).
-- Students can't read CombinationOption, Inventory, OrderInventory or other students' rows,
-- so this returns only what the page needs. Returns null when the student can't see the product.
create or replace function public.get_student_product_details(p_product_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_student uuid := (select auth.uid());
  v_product public."Product";
  v_org public."Organization";
begin
  if not exists (select 1 from public."Student" s where s.student_id = v_student) then
    return null;
  end if;

  select * into v_product from public."Product" p
  where p.product_id = p_product_id and p.is_active is true;
  if not found then
    return null;
  end if;

  if v_product.is_member_exclusive and not exists (
    select 1 from public."StudentAffiliation" a
    where a.student_id = v_student and a.organization_id = v_product.organization_id
  ) then
    return null;
  end if;

  select * into v_org from public."Organization" o where o.organization_id = v_product.organization_id;

  return jsonb_build_object(
    'product_id', v_product.product_id,
    'name', v_product.name,
    'price', v_product.price,
    'description', v_product.description,
    'cover_video_path', nullif(v_product.cover_video_path, ''),
    'is_preorder', private.has_catalog_preorder(v_product.product_id, v_product.organization_id),
    'organization', jsonb_build_object(
      'organization_id', v_org.organization_id,
      'name', v_org.name,
      'acronym', v_org.acronym
    ),
    'images', coalesce((
      select jsonb_agg(i.image_url order by i.position nulls last, i.product_image_id)
      from public."ProductImage" i
      where i.product_id = p_product_id and nullif(i.image_url, '') is not null
    ), '[]'::jsonb),
    'options', coalesce((
      select jsonb_agg(distinct jsonb_build_object(
        'variant_id', vo.variant_id,
        'name', vo.name,
        'variant_type_id', vo.variant_type_id,
        'type_name', vt.name
      ))
      from public."ProductVariantCombination" c
      join public."CombinationOption" co on co.combination_id = c.combination_id
      join public."VariantOption" vo on vo.variant_id = co.variant_id
      left join public."VariantTypes" vt on vt.variant_type_id = vo.variant_type_id
      where c.product_id = p_product_id
    ), '[]'::jsonb),
    'combinations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'combination_id', c.combination_id,
        'inventory_id', inv.inventory_id,
        'price', coalesce(c.price_override, v_product.price),
        'image_url', nullif(c.image_url, ''),
        'stock', coalesce(inv.stock_quantity, 0),
        'option_ids', coalesce((
          select jsonb_agg(co.variant_id)
          from public."CombinationOption" co
          where co.combination_id = c.combination_id
        ), '[]'::jsonb)
      ) order by c.combination_id)
      from public."ProductVariantCombination" c
      left join public."Inventory" inv on inv.combination_id = c.combination_id
      where c.product_id = p_product_id
    ), '[]'::jsonb),
    'reviews', coalesce((
      select jsonb_agg(jsonb_build_object(
        'rating_id', r.rating_id,
        'rating', r.rating,
        'comment', r.comment,
        'created_at', r.created_at,
        'reviewer', nullif(trim(concat_ws(' ', s.first_name, left(s.last_name, 1) || '.')), ''),
        'avatar_url', (
          select si.image_url from public."StudentImage" si
          where si.student_id = r.student_id
          order by si.image_id limit 1
        ),
        'variants', coalesce((
          select jsonb_agg(line.label order by line.label)
          from (
            select string_agg(vo.name, ' / ' order by vt.name nulls last, vo.name) as label
            from public."OrderInventory" oi
            join public."Inventory" inv on inv.inventory_id = oi.inventory_id
            join public."ProductVariantCombination" c on c.combination_id = inv.combination_id
            join public."CombinationOption" co on co.combination_id = c.combination_id
            join public."VariantOption" vo on vo.variant_id = co.variant_id
            left join public."VariantTypes" vt on vt.variant_type_id = vo.variant_type_id
            where oi.order_id = r.order_id and c.product_id = p_product_id
            group by c.combination_id
          ) line
        ), '[]'::jsonb),
        'images', coalesce((
          select jsonb_agg(ri.image_url order by ri.image_id)
          from public."RatingImage" ri where ri.rating_id = r.rating_id
        ), '[]'::jsonb)
      ) order by r.created_at desc, r.rating_id)
      from public."Rating" r
      join public."Student" s on s.student_id = r.student_id
      where exists (
        select 1
        from public."OrderInventory" oi
        join public."Inventory" inv on inv.inventory_id = oi.inventory_id
        join public."ProductVariantCombination" c on c.combination_id = inv.combination_id
        where oi.order_id = r.order_id and c.product_id = p_product_id
      )
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.get_student_product_details(uuid) from public, anon;
grant execute on function public.get_student_product_details(uuid) to authenticated;

-- Students can play the cover video of any product they're allowed to see.
create policy "Students read cover videos of visible products"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'product-media'
    and exists (select 1 from public."Student" student where student.student_id = (select auth.uid()))
    and exists (
      select 1 from public."Product" product
      where product.cover_video_path = 'product-media/' || objects.name
        and split_part(objects.name, '/', 1) = product.organization_id::text
        and product.is_active is true
        and (
          product.is_member_exclusive is false
          or exists (
            select 1 from public."StudentAffiliation" affiliation
            where affiliation.organization_id = product.organization_id
              and affiliation.student_id = (select auth.uid())
          )
        )
    )
  );
