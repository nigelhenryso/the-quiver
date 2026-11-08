// Figma Page: Student - Product Details Page

import { Suspense } from 'react';

async function Product({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return <div>Product {productId}</div>;
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Product params={params} />
    </Suspense>
  );
}