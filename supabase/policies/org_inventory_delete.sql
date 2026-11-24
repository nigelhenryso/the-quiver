-- Product deletion removes catalog image references, while orders and preorders protect inventory.
alter table public."ProductImage"
  drop constraint "ProductImage_product_id_fkey",
  add constraint "ProductImage_product_id_fkey"
    foreign key (product_id) references public."Product" (product_id) on delete cascade;

alter table public."PreOrder"
  drop constraint "PreOrder_inventory_id_fkey",
  add constraint "PreOrder_inventory_id_fkey"
    foreign key (inventory_id) references public."Inventory" (inventory_id) on delete restrict;

grant delete on table public."Product" to authenticated;

drop policy if exists "Organizations delete own products" on public."Product";
create policy "Organizations delete own products" on public."Product"
  for delete to authenticated
  using (organization_id = (select auth.uid()));
