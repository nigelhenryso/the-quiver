alter table public."Product" add column last_inventory_edit_id uuid;

drop policy "Organizations remove uncommitted product media" on storage.objects;
create policy "Organizations remove unreferenced product media" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-media' and split_part(name, '/', 1) = (select auth.uid())::text
    and not exists (
      select from public."Product" p where p.cover_video_path = 'product-media/' || objects.name
    )
    and not exists (
      select from public."ProductImage" i where i.image_url = 'product-media/' || objects.name
    )
    and not exists (
      select from public."ProductVariantCombination" c where c.image_url = 'product-media/' || objects.name
    )
  );

create function inventory_private.edit_inventory_product(listing jsonb)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  seller_id uuid := auth.uid();
  requested_id uuid := (listing->>'product_id')::uuid;
  edit_id uuid := (listing->>'edit_id')::uuid;
  current_version timestamptz;
  last_edit_id uuid;
  seller_acronym text;
  category_id uuid := (listing->>'tag_id')::uuid;
  category_name text := nullif(btrim(listing->>'category_name'), '');
  product_name text := btrim(listing->>'name');
  product_description text := nullif(btrim(listing->>'description'), '');
  product_price numeric := (listing->>'price')::numeric;
  media_prefix text := seller_id::text || '/' || requested_id::text || '/';
  media record;
  combination record;
  option_row record;
  option_id uuid;
  option_type_id uuid;
  combo_id uuid;
  sku_prefix text;
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
    or (listing->>'is_member_exclusive') is null
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
      or exists (select from public."ProductVariantCombination" where product_id = requested_id and image_url = media.path)
    ) then continue; end if;
    if media.path is null or not starts_with(media.path, 'product-media/' || media_prefix) or not exists (
      select from storage.objects so where so.bucket_id = 'product-media'
        and 'product-media/' || so.name = media.path and so.metadata->>'mimetype' like media.mime
    ) then
      raise exception 'One of the uploaded files is unavailable.' using errcode = '22023';
    end if;
  end loop;

  if category_id is null and category_name is not null then
    insert into public."Tag" (name) values (category_name) on conflict (lower(btrim(name))) do nothing;
    select tag_id into category_id from public."Tag" where lower(btrim(name)) = lower(category_name);
  end if;
  if category_id is not null and not exists (
    select from public."ProductTag" where product_id = requested_id and tag_id = category_id
  ) then
    if not exists (select from public."Tag" where tag_id = category_id) then
      raise exception 'Choose an available category.' using errcode = '22023';
    end if;
    delete from public."ProductTag" where product_id = requested_id;
    insert into public."ProductTag" (product_id, tag_id) values (requested_id, category_id);
  end if;

  update public."Product" set name = product_name, description = product_description, price = product_price,
    is_member_exclusive = (listing->>'is_member_exclusive')::boolean,
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
    select combination_id, nullif(btrim(color), '') as color, nullif(btrim(size), '') as size,
      stock, previous_stock, price, image_path
    from jsonb_to_recordset(listing->'combinations')
      as fields(combination_id uuid, color text, size text, stock integer, previous_stock integer, price numeric, image_path text)
    order by combination_id, lower(color), lower(size)
  loop
    if combination.stock is null or combination.stock < 0
      or (combination.price is not null and (combination.price < 0 or combination.price >= 100000000))
    then
      raise exception 'Variant prices and stock must be valid nonnegative amounts.' using errcode = '22023';
    end if;
    combo_id := combination.combination_id;
    if combo_id is not null then
      if combo_id = any(kept_ids) or combination.previous_stock is null then
        raise exception 'Invalid existing variant.' using errcode = '22023';
      end if;
      update public."ProductVariantCombination" set price_override = combination.price, image_url = combination.image_path
      where combination_id = combo_id and product_id = requested_id;
      if not found then raise exception 'A variant no longer belongs to this product.' using errcode = '22023'; end if;
      if combination.stock <> combination.previous_stock then
        insert into public."Inventory" (combination_id, stock_quantity) values (combo_id, combination.stock)
          on conflict (combination_id) do update set stock_quantity = excluded.stock_quantity, updated_at = clock_timestamp()
          where "Inventory".stock_quantity in (combination.previous_stock, combination.stock);
        if not found then raise exception 'Stock changed since this page loaded. Reload before editing stock.' using errcode = '22023'; end if;
      end if;
    else
      combo_id := gen_random_uuid();
      sku_prefix := trim(both '-' from regexp_replace(upper(concat_ws('-',
        coalesce(nullif(seller_acronym, ''), 'ORG'), product_name,
        coalesce(nullif(concat_ws('-', combination.color, combination.size), ''), 'BASE')
      )), '[^A-Z0-9]+', '-', 'g'));
      insert into public."ProductVariantCombination" (combination_id, product_id, sku, price_override, image_url)
      values (combo_id, requested_id, sku_prefix || '-' || upper(left(combo_id::text, 8)), combination.price, combination.image_path);
      insert into public."Inventory" (combination_id, stock_quantity) values (combo_id, combination.stock);
      for option_row in
        select * from (values ('Color', combination.color), ('Size', combination.size)) as options(type_name, name)
        where name is not null
      loop
        select variant_type_id into strict option_type_id from public."VariantTypes" where name = option_row.type_name;
        insert into public."VariantOption" (variant_type_id, name) values (option_type_id, option_row.name)
          on conflict (variant_type_id, lower(btrim(name))) do nothing;
        select variant_id into strict option_id from public."VariantOption"
          where variant_type_id = option_type_id and lower(btrim(name)) = lower(option_row.name);
        insert into public."CombinationOption" (combination_id, variant_id) values (combo_id, option_id);
      end loop;
    end if;
    kept_ids := array_append(kept_ids, combo_id);
  end loop;

  begin
    delete from public."ProductVariantCombination"
    where product_id = requested_id and combination_id <> all(kept_ids);
  exception when foreign_key_violation then
    raise exception 'Variants with orders or preorders cannot be removed.' using errcode = '23503';
  end;
  return requested_id;
end;
$$;

create function public.edit_inventory_product(listing jsonb)
returns uuid language sql security invoker set search_path = ''
as $$ select inventory_private.edit_inventory_product(listing); $$;

revoke all on function inventory_private.edit_inventory_product(jsonb) from public, anon, authenticated;
revoke all on function public.edit_inventory_product(jsonb) from public, anon, authenticated;
grant execute on function inventory_private.edit_inventory_product(jsonb) to authenticated;
grant execute on function public.edit_inventory_product(jsonb) to authenticated;
