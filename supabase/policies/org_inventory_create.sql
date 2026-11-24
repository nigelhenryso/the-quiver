alter table public."Product"
  add column cover_video_path text,
  add column pickup_contact_person text,
  add column pickup_contact_email text,
  add column pickup_contact_number text,
  add column pickup_social_url text,
  add column preorder_start_date date,
  add column preorder_end_date date,
  add constraint product_preorder_dates_check check (
    (preorder_start_date is null and preorder_end_date is null) or
    (preorder_start_date is not null and preorder_end_date is not null and preorder_start_date <= preorder_end_date)
  );

alter table public."ProductImage" add column position smallint;

create unique index tag_normalized_name_key on public."Tag" (lower(btrim(name)));
create unique index variant_option_normalized_name_key
  on public."VariantOption" (variant_type_id, lower(btrim(name)));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-media', 'product-media', false, 31457280, array['image/*', 'video/mp4']);

create policy "Organizations upload own product media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-media' and split_part(name, '/', 1) = (select auth.uid())::text
    and exists (select 1 from public."Organization" where organization_id = (select auth.uid()))
  );

create policy "Organizations read own product media" on storage.objects
  for select to authenticated
  using (bucket_id = 'product-media' and split_part(name, '/', 1) = (select auth.uid())::text);

create policy "Organizations remove uncommitted product media" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-media' and split_part(name, '/', 1) = (select auth.uid())::text
    and not exists (
      select 1 from public."Product" p
      where p.organization_id = (select auth.uid()) and p.product_id::text = split_part(objects.name, '/', 2)
    )
  );

create schema inventory_private;
revoke all on schema inventory_private from public;
grant usage on schema inventory_private to authenticated;

-- Keep elevated writes off the exposed schema. The public wrapper runs as the caller.
create function inventory_private.create_inventory_product(listing jsonb)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  seller_id uuid := auth.uid();
  requested_id uuid := (listing->>'product_id')::uuid;
  seller_acronym text;
  category_id uuid := (listing->>'tag_id')::uuid;
  category_name text := btrim(listing->>'category_name');
  product_name text := btrim(listing->>'name');
  product_description text := btrim(listing->>'description');
  product_price numeric := (listing->>'price')::numeric;
  media_prefix text := seller_id::text || '/' || requested_id::text || '/';
  media record;
  combination record;
  option_row record;
  option_id uuid;
  option_type_id uuid;
  combo_id uuid;
  sku_prefix text;
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
    or (listing->>'is_active') is null or (listing->>'is_member_exclusive') is null
    or coalesce(btrim(listing->>'pickup_contact_person'), '') = ''
    or coalesce(btrim(listing->>'pickup_contact_email'), '') = ''
    or coalesce(btrim(listing->>'pickup_contact_number'), '') = ''
  then
    raise exception 'Complete the product and pickup details before saving.' using errcode = '22023';
  end if;

  if coalesce(jsonb_typeof(listing->'images'), '') <> 'array'
    or coalesce(jsonb_typeof(listing->'combinations'), '') <> 'array'
  then
    raise exception 'A cover photo and stock details are required.' using errcode = '22023';
  end if;
  if jsonb_array_length(listing->'images') not between 1 and 5
    or jsonb_array_length(listing->'combinations') < 1
  then
    raise exception 'A cover photo and stock details are required.' using errcode = '22023';
  end if;
  if exists (
    select from jsonb_to_recordset(listing->'combinations') as fields(color text, size text)
    group by nullif(lower(btrim(color)), ''), nullif(lower(btrim(size)), '')
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

  if category_id is null then
    if coalesce(length(category_name), 0) = 0 then
      raise exception 'A product category is required.' using errcode = '22023';
    end if;
    insert into public."Tag" (name) values (category_name)
      on conflict (lower(btrim(name))) do nothing;
    select tag_id into category_id from public."Tag" where lower(btrim(name)) = lower(category_name);
  elsif not exists (select from public."Tag" where tag_id = category_id) then
    raise exception 'Choose an available category.' using errcode = '22023';
  end if;

  insert into public."Product" (
    product_id, organization_id, name, price, description, is_active, is_member_exclusive,
    cover_video_path, pickup_contact_person, pickup_contact_email, pickup_contact_number,
    pickup_social_url, preorder_start_date, preorder_end_date
  ) values (
    requested_id, seller_id, product_name, product_price, product_description,
    (listing->>'is_active')::boolean, (listing->>'is_member_exclusive')::boolean,
    'product-media/' || (listing->>'video_path'), btrim(listing->>'pickup_contact_person'),
    btrim(listing->>'pickup_contact_email'), btrim(listing->>'pickup_contact_number'),
    nullif(btrim(listing->>'pickup_social_url'), ''),
    (listing->>'preorder_start_date')::date, (listing->>'preorder_end_date')::date
  );
  insert into public."ProductTag"(product_id, tag_id) values (requested_id, category_id);
  insert into public."ProductImage"(product_id, image_url, position)
    select requested_id, 'product-media/' || path, (ordinality - 1)::smallint
    from jsonb_array_elements_text(listing->'images') with ordinality as images(path, ordinality);

  for combination in
    select nullif(btrim(color), '') as color, nullif(btrim(size), '') as size, stock, price, image_path
    from jsonb_to_recordset(listing->'combinations')
      as fields(color text, size text, stock integer, price numeric, image_path text)
    order by lower(color), lower(size)
  loop
    if combination.stock is null or combination.stock < 0
      or (combination.price is not null and (combination.price < 0 or combination.price >= 100000000))
    then
      raise exception 'Variant prices and stock must be valid nonnegative amounts.' using errcode = '22023';
    end if;
    combo_id := gen_random_uuid();
    sku_prefix := trim(both '-' from regexp_replace(upper(concat_ws('-',
      coalesce(nullif(seller_acronym, ''), 'ORG'), product_name,
      coalesce(nullif(concat_ws('-', combination.color, combination.size), ''), 'BASE')
    )), '[^A-Z0-9]+', '-', 'g'));
    insert into public."ProductVariantCombination"(combination_id, product_id, sku, price_override, image_url)
      values (combo_id, requested_id, sku_prefix || '-' || upper(left(combo_id::text, 8)),
        combination.price, 'product-media/' || combination.image_path);
    insert into public."Inventory"(combination_id, stock_quantity) values (combo_id, combination.stock);

    for option_row in
      select * from (values ('Color', combination.color), ('Size', combination.size)) as options(type_name, name)
      where name is not null
    loop
      select variant_type_id into strict option_type_id from public."VariantTypes" where name = option_row.type_name;
      insert into public."VariantOption"(variant_type_id, name) values (option_type_id, option_row.name)
        on conflict (variant_type_id, lower(btrim(name))) do nothing;
      select variant_id into strict option_id from public."VariantOption"
        where variant_type_id = option_type_id and lower(btrim(name)) = lower(option_row.name);
      insert into public."CombinationOption"(combination_id, variant_id) values (combo_id, option_id);
    end loop;
  end loop;
  return requested_id;
end;
$$;

create function public.create_inventory_product(listing jsonb)
returns uuid language sql security invoker set search_path = ''
as $$ select inventory_private.create_inventory_product(listing); $$;

revoke all on function inventory_private.create_inventory_product(jsonb) from public, anon, authenticated;
revoke all on function public.create_inventory_product(jsonb) from public, anon, authenticated;
grant execute on function inventory_private.create_inventory_product(jsonb) to authenticated;
grant execute on function public.create_inventory_product(jsonb) to authenticated;
