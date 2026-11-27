create policy "Students read variants with images from joined organizations"
  on public."ProductVariantCombination" for select to authenticated
  using (
    nullif(image_url, '') is not null
    and exists (
      select 1
      from public."Product" product
      join public."StudentAffiliation" affiliation
        on affiliation.organization_id = product.organization_id
      where product.product_id = "ProductVariantCombination".product_id
        and product.is_active is true
        and affiliation.student_id = (select auth.uid())
    )
  );

create policy "Students read variant media from joined organizations"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'product-media'
    and exists (
      select 1
      from public."ProductVariantCombination" variant
      join public."Product" product on product.product_id = variant.product_id
      join public."StudentAffiliation" affiliation
        on affiliation.organization_id = product.organization_id
      where variant.image_url = 'product-media/' || objects.name
        and split_part(objects.name, '/', 1) = product.organization_id::text
        and product.is_active is true
        and affiliation.student_id = (select auth.uid())
    )
  );
