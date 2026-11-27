-- ERD v2 — RPCs used by the app (product details, create/edit listing).

-- Form size labels ("Small", "Extra Large", "Free Size/One Size") or enum codes → product_size.
-- NULL = free size / not sized. Unknown labels are rejected.
create or replace function inventory_private.to_product_size(label text)
returns public.product_size language plpgsql immutable set search_path = '' as $$
declare
  normalized text := lower(btrim(coalesce(label, '')));
begin
  if normalized in ('', 'free size/one size', 'free size', 'one size') then return null; end if;
  return case normalized
    when 'small' then 'S' when 's' then 'S'
    when 'medium' then 'M' when 'm' then 'M'
    when 'large' then 'L' when 'l' then 'L'
    when 'extra large' then 'XL' when 'xl' then 'XL'
    when 'extra extra large' then '2XL' when '2xl' then '2XL' when 'xxl' then '2XL'
    when '3xl' then '3XL' when '4xl' then '4XL' when '5xl' then '5XL' when '6xl' then '6XL'
  end::public.product_size;
end;
$$;

create or replace function inventory_private.require_product_size(label text)
returns public.product_size language plpgsql immutable set search_path = '' as $$
declare
  result public.product_size := inventory_private.to_product_size(label);
begin
  if result is null and lower(btrim(coalesce(label, ''))) not in ('', 'free size/one size', 'free size', 'one size') then
    raise exception 'Unsupported size: %', label using errcode = '22023';
  end if;
  return result;
end;
$$;

-- Category by id, or by name (created on first use).
create or replace function inventory_private.resolve_category(listing jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  chosen uuid := nullif(listing->>'category_id', '')::uuid;
  typed text := nullif(btrim(listing->>'category_name'), '');
begin
  if chosen is not null then
    if not exists (select from public."Category" where category_id = chosen) then
      raise exception 'Choose an available category.' using errcode = '22023';
    end if;
    return chosen;
  end if;
  if typed is null then return null; end if;
  insert into public."Category" (name) values (typed) on conflict (lower(btrim(name))) do nothing;
  select category_id into chosen from public."Category" where lower(btrim(name)) = lower(typed);
  return chosen;
end;
$$;

create or replace function inventory_private.variant_sku(acronym text, product_name text, variant_name text, size public.product_size, variant_id uuid)
returns text language sql immutable set search_path = '' as $$
  select trim(both '-' from regexp_replace(upper(concat_ws('-',
    coalesce(nullif(acronym, ''), 'ORG'), product_name,
    nullif(concat_ws('-', nullif(variant_name, 'Default'), size::text), '')
  )), '[^A-Z0-9]+', '-', 'g')) || '-' || upper(left(variant_id::text, 8));
$$;

-- ── Create ──────────────────────────────────────────────────────────────────────────────────
-- listing.combinations[]: { color, size, stock, price, image_path }  → one ProductVariant each
create or replace function inventory_private.create_inventory_product(listing jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  seller_id uuid := auth.uid();
  requested_id uuid := (listing->>'product_id')::uuid;
  seller_acronym text;
  chosen_category uuid;
  product_name text := btrim(listing->>'name');
  product_description text := btrim(listing->>'description');
  product_price numeric := (listing->>'price')::numeric;
  media_prefix text := seller_id::text || '/' || requested_id::text || '/';
  media record;
  combination record;
  new_variant uuid;
begin
  select acronym into seller_acronym from public."Organization" where organization_id = seller_id;
  if not found then
    raise exception 'An organization account is required.' using errcode = '42501';
  end if;
  if requested_id is null then
    raise exception 'A product ID is required.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(requested_id::text, 0));
  if exists (select from public."Product" where product_id = requested_id and organization_id = seller_id) then
    return requested_id;
  end if;

  if coalesce(length(product_name), 0) not between 1 and 100
    or coalesce(length(product_description), 0) not between 1 and 250
    or product_price is null or product_price < 0 or product_price >= 100000000
    or (listing->>'is_active') is null or (listing->>'is_for_members_only') is null
    or coalesce(btrim(listing->>'pickup_contact_person'), '') = ''
    or coalesce(btrim(listing->>'pickup_contact_email'), '') = ''
    or coalesce(btrim(listing->>'pickup_contact_number'), '') = ''
  then
    raise exception 'Complete the product and pickup details before saving.' using errcode = '22023';
  end if;

  if coalesce(jsonb_typeof(listing->'images'), '') <> 'array'
    or coalesce(jsonb_typeof(listing->'combinations'), '') <> 'array'
    or jsonb_array_length(listing->'images') not between 1 and 5
    or jsonb_array_length(listing->'combinations') < 1
  then
    raise exception 'A cover photo and stock details are required.' using errcode = '22023';
  end if;
  if exists (
    select from jsonb_to_recordset(listing->'combinations') as fields(color text, size text)
    group by lower(coalesce(nullif(btrim(color), ''), 'Default')), inventory_private.require_product_size(size)
    having count(*) > 1
  ) then
    raise exception 'Each variant combination must be unique.' using errcode = '22023';
  end if;

  for media in
    select value as path, 'image/%' as mime from jsonb_array_elements_text(listing->'images')
    union select listing->>'video_path', 'video/mp4' where listing->>'video_path' is not null
    union select entry->>'image_path', 'image/%' from jsonb_array_elements(listing->'combinations') entry
      where entry->>'image_path' is not null
  loop
    if media.path is null or not starts_with(media.path, media_prefix) or not exists (
      select from storage.objects so where so.bucket_id = 'product-media' and so.name = media.path
        and so.metadata->>'mimetype' like media.mime
    ) then
      raise exception 'One of the uploaded files is unavailable.' using errcode = '22023';
    end if;
  end loop;

  chosen_category := inventory_private.resolve_category(listing);
  if chosen_category is null then
    raise exception 'A product category is required.' using errcode = '22023';
  end if;

  insert into public."Product" (
    product_id, organization_id, category_id, name, price, description, is_active, is_for_members_only,
    cover_video_path, pickup_contact_person, pickup_contact_email, pickup_contact_number,
    pickup_social_url, preorder_start_date, preorder_end_date
  ) values (
    requested_id, seller_id, chosen_category, product_name, product_price, product_description,
    (listing->>'is_active')::boolean, (listing->>'is_for_members_only')::boolean,
    'product-media/' || (listing->>'video_path'), btrim(listing->>'pickup_contact_person'),
    btrim(listing->>'pickup_contact_email'), btrim(listing->>'pickup_contact_number'),
    nullif(btrim(listing->>'pickup_social_url'), ''),
    (listing->>'preorder_start_date')::date, (listing->>'preorder_end_date')::date
  );
  insert into public."ProductImage" (product_id, image_url, position)
    select requested_id, 'product-media/' || path, (ordinality - 1)::smallint
    from jsonb_array_elements_text(listing->'images') with ordinality as images(path, ordinality);

  for combination in
    select coalesce(nullif(btrim(color), ''), 'Default') as name, inventory_private.require_product_size(size) as size,
      stock, price, image_path
    from jsonb_to_recordset(listing->'combinations')
      as fields(color text, size text, stock integer, price numeric, image_path text)
  loop
    if combination.stock is null or combination.stock < 0
      or (combination.price is not null and (combination.price < 0 or combination.price >= 100000000))
    then
      raise exception 'Variant prices and stock must be valid nonnegative amounts.' using errcode = '22023';
    end if;
    new_variant := gen_random_uuid();
    insert into public."ProductVariant" (variant_id, product_id, name, size, price_override, image_url)
      values (new_variant, requested_id, combination.name, combination.size, combination.price,
        'product-media/' || combination.image_path);
    insert into public."Inventory" (variant_id, stock_quantity, sku)
      values (new_variant, combination.stock,
        inventory_private.variant_sku(seller_acronym, product_name, combination.name, combination.size, new_variant));
  end loop;
  return requested_id;
end;
$$;

-- ── Edit ────────────────────────────────────────────────────────────────────────────────────
-- listing.combinations[]: { variant_id?, color, size, stock, previous_stock?, price, image_path }
create or replace function inventory_private.edit_inventory_product(listing jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  seller_id uuid := auth.uid();
  requested_id uuid := (listing->>'product_id')::uuid;
  edit_id uuid := (listing->>'edit_id')::uuid;
  current_version timestamptz;
  last_edit_id uuid;
  seller_acronym text;
  chosen_category uuid;
  product_name text := btrim(listing->>'name');
  product_description text := nullif(btrim(listing->>'description'), '');
  product_price numeric := (listing->>'price')::numeric;
  media_prefix text := seller_id::text || '/' || requested_id::text || '/';
  media record;
  combination record;
  current_variant uuid;
  kept_ids uuid[] := '{}';
begin
  select p.updated_at, p.last_inventory_edit_id, o.acronym into current_version, last_edit_id, seller_acronym
  from public."Product" p join public."Organization" o using (organization_id)
  where p.product_id = requested_id and p.organization_id = seller_id
  for update of p;
  if not found then
    raise exception 'This product is unavailable or belongs to another organization.' using errcode = '42501';
  end if;
  if edit_id is null then raise exception 'An edit ID is required.' using errcode = '22023'; end if;
  if last_edit_id = edit_id then return requested_id; end if;
  if current_version is distinct from (listing->>'expected_updated_at')::timestamptz then
    raise exception 'This listing changed. Reload the edit page before saving again.' using errcode = '22023';
  end if;

  if coalesce(length(product_name), 0) not between 1 and 100
    or length(product_description) > 250
    or product_price is null or product_price < 0 or product_price >= 100000000
    or (listing->>'is_for_members_only') is null
    or coalesce(jsonb_typeof(listing->'images'), '') <> 'array'
    or coalesce(jsonb_typeof(listing->'combinations'), '') <> 'array'
  then
    raise exception 'Check the product details and try again.' using errcode = '22023';
  end if;
  if jsonb_array_length(listing->'combinations') = 0 then
    raise exception 'Stock details are required.' using errcode = '22023';
  end if;

  for media in
    select value as path, 'image/%' as mime from jsonb_array_elements_text(listing->'images')
    union select listing->>'video_path', 'video/mp4' where listing->>'video_path' is not null
    union select entry->>'image_path', 'image/%' from jsonb_array_elements(listing->'combinations') entry
      where entry->>'image_path' is not null
  loop
    if media.mime = 'video/mp4' and exists (
      select from public."Product" where product_id = requested_id and cover_video_path = media.path
    ) then continue; end if;
    if media.mime = 'image/%' and (
      exists (select from public."ProductImage" where product_id = requested_id and image_url = media.path)
      or exists (select from public."ProductVariant" where product_id = requested_id and image_url = media.path)
    ) then continue; end if;
    if media.path is null or not starts_with(media.path, 'product-media/' || media_prefix) or not exists (
      select from storage.objects so where so.bucket_id = 'product-media'
        and 'product-media/' || so.name = media.path and so.metadata->>'mimetype' like media.mime
    ) then
      raise exception 'One of the uploaded files is unavailable.' using errcode = '22023';
    end if;
  end loop;

  chosen_category := inventory_private.resolve_category(listing);

  update public."Product" set name = product_name, description = product_description, price = product_price,
    category_id = coalesce(chosen_category, category_id),
    is_for_members_only = (listing->>'is_for_members_only')::boolean,
    cover_video_path = listing->>'video_path',
    pickup_contact_person = nullif(btrim(listing->>'pickup_contact_person'), ''),
    pickup_contact_email = nullif(btrim(listing->>'pickup_contact_email'), ''),
    pickup_contact_number = nullif(btrim(listing->>'pickup_contact_number'), ''),
    pickup_social_url = nullif(btrim(listing->>'pickup_social_url'), ''),
    preorder_start_date = (listing->>'preorder_start_date')::date,
    preorder_end_date = (listing->>'preorder_end_date')::date,
    updated_at = clock_timestamp(), last_inventory_edit_id = edit_id
  where product_id = requested_id;

  delete from public."ProductImage" where product_id = requested_id;
  insert into public."ProductImage" (product_id, image_url, position)
    select requested_id, path, (ordinality - 1)::smallint
    from jsonb_array_elements_text(listing->'images') with ordinality as images(path, ordinality);

  for combination in
    select variant_id, coalesce(nullif(btrim(color), ''), 'Default') as name,
      inventory_private.require_product_size(size) as size, stock, previous_stock, price, image_path
    from jsonb_to_recordset(listing->'combinations')
      as fields(variant_id uuid, color text, size text, stock integer, previous_stock integer, price numeric, image_path text)
    order by variant_id
  loop
    if combination.stock is null or combination.stock < 0
      or (combination.price is not null and (combination.price < 0 or combination.price >= 100000000))
    then
      raise exception 'Variant prices and stock must be valid nonnegative amounts.' using errcode = '22023';
    end if;
    current_variant := combination.variant_id;
    if current_variant is not null then
      if current_variant = any(kept_ids) or combination.previous_stock is null then
        raise exception 'Invalid existing variant.' using errcode = '22023';
      end if;
      update public."ProductVariant"
        set price_override = combination.price, image_url = combination.image_path, updated_at = clock_timestamp()
      where variant_id = current_variant and product_id = requested_id;
      if not found then raise exception 'A variant no longer belongs to this product.' using errcode = '22023'; end if;
      if combination.stock <> combination.previous_stock then
        insert into public."Inventory" (variant_id, stock_quantity) values (current_variant, combination.stock)
          on conflict (variant_id) do update set stock_quantity = excluded.stock_quantity, updated_at = clock_timestamp()
          where "Inventory".stock_quantity in (combination.previous_stock, combination.stock);
        if not found then raise exception 'Stock changed since this page loaded. Reload before editing stock.' using errcode = '22023'; end if;
      end if;
    else
      current_variant := gen_random_uuid();
      insert into public."ProductVariant" (variant_id, product_id, name, size, price_override, image_url)
        values (current_variant, requested_id, combination.name, combination.size, combination.price, combination.image_path);
      insert into public."Inventory" (variant_id, stock_quantity, sku)
        values (current_variant, combination.stock,
          inventory_private.variant_sku(seller_acronym, product_name, combination.name, combination.size, current_variant));
    end if;
    kept_ids := array_append(kept_ids, current_variant);
  end loop;

  -- Order history keeps its lines (OrderInventory.inventory_id is nullable), but sellers
  -- shouldn't silently drop a variant that has sales or reservations.
  if exists (
    select from public."ProductVariant" v
    join public."Inventory" i on i.variant_id = v.variant_id
    join public."OrderInventory" oi on oi.inventory_id = i.inventory_id
    where v.product_id = requested_id and v.variant_id <> all(kept_ids)
  ) or exists (
    select from public."ProductVariant" v
    join public."PreOrder" r on r.variant_id = v.variant_id
    where v.product_id = requested_id and v.variant_id <> all(kept_ids)
  ) then
    raise exception 'Variants with orders or preorders cannot be removed.' using errcode = '23503';
  end if;
  delete from public."ProductVariant" where product_id = requested_id and variant_id <> all(kept_ids);
  return requested_id;
end;
$$;

create or replace function public.create_inventory_product(listing jsonb)
returns uuid language sql set search_path = '' as $$ select inventory_private.create_inventory_product(listing); $$;
create or replace function public.edit_inventory_product(listing jsonb)
returns uuid language sql set search_path = '' as $$ select inventory_private.edit_inventory_product(listing); $$;

revoke all on function inventory_private.create_inventory_product(jsonb) from public, anon, authenticated;
revoke all on function inventory_private.edit_inventory_product(jsonb) from public, anon, authenticated;
revoke all on function public.create_inventory_product(jsonb) from public, anon, authenticated;
revoke all on function public.edit_inventory_product(jsonb) from public, anon, authenticated;
revoke all on function inventory_private.resolve_category(jsonb) from public, anon, authenticated;
grant execute on function inventory_private.create_inventory_product(jsonb) to authenticated;
grant execute on function inventory_private.edit_inventory_product(jsonb) to authenticated;
grant execute on function public.create_inventory_product(jsonb) to authenticated;
grant execute on function public.edit_inventory_product(jsonb) to authenticated;

-- ── Student product details ─────────────────────────────────────────────────────────────────
create or replace function public.get_student_product_details(p_product_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
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
  if not found then return null; end if;

  if v_product.is_for_members_only and not exists (
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
    'category', (select c.name from public."Category" c where c.category_id = v_product.category_id),
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
    'variants', coalesce((
      select jsonb_agg(jsonb_build_object(
        'variant_id', v.variant_id,
        'inventory_id', inv.inventory_id,
        'name', v.name,
        'size', v.size,
        'price', coalesce(v.price_override, v_product.price),
        'image_url', nullif(v.image_url, ''),
        'stock', coalesce(inv.stock_quantity, 0)
      ) order by lower(v.name), v.size nulls first, v.variant_id)
      from public."ProductVariant" v
      left join public."Inventory" inv on inv.variant_id = v.variant_id
      where v.product_id = p_product_id
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
          where si.student_id = r.student_id order by si.image_id limit 1
        ),
        'variants', coalesce((
          select jsonb_agg(distinct line.label)
          from (
            select concat_ws(' / ', nullif(v.name, 'Default'), v.size::text) as label
            from public."OrderInventory" oi
            join public."Inventory" inv on inv.inventory_id = oi.inventory_id
            join public."ProductVariant" v on v.variant_id = inv.variant_id
            where oi.order_id = r.order_id and v.product_id = p_product_id
          ) line
          where line.label <> ''
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
        join public."ProductVariant" v on v.variant_id = inv.variant_id
        where oi.order_id = r.order_id and v.product_id = p_product_id
      )
    ), '[]'::jsonb)
  );
end;
$$;
revoke execute on function public.get_student_product_details(uuid) from public, anon;
grant execute on function public.get_student_product_details(uuid) to authenticated;
