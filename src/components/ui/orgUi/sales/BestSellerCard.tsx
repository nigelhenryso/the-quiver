import Link from "next/link";
import { Star } from "lucide-react";
import type { ProductSales } from "@/src/lib/sales";
import Peso from "./Peso";

export default function BestSellerCard({ product, totalRevenue }: { product: ProductSales | null; totalRevenue: number }) {
  return (
    <section className="rounded-[10px] border border-[#DCE6E0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between">
        <h2 className="font-body text-[11px] text-[#4A5A51]">Best Selling Product</h2>
        {product && (
          <span className="font-body inline-flex items-center gap-1 rounded-[6px] border border-[#BFE3C9] bg-[#E8F7EE] px-2 py-[2px] text-[10px] font-bold text-[#2F4531]">
            <Star size={10} fill="currentColor" aria-hidden /> Top Seller
          </span>
        )}
      </div>

      {!product ? (
        <p className="font-body py-8 text-center text-[12px] text-[#8C9A92]">No claimed sales in this period.</p>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt={product.name} className="h-[52px] w-[52px] rounded-[6px] object-cover" />
            ) : (
              <div className="h-[52px] w-[52px] rounded-[6px] bg-[#008A58]" aria-hidden />
            )}
            <div className="min-w-0">
              <p className="font-heading truncate text-[17px] text-[#1E3A2C]">{product.name}</p>
              <p className="font-body text-[10px] text-[#5E7A6A]">
                Product ID: {product.productId.slice(-6).toUpperCase()} • {product.category}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-[#E3EBE6] pt-3">
            <div className="flex items-start justify-between">
              <Peso amount={product.revenue} className="font-heading text-[22px] text-[#1E3A2C]" />
              <span className="font-body rounded-[6px] border border-[#BFE3C9] bg-[#E8F7EE] px-2 py-[2px] text-[10px] font-bold text-[#2F4531]">
                {product.units} unit{product.units === 1 ? "" : "s"} sold
              </span>
            </div>
            <p className="font-body mt-1 text-[10px] text-[#8C9A92]">
              {totalRevenue > 0 ? Math.round((product.revenue / totalRevenue) * 100) : 0}% of total merchant revenue
            </p>
          </div>
        </>
      )}

      <div className="mt-5 text-right">
        <Link href="/inventory" className="font-body text-[11px] font-bold text-[#008A58] hover:underline">
          View Inventory →
        </Link>
      </div>
    </section>
  );
}
