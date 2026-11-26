import Link from "next/link";
import { ProductCardStar } from "@/src/components/ui/logos";
import type { HomeProduct } from "@/src/types/StudentDashboard";
import { productCardClass, productImageClass } from "./carouselStyles";

export default function HomeProductCard({ product }: { product: HomeProduct }) {
  return (
    <Link
      href={`/products/${encodeURIComponent(product.id)}`}
      className={`${productCardClass} font-body text-[#506552] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244432]`}
    >
      {product.imgDir ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.imgDir} alt="" loading="lazy" decoding="async" className={productImageClass} />
      ) : (
        <div aria-hidden="true" className={productImageClass} />
      )}

      <div className="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[10px]">
        {product.rating !== undefined && (
          <span className="flex shrink-0 items-center gap-0.5">
            <ProductCardStar aria-hidden="true" width={10} height={10} color="#00B775" />
            <span>{product.rating.toFixed(1)} ({product.reviewCount})</span>
          </span>
        )}
        <span className="ml-auto min-w-0 max-w-full text-right italic [overflow-wrap:anywhere]">
          {product.orgName}
        </span>
      </div>

      <h4 className="mt-1.5 truncate text-center text-sm font-bold">
        {product.productName}
      </h4>
      <p className="mt-0.5 text-center text-xs">₱{product.price.toFixed(2)}</p>
    </Link>
  );
}
