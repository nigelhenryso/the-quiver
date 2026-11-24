-- Read catalog metadata for the signed-in organization's products.
drop policy if exists "Organizations read own product tags" on public."ProductTag";
create policy "Organizations read own product tags" on public."ProductTag"
  for select to authenticated
  using (product_id in (
    select p.product_id
    from public."Product" p
    where p.organization_id = (select auth.uid())
  ));

drop policy if exists "Organizations read tags on own products" on public."Tag";
drop policy if exists "Organizations read tag catalog" on public."Tag";
create policy "Organizations read tag catalog" on public."Tag"
  for select to authenticated
  using (exists (
    select 1
    from public."Organization" o
    where o.organization_id = (select auth.uid())
  ));

drop policy if exists "Organizations read own combinations" on public."ProductVariantCombination";
create policy "Organizations read own combinations" on public."ProductVariantCombination"
  for select to authenticated
  using (product_id in (
    select p.product_id
    from public."Product" p
    where p.organization_id = (select auth.uid())
  ));

drop policy if exists "Organizations read own combination options" on public."CombinationOption";
create policy "Organizations read own combination options" on public."CombinationOption"
  for select to authenticated
  using (exists (
    select 1
    from public."ProductVariantCombination" c
    join public."Product" p on p.product_id = c.product_id
    where c.combination_id = "CombinationOption".combination_id
      and p.organization_id = (select auth.uid())
  ));
