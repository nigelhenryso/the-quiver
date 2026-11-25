import Link from "next/link";
import { formatPeso, timeAgo } from "@/src/lib/utils";
import type { RecentOrder } from "@/src/types/Dashboard";
import type { OrderStatus } from "@/src/types/enums";

const STATUS_LABEL: Record<OrderStatus, string> = {
  Pending: "Pending",
  R4P: "Ready for Pickup",
  Claimed: "Claimed",
};

// one order row inside Recent Orders
export default function RecentOrderCard({ order }: { order: RecentOrder }) {
  const shortId = order.orderId.slice(-8).toUpperCase();

  return (
    <Link
      href="/orgOrders"
      aria-label={`View order #${shortId}`}
      className="flex flex-col gap-3 rounded-[6px] border border-[#2F8F6B]/40 bg-[#F3FFF6] p-3 shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-all duration-200 ease-in-out hover:scale-[1.01] hover:border-[#004D31] hover:shadow-lg sm:flex-row sm:gap-5"
    >
      <OrderThumbnail images={order.images} alt={order.items[0] ?? "Order item"} />

      <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row">
      {/* left: order id, customer, item, payment */}
      <div className="flex flex-col gap-[3px] pt-1">
        <div className="flex items-baseline gap-3">
          <p className="font-body text-[14px] font-bold text-[#1E3A2C]">Order ID #{shortId}</p>
          <time dateTime={order.placedAt} className="font-body text-[10px] text-[#9AA59E]">
            {timeAgo(order.placedAt)}
          </time>
        </div>
        <p className="font-body text-[11px] font-bold text-[#1E3A2C]">{order.customerName}</p>
        {order.items.length === 0 ? (
          <p className="font-body text-[10px] text-[#9AA59E]">No items</p>
        ) : (
          <ul className="font-body my-1 flex flex-col gap-[2px] pl-[2px] text-[10px] text-[#004D31]">
            {order.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}
        <p className="font-body text-[10px] text-[#9AA59E]">
          Mode of Payment: <span className="text-[#1E3A2C]">{order.paymentMode ?? "Not yet paid"}</span>
        </p>
      </div>

      {/* right: status on top, total at the bottom */}
      <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-end">
        <span className="font-body rounded-[6px] border border-[#BFE3C9] bg-[#E3F5EA] px-3 py-1 text-[11px] text-[#2F4531]">
          {order.status ? STATUS_LABEL[order.status] : "No status"}
        </span>
        <p className="font-heading text-[16px] text-[#199E72]">Total amount: {formatPeso(order.total, true)}</p>
      </div>
      </div>
    </Link>
  );
}

const THUMB_BOX = "h-[100px] w-full shrink-0 sm:self-center overflow-hidden rounded-[6px] bg-[#B9D9A6] sm:w-[120px]";

// 4+ items -> first 4 images in a 2x2 grid; 1-3 items -> first item's image; no image -> green placeholder
function OrderThumbnail({ images, alt }: { images: (string | null)[]; alt: string }) {
  if (images.length >= 4) {
    return (
      <div className={`${THUMB_BOX} grid grid-cols-2 grid-rows-2 gap-[2px]`}>
        {images.slice(0, 4).map((src, i) =>
          src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt={i === 0 ? alt : ""} className="h-full w-full object-cover" />
          ) : (
            <div key={i} className="h-full w-full bg-[#B9D9A6]" />
          ),
        )}
      </div>
    );
  }

  const first = images[0];
  if (first) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={first} alt={alt} className={`${THUMB_BOX} object-cover`} />;
  }
  return <div className={THUMB_BOX} />;
}
