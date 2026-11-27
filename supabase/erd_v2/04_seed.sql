-- ERD v2 — sample data for LSCS, GGFM and DSS, built from images already in Storage:
--   images/            tag_*.jpg (product shots), blue/green/orange/purple/red/yellow.jpg (shirt colours),
--                      lace1-4.jpg (lace designs)
--   product-media/LSCS existing uploads (tote, clear phone case ×3, lace photo + video, bookmarks, phone charm)
-- Image references are storage paths ("images/…", "product-media/…"); the app signs them at read time.
-- Identity tables are untouched.

-- ── Lookups ─────────────────────────────────────────────────────────────────────────────────
insert into public."Category" (name) values
  ('Shirts'), ('ID Laces'), ('Bags'), ('Ballers'), ('Pins'), ('Keychains'),
  ('Bracelets'), ('Bookmarks'), ('Magnets'), ('Phone Accessories');

insert into public."PaymentMode" (name, type) values
  ('GCash', 'DIGITAL'), ('Maya', 'DIGITAL'), ('Cash', 'PHYSICAL');

-- ── Helpers (dropped at the end of this file) ──────────────────────────────────────────────
create schema seed_helpers;
-- variants: [{ "name": "Blue", "image": "images/blue.jpg", "sizes": ["S","M"], "stock": [5, 8] }]
--           [{ "name": "iPhone 15", "stock": 12 }]   (unsized)
--           [{ "stock": 40 }]                         (no variants → one "Default" row)
create function seed_helpers.seed_product(
  p_org text, p_id uuid, p_category text, p_name text, p_price numeric, p_description text,
  p_images text[], p_variants jsonb, p_created timestamptz,
  p_members_only boolean default false, p_preorder boolean default false,
  p_active boolean default true, p_video text default null
) returns uuid language plpgsql as $$
declare
  org public."Organization";
  pid uuid := coalesce(p_id, gen_random_uuid());
  v jsonb;
  i int;
  vid uuid;
  vsize public.product_size;
  vname text;
begin
  select * into strict org from public."Organization" where acronym = p_org;
  insert into public."Product" (
    product_id, organization_id, category_id, name, price, description, is_active, is_for_members_only,
    cover_video_path, pickup_contact_person, pickup_contact_email, pickup_contact_number,
    preorder_start_date, preorder_end_date, created_at, updated_at
  ) values (
    pid, org.organization_id, (select category_id from public."Category" where name = p_category),
    p_name, p_price, p_description, p_active, p_members_only, p_video,
    coalesce(org.contact_person, org.acronym || ' Logistics Head'), org.organization_email,
    coalesce(org.contact_number, case p_org when 'LSCS' then '0917 555 0101' when 'GGFM' then '0917 555 0202' else '0917 555 0303' end),
    case when p_preorder then date '2026-12-01' end, case when p_preorder then date '2026-12-20' end,
    p_created, p_created
  );
  insert into public."ProductImage" (product_id, image_url, position)
    select pid, url, (n - 1)::smallint from unnest(p_images) with ordinality as t(url, n);

  for v in select * from jsonb_array_elements(p_variants) loop
    vname := coalesce(v->>'name', 'Default');
    for i in 0 .. greatest(coalesce(jsonb_array_length(v->'sizes'), 0), 1) - 1 loop
      vsize := (v->'sizes'->>i)::public.product_size;
      insert into public."ProductVariant" (product_id, name, size, price_override, image_url, created_at, updated_at)
        values (pid, vname, vsize, (v->>'price')::numeric, v->>'image', p_created, p_created)
        returning variant_id into vid;
      insert into public."Inventory" (variant_id, stock_quantity, sku, created_at, updated_at)
        values (vid,
          case when p_preorder then 0
               when jsonb_typeof(v->'stock') = 'array' then coalesce((v->'stock'->>i)::int, 0)
               else coalesce((v->>'stock')::int, 0) end,
          inventory_private.variant_sku(org.acronym, p_name, vname, vsize, vid), p_created, p_created);
    end loop;
  end loop;
  return pid;
end;
$$;

create table seed_helpers.seeded_order (code text primary key, order_id uuid, org text, student_id uuid, status public.order_status, placed_at timestamptz);

-- lines: [[product name, variant name | null, size | null, qty], …]
create function seed_helpers.seed_order(
  p_code text, p_org text, p_student uuid, p_status public.order_status, p_placed timestamptz,
  p_lines jsonb, p_mode text
) returns uuid language plpgsql as $$
declare
  oid uuid;
  line jsonb;
  inv uuid;
  unit numeric;
  total numeric := 0;
begin
  insert into public."Order" (student_id, status, placed_at) values (p_student, p_status, p_placed)
    returning order_id into oid;
  for line in select * from jsonb_array_elements(p_lines) loop
    select i.inventory_id, coalesce(v.price_override, p.price) into strict inv, unit
    from public."Product" p
    join public."Organization" o on o.organization_id = p.organization_id
    join public."ProductVariant" v on v.product_id = p.product_id
    join public."Inventory" i on i.variant_id = v.variant_id
    where o.acronym = p_org and p.name = line->>0
      and v.name = coalesce(line->>1, 'Default')
      and v.size is not distinct from (line->>2)::public.product_size;
    insert into public."OrderInventory" (order_id, inventory_id, quantity, total_cost)
      values (oid, inv, (line->>3)::int, unit * (line->>3)::int);
    total := total + unit * (line->>3)::int;
  end loop;
  if p_mode is not null then
    insert into public."Payment" (order_id, payment_mode_id, amount, made_at)
      values (oid, (select payment_mode_id from public."PaymentMode" where name = p_mode), total, p_placed + interval '2 hours');
  end if;
  insert into seed_helpers.seeded_order values (p_code, oid, p_org, p_student, p_status, p_placed);
  return oid;
end;
$$;

-- lines: [[product name, variant name, size, qty], …]
create function seed_helpers.seed_preorder(p_org text, p_student uuid, p_product text, p_variant text, p_size text, p_qty int, p_at timestamptz)
returns void language sql as $$
  insert into public."PreOrder" (variant_id, student_id, organization_id, quantity, created_at, updated_at)
  select v.variant_id, p_student, o.organization_id, p_qty, p_at, p_at
  from public."Product" p
  join public."Organization" o on o.organization_id = p.organization_id
  join public."ProductVariant" v on v.product_id = p.product_id
  where o.acronym = p_org and p.name = p_product and v.name = p_variant
    and v.size is not distinct from p_size::public.product_size;
$$;

create function seed_helpers.seed_cart_item(p_org text, p_student uuid, p_product text, p_variant text, p_size text, p_qty int)
returns void language plpgsql as $$
declare
  cart uuid;
  org uuid := (select organization_id from public."Organization" where acronym = p_org);
begin
  insert into public."OrderCart" (student_id, organization_id) values (p_student, org)
    on conflict (student_id, organization_id) do nothing;
  select order_cart_id into cart from public."OrderCart" where student_id = p_student and organization_id = org;
  insert into public."OrderCartItem" (order_cart_id, inventory_id, quantity)
  select cart, i.inventory_id, p_qty
  from public."Product" p
  join public."ProductVariant" v on v.product_id = p.product_id
  join public."Inventory" i on i.variant_id = v.variant_id
  where p.organization_id = org and p.name = p_product and v.name = coalesce(p_variant, 'Default')
    and v.size is not distinct from p_size::public.product_size;
end;
$$;

-- ── Catalog: LSCS ───────────────────────────────────────────────────────────────────────────
select seed_helpers.seed_product('LSCS', null, 'Shirts', 'LSCS Org Shirt', 350,
  'Official La Salle Computer Society shirt in soft cotton with the LSCS chest print.',
  array['images/tag_shirt.jpg', 'images/blue.jpg', 'images/green.jpg', 'images/yellow.jpg'],
  '[{"name":"Blue","image":"images/blue.jpg","sizes":["S","M","L","XL"],"stock":[6,14,12,5]},
    {"name":"Green","image":"images/green.jpg","sizes":["S","M","L","XL"],"stock":[4,10,9,3]},
    {"name":"Yellow","image":"images/yellow.jpg","sizes":["S","M","L","XL"],"stock":[3,8,0,2]}]',
  '2026-09-01 10:00+08');
select seed_helpers.seed_product('LSCS', 'fc5b9fde-0dee-4f40-a3a9-9f70274734c4', 'Bags', 'LSCS Canvas Tote', 500,
  'Heavy canvas tote with an inner pocket — fits a 15" laptop.',
  array['product-media/e00efae3-09f1-4c99-9793-796caff85d26/fc5b9fde-0dee-4f40-a3a9-9f70274734c4/675bdaca-d7bb-465f-95d5-b1c9fbd324dd'],
  '[{"stock":25}]', '2026-09-05 10:00+08');
select seed_helpers.seed_product('LSCS', '65c6ba3f-ba75-4f56-b21d-6617814042d6', 'Phone Accessories', 'LSCS Clear Phone Case', 150,
  'Shock-absorbing clear case with the LSCS logo printed on the back.',
  array['product-media/e00efae3-09f1-4c99-9793-796caff85d26/65c6ba3f-ba75-4f56-b21d-6617814042d6/3ef77cc9-de17-4245-a05d-59080b0ea5a6',
        'product-media/e00efae3-09f1-4c99-9793-796caff85d26/65c6ba3f-ba75-4f56-b21d-6617814042d6/aba7e155-c3ff-425a-9117-60afa3b2b098',
        'product-media/e00efae3-09f1-4c99-9793-796caff85d26/65c6ba3f-ba75-4f56-b21d-6617814042d6/c930a4f7-69b8-4c7a-b9c4-b0bcfef5e3a1'],
  '[{"name":"iPhone 13","stock":6},{"name":"iPhone 14","stock":8},{"name":"iPhone 15","stock":10},
    {"name":"iPhone 15 Pro","stock":4},{"name":"Galaxy S23","stock":5},{"name":"Galaxy S24","stock":0}]',
  '2026-09-08 10:00+08');
select seed_helpers.seed_product('LSCS', '06165948-7556-42e9-b2f6-bd1778e2ae78', 'ID Laces', 'LSCS Signature Lace', 140,
  'Woven ID lace with a metal clasp and safety breakaway.',
  array['product-media/e00efae3-09f1-4c99-9793-796caff85d26/06165948-7556-42e9-b2f6-bd1778e2ae78/b7a4b849-7fb6-403b-a8f1-800a902ade09'],
  '[{"stock":40}]', '2026-09-12 10:00+08',
  p_video => 'product-media/e00efae3-09f1-4c99-9793-796caff85d26/06165948-7556-42e9-b2f6-bd1778e2ae78/703d5466-6e71-4dfb-b962-c83f486caccb');
select seed_helpers.seed_product('LSCS', 'b4f79b34-119c-4409-9406-f074d410c683', 'Bookmarks', 'LSCS Cute Bookmarks', 20,
  'Laminated illustrated bookmarks — a set of cute CS-themed designs.',
  array['product-media/e00efae3-09f1-4c99-9793-796caff85d26/b4f79b34-119c-4409-9406-f074d410c683/5dab2a78-9d18-45ac-9e96-31f81fcb8fe0'],
  '[{"stock":120}]', '2026-09-15 10:00+08');
select seed_helpers.seed_product('LSCS', '1aa143da-cd06-4049-9bb8-540d8026390e', 'Phone Accessories', 'LSCS Phone Charm', 150,
  'Beaded phone charm strap with an acrylic LSCS charm.',
  array['product-media/e00efae3-09f1-4c99-9793-796caff85d26/1aa143da-cd06-4049-9bb8-540d8026390e/f081ab9c-6fa0-443f-ad50-aad4e56818f0'],
  '[{"name":"Star","stock":12},{"name":"Heart","stock":9},{"name":"Moon","stock":7}]', '2026-09-18 10:00+08');
select seed_helpers.seed_product('LSCS', null, 'ID Laces', 'LSCS ID Lace', 120,
  'Printed polyester ID lace in four LSCS designs.',
  array['images/tag_id_lace.jpg', 'images/lace1.jpg', 'images/lace2.jpg', 'images/lace3.jpg', 'images/lace4.jpg'],
  '[{"name":"Design 1","image":"images/lace1.jpg","stock":20},{"name":"Design 2","image":"images/lace2.jpg","stock":18},
    {"name":"Design 3","image":"images/lace3.jpg","stock":15},{"name":"Design 4","image":"images/lace4.jpg","stock":0}]',
  '2026-09-20 10:00+08');
select seed_helpers.seed_product('LSCS', null, 'Ballers', 'LSCS Baller', 60,
  'Silicone wristband debossed with the LSCS logo.', array['images/tag_baller.jpg'], '[{"stock":80}]', '2026-09-22 10:00+08');
select seed_helpers.seed_product('LSCS', null, 'Pins', 'LSCS Enamel Pin', 80,
  'Hard enamel pin for LSCS members, with rubber backing.', array['images/tag_enamel_pin.jpg'], '[{"stock":35}]',
  '2026-09-25 10:00+08', p_members_only => true);
select seed_helpers.seed_product('LSCS', null, 'Keychains', 'LSCS Keychain Bundle', 120,
  'Three acrylic keychains in one bundle.', array['images/tag_keychain_bundle.jpg'], '[{"stock":30}]', '2026-10-01 10:00+08');
select seed_helpers.seed_product('LSCS', null, 'Phone Accessories', 'LSCS Phone Grip', 90,
  'Collapsible phone grip and stand.', array['images/tag_phone_grip.jpg'], '[{"stock":20}]',
  '2026-10-03 10:00+08', p_active => false);
select seed_helpers.seed_product('LSCS', null, 'Shirts', 'LSCS Varsity Shirt', 450,
  'Pre-order: limited-run varsity shirt. Pickup starts January 2027.',
  array['images/tag_shirt.jpg', 'images/red.jpg', 'images/purple.jpg'],
  '[{"name":"Red","image":"images/red.jpg","sizes":["S","M","L","XL","2XL"]},
    {"name":"Purple","image":"images/purple.jpg","sizes":["S","M","L","XL","2XL"]}]',
  '2026-11-15 10:00+08', p_preorder => true);

-- ── Catalog: GGFM ───────────────────────────────────────────────────────────────────────────
select seed_helpers.seed_product('GGFM', null, 'Shirts', 'GGFM Station Shirt', 320,
  'Green Giant FM station shirt with the on-air logo.',
  array['images/tag_shirt.jpg', 'images/orange.jpg', 'images/red.jpg', 'images/yellow.jpg'],
  '[{"name":"Orange","image":"images/orange.jpg","sizes":["S","M","L","XL"],"stock":[5,11,9,4]},
    {"name":"Red","image":"images/red.jpg","sizes":["S","M","L","XL"],"stock":[3,7,7,2]},
    {"name":"Yellow","image":"images/yellow.jpg","sizes":["S","M","L","XL"],"stock":[2,6,5,0]}]',
  '2026-09-02 10:00+08');
select seed_helpers.seed_product('GGFM', null, 'ID Laces', 'GGFM ID Lace', 110,
  'Printed ID lace in four GGFM designs.',
  array['images/tag_id_lace.jpg', 'images/lace1.jpg', 'images/lace2.jpg', 'images/lace3.jpg', 'images/lace4.jpg'],
  '[{"name":"Design 1","image":"images/lace1.jpg","stock":15},{"name":"Design 2","image":"images/lace2.jpg","stock":12},
    {"name":"Design 3","image":"images/lace3.jpg","stock":10},{"name":"Design 4","image":"images/lace4.jpg","stock":6}]',
  '2026-09-06 10:00+08');
select seed_helpers.seed_product('GGFM', null, 'Bags', 'GGFM Tote Bag', 380,
  'Canvas tote with the GGFM wordmark.', array['images/tag_bag.jpg'], '[{"stock":20}]', '2026-09-10 10:00+08');
select seed_helpers.seed_product('GGFM', null, 'Ballers', 'GGFM Baller', 60,
  'Silicone wristband in GGFM green.', array['images/tag_baller.jpg'], '[{"stock":70}]', '2026-09-14 10:00+08');
select seed_helpers.seed_product('GGFM', null, 'Pins', 'GGFM Pin', 30,
  'Button pin with the GGFM mic logo.', array['images/tag_pin.jpg'], '[{"stock":100}]', '2026-09-16 10:00+08');
select seed_helpers.seed_product('GGFM', null, 'Keychains', 'GGFM Keychain', 50,
  'Acrylic keychain shaped like a radio dial.', array['images/tag_keychain.jpg'], '[{"stock":45}]', '2026-09-19 10:00+08');
select seed_helpers.seed_product('GGFM', null, 'Bracelets', 'GGFM Bracelet', 70,
  'Beaded bracelet spelling out GGFM.', array['images/tag_bracelet.jpg'], '[{"stock":40}]', '2026-09-23 10:00+08');
select seed_helpers.seed_product('GGFM', null, 'Magnets', 'GGFM Magnet Set', 90,
  'Set of four fridge magnets featuring GGFM shows.', array['images/tag_magnets.jpg'], '[{"stock":25}]', '2026-09-27 10:00+08');
select seed_helpers.seed_product('GGFM', null, 'Bookmarks', 'GGFM Bookmark', 25,
  'Glossy bookmark with a playlist on the back.', array['images/tag_bookmark.jpg'], '[{"stock":90}]', '2026-10-02 10:00+08');
select seed_helpers.seed_product('GGFM', null, 'Phone Accessories', 'GGFM Phone Charm', 120,
  'Phone charm strap with a mini cassette charm.', array['images/tag_phone_charm.jpg'], '[{"stock":18}]', '2026-10-06 10:00+08');
select seed_helpers.seed_product('GGFM', null, 'Pins', 'GGFM Members'' Enamel Pin', 85,
  'Hard enamel pin for GGFM members.', array['images/tag_enamel_pin.jpg'], '[{"stock":30}]',
  '2026-10-09 10:00+08', p_members_only => true);
select seed_helpers.seed_product('GGFM', null, 'Shirts', 'GGFM Anniversary Shirt', 400,
  'Pre-order: anniversary shirt. Pickup starts January 2027.',
  array['images/tag_shirt.jpg', 'images/green.jpg', 'images/purple.jpg'],
  '[{"name":"Green","image":"images/green.jpg","sizes":["S","M","L","XL"]},
    {"name":"Purple","image":"images/purple.jpg","sizes":["S","M","L","XL"]}]',
  '2026-11-16 10:00+08', p_preorder => true);

-- ── Catalog: DSS ────────────────────────────────────────────────────────────────────────────
select seed_helpers.seed_product('DSS', null, 'Shirts', 'DSS Org Shirt', 300,
  'Data Science Society shirt with a scatter-plot print.',
  array['images/tag_shirt.jpg', 'images/blue.jpg', 'images/purple.jpg', 'images/green.jpg'],
  '[{"name":"Blue","image":"images/blue.jpg","sizes":["S","M","L","XL","2XL"],"stock":[4,10,10,6,2]},
    {"name":"Purple","image":"images/purple.jpg","sizes":["S","M","L","XL","2XL"],"stock":[3,8,7,4,1]},
    {"name":"Green","image":"images/green.jpg","sizes":["S","M","L","XL","2XL"],"stock":[2,6,6,3,0]}]',
  '2026-09-03 10:00+08');
select seed_helpers.seed_product('DSS', null, 'ID Laces', 'DSS ID Lace', 120,
  'Printed ID lace in four DSS designs.',
  array['images/tag_id_lace.jpg', 'images/lace1.jpg', 'images/lace2.jpg', 'images/lace3.jpg', 'images/lace4.jpg'],
  '[{"name":"Design 1","image":"images/lace1.jpg","stock":14},{"name":"Design 2","image":"images/lace2.jpg","stock":14},
    {"name":"Design 3","image":"images/lace3.jpg","stock":9},{"name":"Design 4","image":"images/lace4.jpg","stock":11}]',
  '2026-09-07 10:00+08');
select seed_helpers.seed_product('DSS', null, 'Bags', 'DSS Tote Bag', 350,
  'Canvas tote with the DSS logo.', array['images/tag_bag.jpg'], '[{"stock":22}]', '2026-09-11 10:00+08');
select seed_helpers.seed_product('DSS', null, 'Keychains', 'DSS Keychain Bundle', 120,
  'Three data-themed acrylic keychains.', array['images/tag_keychain_bundle.jpg'], '[{"stock":26}]', '2026-09-13 10:00+08');
select seed_helpers.seed_product('DSS', null, 'Keychains', 'DSS Keychain', 50,
  'Acrylic keychain with the DSS logo.', array['images/tag_keychain.jpg'], '[{"stock":50}]', '2026-09-17 10:00+08');
select seed_helpers.seed_product('DSS', null, 'Pins', 'DSS Enamel Pin', 75,
  'Hard enamel pin shaped like a bar chart.', array['images/tag_enamel_pin.jpg'], '[{"stock":40}]', '2026-09-21 10:00+08');
select seed_helpers.seed_product('DSS', null, 'Phone Accessories', 'DSS Phone Case', 180,
  'Matte phone case with a DSS print.', array['images/tag_phone_case.jpg'],
  '[{"name":"iPhone 14","stock":7},{"name":"iPhone 15","stock":9},{"name":"Galaxy S24","stock":5}]', '2026-09-24 10:00+08');
select seed_helpers.seed_product('DSS', null, 'Phone Accessories', 'DSS Phone Grip', 90,
  'Collapsible phone grip and stand.', array['images/tag_phone_grip.jpg'], '[{"stock":24}]', '2026-09-28 10:00+08');
select seed_helpers.seed_product('DSS', null, 'Ballers', 'DSS Baller', 60,
  'Silicone wristband with the DSS tagline.', array['images/tag_baller.jpg'], '[{"stock":60}]', '2026-10-04 10:00+08');
select seed_helpers.seed_product('DSS', null, 'Magnets', 'DSS Magnet Set', 85,
  'Set of four magnets with famous plots.', array['images/tag_magnets.jpg'], '[{"stock":20}]', '2026-10-07 10:00+08');
select seed_helpers.seed_product('DSS', null, 'Bracelets', 'DSS Bracelet', 65,
  'Beaded bracelet in DSS colours.', array['images/tag_bracelet.jpg'], '[{"stock":30}]',
  '2026-10-10 10:00+08', p_active => false);
select seed_helpers.seed_product('DSS', null, 'Bookmarks', 'DSS Bookmark', 25,
  'Bookmark for DSS members with a pandas cheat sheet on the back.', array['images/tag_bookmark.jpg'], '[{"stock":60}]',
  '2026-10-12 10:00+08', p_members_only => true);
select seed_helpers.seed_product('DSS', null, 'Shirts', 'DSS Data Tee', 380,
  'Pre-order: limited data tee. Pickup starts January 2027.',
  array['images/tag_shirt.jpg', 'images/red.jpg', 'images/yellow.jpg'],
  '[{"name":"Red","image":"images/red.jpg","sizes":["S","M","L","XL"]},
    {"name":"Yellow","image":"images/yellow.jpg","sizes":["S","M","L","XL"]}]',
  '2026-11-17 10:00+08', p_preorder => true);

-- ── Orders (one org per order) ──────────────────────────────────────────────────────────────
-- Students: Yuan fee105f3…, Antonio 33187198…, TJ a5e91968…, Nigel df1dc7f3…, Test Tester a616a5ac…, John Thomas b34f61f1…
select seed_helpers.seed_order('L1', 'LSCS', 'fee105f3-4f67-4859-a665-8bee5b3b5e99', 'Claimed', '2026-10-05 13:20+08',
  '[["LSCS Org Shirt","Blue","M",1],["LSCS ID Lace","Design 2",null,1]]', 'GCash');
select seed_helpers.seed_order('L2', 'LSCS', '33187198-3116-469d-b406-1a245521b86b', 'Claimed', '2026-10-18 09:45+08',
  '[["LSCS Canvas Tote",null,null,1],["LSCS Cute Bookmarks",null,null,3]]', 'Cash');
select seed_helpers.seed_order('L3', 'LSCS', 'a5e91968-9b58-434f-b229-ed9e0fa91777', 'Claimed', '2026-11-03 15:10+08',
  '[["LSCS Clear Phone Case","iPhone 15",null,1],["LSCS Phone Charm","Star",null,1]]', 'Maya');
select seed_helpers.seed_order('L4', 'LSCS', 'fee105f3-4f67-4859-a665-8bee5b3b5e99', 'R4P', '2026-11-20 11:05+08',
  '[["LSCS Org Shirt","Green","L",2]]', 'GCash');
select seed_helpers.seed_order('L5', 'LSCS', 'df1dc7f3-721e-4b2e-9a76-81e35e8f250b', 'Unclaimed', '2026-11-08 16:30+08',
  '[["LSCS Baller",null,null,2],["LSCS Keychain Bundle",null,null,1]]', 'Cash');
select seed_helpers.seed_order('L6', 'LSCS', 'a616a5ac-5911-49dd-95fe-f2aaceb94667', 'Processing', '2026-11-26 10:15+08',
  '[["LSCS Signature Lace",null,null,1]]', 'GCash');
select seed_helpers.seed_order('L7', 'LSCS', '33187198-3116-469d-b406-1a245521b86b', 'Processing', '2026-11-27 14:40+08',
  '[["LSCS Enamel Pin",null,null,2]]', null);

select seed_helpers.seed_order('G1', 'GGFM', 'fee105f3-4f67-4859-a665-8bee5b3b5e99', 'Claimed', '2026-09-22 12:00+08',
  '[["GGFM Station Shirt","Orange","M",1],["GGFM Pin",null,null,2]]', 'GCash');
select seed_helpers.seed_order('G2', 'GGFM', 'a5e91968-9b58-434f-b229-ed9e0fa91777', 'Claimed', '2026-10-30 17:25+08',
  '[["GGFM Tote Bag",null,null,1]]', 'Maya');
select seed_helpers.seed_order('G3', 'GGFM', 'b34f61f1-c13d-46f1-8ba4-0e8b37029a93', 'R4P', '2026-11-18 09:30+08',
  '[["GGFM Bracelet",null,null,2],["GGFM Magnet Set",null,null,1]]', 'Cash');
select seed_helpers.seed_order('G4', 'GGFM', 'a616a5ac-5911-49dd-95fe-f2aaceb94667', 'Processing', '2026-11-25 13:50+08',
  '[["GGFM ID Lace","Design 3",null,1]]', null);
select seed_helpers.seed_order('G5', 'GGFM', 'df1dc7f3-721e-4b2e-9a76-81e35e8f250b', 'Unclaimed', '2026-11-02 10:40+08',
  '[["GGFM Phone Charm",null,null,1]]', 'GCash');

select seed_helpers.seed_order('D1', 'DSS', '33187198-3116-469d-b406-1a245521b86b', 'Claimed', '2026-10-12 11:15+08',
  '[["DSS Org Shirt","Purple","L",1],["DSS Keychain",null,null,2]]', 'GCash');
select seed_helpers.seed_order('D2', 'DSS', 'fee105f3-4f67-4859-a665-8bee5b3b5e99', 'Claimed', '2026-11-06 14:05+08',
  '[["DSS Phone Case","iPhone 15",null,1]]', 'Maya');
select seed_helpers.seed_order('D3', 'DSS', 'a5e91968-9b58-434f-b229-ed9e0fa91777', 'R4P', '2026-11-21 08:55+08',
  '[["DSS ID Lace","Design 1",null,1],["DSS Enamel Pin",null,null,1]]', 'Cash');
select seed_helpers.seed_order('D4', 'DSS', 'df1dc7f3-721e-4b2e-9a76-81e35e8f250b', 'Processing', '2026-11-27 16:20+08',
  '[["DSS Tote Bag",null,null,1],["DSS Baller",null,null,1]]', 'GCash');
select seed_helpers.seed_order('D5', 'DSS', 'a616a5ac-5911-49dd-95fe-f2aaceb94667', 'Unclaimed', '2026-11-04 12:35+08',
  '[["DSS Magnet Set",null,null,2]]', 'Cash');

-- ── Ratings (claimed orders) ────────────────────────────────────────────────────────────────
with r as (
  insert into public."Rating" (student_id, order_id, rating, comment, created_at)
  select o.student_id, o.order_id, x.rating, x.comment, o.placed_at + interval '5 days'
  from seed_helpers.seeded_order o
  join (values
    ('L1', 5, 'Shirt fits true to size and the print is crisp. Lace is sturdy too.'),
    ('L2', 4, 'Tote is roomy and well made. Bookmarks are adorable.'),
    ('L3', 5, 'Case fits my iPhone 15 perfectly, and the charm is cute.'),
    ('G1', 4, 'Comfy shirt, colour is a bit lighter than the photo.'),
    ('G2', 5, 'Love the tote!'),
    ('D1', 4, 'Nice shirt. Keychains feel a little thin but still great.'),
    ('D2', 3, 'Case is okay — took a while to be ready for pickup.')
  ) as x(code, rating, comment) on x.code = o.code
  returning rating_id, order_id
)
insert into public."RatingImage" (rating_id, image_url)
select r.rating_id, img.url
from r
join seed_helpers.seeded_order o on o.order_id = r.order_id
join (values ('L1', 'images/blue.jpg'), ('D1', 'images/purple.jpg'), ('G2', 'images/tag_bag.jpg')) as img(code, url)
  on img.code = o.code;

-- ── Pre-orders ──────────────────────────────────────────────────────────────────────────────
select seed_helpers.seed_preorder('LSCS', 'a5e91968-9b58-434f-b229-ed9e0fa91777', 'LSCS Varsity Shirt', 'Red', 'M', 1, '2026-11-18 10:00+08');
select seed_helpers.seed_preorder('LSCS', '33187198-3116-469d-b406-1a245521b86b', 'LSCS Varsity Shirt', 'Purple', 'L', 2, '2026-11-19 15:00+08');
select seed_helpers.seed_preorder('GGFM', 'fee105f3-4f67-4859-a665-8bee5b3b5e99', 'GGFM Anniversary Shirt', 'Green', 'L', 1, '2026-11-20 09:00+08');
select seed_helpers.seed_preorder('GGFM', 'a616a5ac-5911-49dd-95fe-f2aaceb94667', 'GGFM Anniversary Shirt', 'Purple', 'S', 1, '2026-11-21 13:00+08');
select seed_helpers.seed_preorder('DSS', 'fee105f3-4f67-4859-a665-8bee5b3b5e99', 'DSS Data Tee', 'Red', 'M', 1, '2026-11-22 11:00+08');
select seed_helpers.seed_preorder('DSS', 'df1dc7f3-721e-4b2e-9a76-81e35e8f250b', 'DSS Data Tee', 'Yellow', 'XL', 1, '2026-11-23 17:00+08');

-- ── Carts ───────────────────────────────────────────────────────────────────────────────────
select seed_helpers.seed_cart_item('LSCS', 'fee105f3-4f67-4859-a665-8bee5b3b5e99', 'LSCS Org Shirt', 'Yellow', 'S', 1);
select seed_helpers.seed_cart_item('LSCS', 'fee105f3-4f67-4859-a665-8bee5b3b5e99', 'LSCS Keychain Bundle', null, null, 1);
select seed_helpers.seed_cart_item('DSS', 'a5e91968-9b58-434f-b229-ed9e0fa91777', 'DSS Keychain Bundle', null, null, 2);
select seed_helpers.seed_cart_item('GGFM', 'a616a5ac-5911-49dd-95fe-f2aaceb94667', 'GGFM Baller', null, null, 3);
select seed_helpers.seed_cart_item('GGFM', 'a616a5ac-5911-49dd-95fe-f2aaceb94667', 'GGFM Bookmark', null, null, 1);

-- ── Notifications ───────────────────────────────────────────────────────────────────────────
insert into public."Notification" (sender_org_id, recipient_student_id, title, body, notification_type, created_at, read_at)
select org.organization_id, o.student_id,
  case o.status when 'R4P' then 'Your order is ready for pickup'
                when 'Claimed' then 'Order claimed'
                else 'Your order is still waiting for pickup' end,
  case o.status when 'R4P' then 'Your ' || org.acronym || ' order is ready. Bring your DLSU ID when you claim it.'
                when 'Claimed' then 'Thanks for claiming your ' || org.acronym || ' order! Leave a rating when you can.'
                else 'Your ' || org.acronym || ' order hasn''t been claimed yet. Please pick it up soon.' end,
  'ORDER_UPDATE',
  o.placed_at + case o.status when 'Claimed' then interval '3 days' when 'R4P' then interval '1 day' else interval '7 days' end,
  case when o.status = 'Claimed' then o.placed_at + interval '4 days' end
from seed_helpers.seeded_order o
join public."Organization" org on org.acronym = o.org
where o.status in ('R4P', 'Claimed', 'Unclaimed');

insert into public."Notification" (sender_org_id, recipient_student_id, title, body, notification_type, created_at)
select r.organization_id, r.student_id,
  p.name || ' pre-orders are open',
  'Pre-orders for ' || p.name || ' run until ' || to_char(p.preorder_end_date, 'Mon DD') || '. Pickup starts January 2027.',
  'PREORDER_BROADCAST', p.created_at + interval '1 hour'
from public."PreOrder" r
join public."ProductVariant" v on v.variant_id = r.variant_id
join public."Product" p on p.product_id = v.product_id;

drop schema seed_helpers cascade;
