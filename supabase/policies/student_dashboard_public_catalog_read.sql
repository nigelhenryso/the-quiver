-- Allow signed-in students to browse published, non-exclusive merchandise.
-- Keep the existing pre-order policy names while extending them to the public catalog.
-- Membership policies continue to govern exclusive products.
alter policy "Students read open non-exclusive pre-orders"
  on public."Product" to authenticated
  using (
    is_active is true
    and is_member_exclusive is false
    and exists (
      select 1 from public."Student" student where student.student_id = (select auth.uid())
    )
  );

alter policy "Students read variant images for non-exclusive pre-orders"
  on public."ProductVariantCombination" to authenticated
  using (
    nullif(image_url, '') is not null
    and exists (
      select 1 from public."Student" student where student.student_id = (select auth.uid())
    )
    and exists (
      select 1 from public."Product" product
      where product.product_id = "ProductVariantCombination".product_id
        and product.is_active is true
        and product.is_member_exclusive is false
    )
  );

alter policy "Students read media for open non-exclusive pre-orders"
  on storage.objects to authenticated
  using (
    bucket_id = 'product-media'
    and exists (
      select 1 from public."Student" student where student.student_id = (select auth.uid())
    )
    and exists (
      select 1 from public."Product" product
      where split_part(objects.name, '/', 1) = product.organization_id::text
        and product.is_active is true
        and product.is_member_exclusive is false
        and (
          exists (
            select 1 from public."ProductImage" image
            where image.product_id = product.product_id
              and image.image_url = 'product-media/' || objects.name
          )
          or exists (
            select 1 from public."ProductVariantCombination" variant
            where variant.product_id = product.product_id
              and variant.image_url = 'product-media/' || objects.name
          )
        )
    )
  );
