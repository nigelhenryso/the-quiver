'use client';

import { useState } from 'react';
import { ProductCard } from './ProductCard';

export interface Product {
  id: number | string;
  productName: string;
  orgName: string;
  starCount: number;
  price: number;
  imgDir: string;
}

interface ProductCardSliderProps {
  products?: Product[];
}

const sampleProducts: Product[] = [
  { id: 1, productName: 'ID Lace', orgName: 'LSCS', starCount: 5, price: 299, imgDir:'/images/product-card-1.jpg' },
  { id: 2, productName: 'Jacket', orgName: 'ENGLICOM', starCount: 5, price: 499, imgDir:'/images/product-card-2.jpg' },
  { id: 3, productName: 'Shirt', orgName: 'LSS', starCount: 5, price: 199, imgDir:'/images/product-card-3.jpg' },
  { id: 4, productName: 'Pin', orgName: 'DSS', starCount: 4, price: 350, imgDir:'/images/product-card-4.jpg' },
  { id: 5, productName: 'Cap', orgName: 'ISO', starCount: 5, price: 250, imgDir:'/images/product-card-5.jpg' },
  { id: 6, productName: 'Stickers', orgName: 'Mafia', starCount: 3, price: 150, imgDir:'/images/product-card-6.jpg' },
  { id: 7, productName: 'Jacket', orgName: 'LSCS', starCount: 5, price: 400, imgDir:'/images/product-card-7.jpg' },
  { id: 8, productName: 'Baller', orgName: 'CHEN', starCount: 4, price: 275, imgDir:'/images/product-card-8.jpg' },
  { id: 9, productName: 'Jacket', orgName: 'ENGLICOM', starCount: 5, price: 325, imgDir:'/images/product-card-9.jpg' },
];

export const ProductCardSlider = ({
  products = sampleProducts,
}: ProductCardSliderProps) => {
  const [currentPage, setCurrentPage] = useState(0);

  const productsPerPage = 3;
  const pageCount = Math.ceil(products.length / productsPerPage);

  const pages = Array.from({ length: pageCount }, (_, index) =>
    products.slice(
      index * productsPerPage,
      (index + 1) * productsPerPage,
    ),
  );

  const nextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, pageCount - 1));
  };

  const previousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 0));
  };

  if (pageCount === 0) {
    return null;
  }

  return (
    <section className="w-full py-8">
      <div className="relative mx-auto w-full max-w-[900px]">
        <button type="button"
          onClick={previousPage}
          disabled={currentPage === 0}
          aria-label="Previous products"
          className="absolute left-0 top-1/2 z-10 flex h-[24px] w-[24px] -translate-y-1/2 items-center justify-center rounded-full bg-[#244A36] text-white shadow-md transition hover:bg-[#3C7657] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 4L7 12L15 20"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Product slider viewport */}
        <div className="w-full h-full overflow-hidden py-4 px-4">
          {/* Sliding track */}
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentPage * 100}%)`,
            }}
          >
            {pages.map((page, pageIndex) => (
              <div
                key={pageIndex}
                className="grid w-full min-w-0 flex-[0_0_100%] grid-cols-1 justify-items-center justify-around sm:grid-cols-2 lg:grid-cols-3"
              >
                {page.map((product) => (
                  <ProductCard
                    key={product.id}
                    productName={product.productName}
                    orgName={product.orgName}
                    starCount={product.starCount}
                    price={product.price}
                    imgDir={product.imgDir}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Next button */}
        <button
          type="button"
          onClick={nextPage}
          disabled={currentPage >= pageCount - 1}
          aria-label="Next products"
          className="absolute right-0 top-1/2 z-10 flex h-[24px] w-[24px] -translate-y-1/2 items-center justify-center rounded-full bg-[#244A36] text-white shadow-md transition hover:bg-[#3C7657] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9 4L17 12L9 20"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </section>
  );
};