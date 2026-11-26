-- StudentAffiliation already restricts reads to the signed-in student's rows.
create policy "Students read active products from joined organizations"
  on public."Product" for select to authenticated
  using (
    is_active is true
    and organization_id in (
      select affiliation.organization_id
      from public."StudentAffiliation" affiliation
      where affiliation.student_id = (select auth.uid())
    )
  );

create policy "Students read images of active products from joined organizations"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'product-media'
    and exists (
      select 1
      from public."ProductImage" image
      join public."Product" product on product.product_id = image.product_id
      join public."StudentAffiliation" affiliation
        on affiliation.organization_id = product.organization_id
      where image.image_url = 'product-media/' || objects.name
        and split_part(objects.name, '/', 1) = product.organization_id::text
        and product.is_active is true
        and affiliation.student_id = (select auth.uid())
    )
  );
