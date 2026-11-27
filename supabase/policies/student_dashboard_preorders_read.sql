-- Open, non-exclusive pre-orders are available to any signed-in student.
create policy "Students read open non-exclusive pre-orders"
  on public."Product" for select to authenticated
  using (
    is_active is true
    and is_member_exclusive is false
    and (now() at time zone 'Asia/Manila')::date between preorder_start_date and preorder_end_date
    and exists (
      select 1 from public."Student" student where student.student_id = (select auth.uid())
    )
  );

create policy "Students read variant images for non-exclusive pre-orders"
  on public."ProductVariantCombination" for select to authenticated
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
        and (now() at time zone 'Asia/Manila')::date
          between product.preorder_start_date and product.preorder_end_date
    )
  );

create policy "Students read media for open non-exclusive pre-orders"
  on storage.objects for select to authenticated
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
        and (now() at time zone 'Asia/Manila')::date
          between product.preorder_start_date and product.preorder_end_date
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
