-- Sellers can change publication status on products they own.
revoke update on table public."Product" from authenticated;
grant update (is_active) on table public."Product" to authenticated;

drop policy if exists "Organizations update own product publication status" on public."Product";
create policy "Organizations update own product publication status" on public."Product"
  for update to authenticated
  using (organization_id = (select auth.uid()))
  with check (organization_id = (select auth.uid()));
