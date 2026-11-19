import Link from "next/link";
import { ORG_LINKS } from "@/src/lib/routes";
import { formatPesoDecimals, timeAgo } from "@/src/lib/utils";
import type { RecentOrder } from "@/src/types/Dashboard";
import type { OrderStatus } from "@/src/types/enums";

const STATUS_LABEL: Record<OrderStatus, string> = {
  Pending: "Pending",
  R4P: "Ready for Pickup",
  Claimed: "Claimed",
};

// one order row inside Recent Orders; clicking it opens the order on the Orders page
export default function RecentOrderCard({ order }: { order: RecentOrder }) {
  const shortId = order.orderId.slice(0, 8).toUpperCase();

  return (
    <Link
      href={ORG_LINKS.order(order.orderId)}
      aria-label={`View order #${shortId}`}
      className="flex flex-col gap-3 rounded-[6px] border border-[#2F8F6B]/40 bg-[#F3FFF6] p-3 shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-all duration-200 ease-in-out hover:scale-[1.01] hover:border-[#004D31] hover:shadow-lg sm:flex-row sm:gap-5"
    >
      {/* product image, green box as placeholder */}
      {order.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={order.imageUrl}
          alt={order.productName}
          className="h-[100px] w-full rounded-[6px] object-cover sm:w-[140px] sm:shrink-0"
        />
      ) : (
        <div className="h-[100px] w-full rounded-[6px] bg-[#B9D9A6] sm:w-[140px] sm:shrink-0" />
      )}

      <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row">
        {/* left: order id, customer, item, payment */}
        <div className="flex flex-col gap-[3px] pt-1">
          <div className="flex items-baseline gap-3">
            <p className="font-body text-[14px] font-bold text-[#1E3A2C]">Order ID #{shortId}</p>
            <time dateTime={order.placedAt} className="font-body text-[10px] text-[#9AA59E]">
              {timeAgo(order.placedAt)}
            </time>
          </div>
          <p className="font-body text-[11px] font-bold text-[#1E3A2C]">
            {order.customerName ?? "Customer"}
          </p>
          <p className="font-body text-[10px] text-[#1E3A2C]">
            {order.productName}
            {order.variantLabel && ` - ${order.variantLabel}`} - {order.quantity}x
          </p>
          <p className="font-body text-[10px] text-[#9AA59E]">
            Mode of Payment:{" "}
            <span className="text-[#1E3A2C]">{order.paymentModeName ?? "Not yet paid"}</span>
          </p>
        </div>

        {/* right: status on top, total at the bottom */}
        <div className="flex items-end justify-between sm:flex-col sm:items-end">
          <span className="font-body rounded-[6px] border border-[#BFE3C9] bg-[#E3F5EA] px-3 py-1 text-[11px] text-[#2F4531]">
            {order.status ? STATUS_LABEL[order.status] : "No status"}
          </span>
          <p className="font-heading text-[16px] text-[#199E72]">
            Total amount: {formatPesoDecimals(order.total)}
          </p>
        </div>
      </div>
    </Link>
  );
}
