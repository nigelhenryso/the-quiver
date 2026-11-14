import { ProductCardStar } from "@/src/components/ui/logos";
import type { HomeProduct } from "@/src/app/(student)/landing/data";

// product card used in the student home page (rating + review count style)
export default function HomeProductCard({ product }: { product: HomeProduct }) {
  return (
    <div className="flex w-full flex-col gap-[3px] overflow-hidden rounded-[10px] border-[0.5px] border-[#2F4531]/60 bg-[#F5FEF2] p-2 shadow-[1px_2px_5px_rgba(0,0,0,0.25)] transition-all duration-200 ease-in-out hover:scale-105 hover:border-[#004D31] hover:shadow-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.imgDir}
        alt={product.productName}
        className="aspect-square w-full rounded-[8px] bg-[#BADBA6] object-cover"
      />

      <div className="mt-1 flex w-full flex-row items-center justify-between px-0.5">
        <div className="flex flex-row items-center gap-[3px]">
          <ProductCardStar width={11} height={11} color="#00B775" />
          <span className={`$font-body text-[10px] leading-none text-[#2F4531]`}>
            {product.rating.toFixed(1)} ({product.reviewCount})
          </span>
        </div>
        <p className={`$font-body text-[10px] italic leading-none text-[#2F4531]`}>
          {product.orgName}
        </p>
      </div>

      <h3
        className={`$font-body mt-1 truncate text-center text-[14px] font-bold text-[#2F4531]`}
      >
        {product.productName}
      </h3>
      <p className={`$font-body text-center text-[12px] text-[#2F4531]`}>
        ₱{product.price.toFixed(2)}
      </p>
    </div>
  );
}