import { formatPesoDecimals, type Order } from "./data";

type RecentOrdersProps = {
  orders: Order[];
};

export default function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <section className="rounded-[10px] border border-[#C9D6CE] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.25)] sm:px-7 sm:py-6">
      <h2 className={`font-heading text-[24px] text-[#2F4531]`}>Recent Orders</h2>

      {/* if there are no orders show a message instead */}
      {orders.length === 0 && (
        <p className={`font-body py-8 text-center text-[13px] text-[#7C8A82]`}>
          No orders yet.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-6">
        {orders.map((order) => (
          <article
            key={order.id}
            className="flex flex-col gap-3 rounded-[6px] border border-[#2F8F6B]/40 bg-[#F3FFF6] p-3 shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-all duration-200 ease-in-out hover:scale-[1.01] hover:border-[#004D31] hover:shadow-lg sm:flex-row sm:gap-5"
          >
            {/* green box = placeholder for the product image */}
            <div className="h-[100px] w-full rounded-[6px] bg-[#B9D9A6] sm:w-[140px] sm:shrink-0" />

            <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row">
              {/* left side: product + customer info */}
              <div className="flex flex-col gap-[3px] pt-1">
                <div className="flex items-baseline gap-3">
                  <p className={`$font-body text-[14px] font-bold text-[#1E3A2C]`}>
                    {order.productName}
                  </p>
                  <span className={`$font-body text-[10px] text-[#9AA59E]`}>
                    {order.timeAgo}
                  </span>
                </div>
                <p className={`$font-body text-[11px] text-[#1E3A2C]`}>
                  {order.customerName}
                </p>
                {order.variant !== "" && (
                  <p className={`$font-body text-[10px] text-[#9AA59E]`}>
                    Variant: <span className="text-[#1E3A2C]">{order.variant}</span>
                  </p>
                )}
                <p className={`$font-body text-[10px] text-[#9AA59E]`}>
                  Quantity: <span className="text-[#1E3A2C]">{order.quantity}</span>
                </p>
              </div>

              {/* right side: status on top, total at the bottom */}
              <div className="flex items-end justify-between sm:flex-col sm:items-end">
                <span
                  className={`$font-body rounded-[6px] border border-[#BFE3C9] bg-[#E3F5EA] px-3 py-1 text-[11px] text-[#2F4531]`}
                >
                  {order.status}
                </span>
                <p className={`$font-heading text-[16px] text-[#199E72]`}>
                  Total amount: {formatPesoDecimals(order.total)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}