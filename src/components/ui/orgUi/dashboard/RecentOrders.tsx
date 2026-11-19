import Link from "next/link";
import RecentOrderCard from "./RecentOrderCard";
import { ORG_LINKS } from "@/src/lib/routes";
import type { RecentOrder } from "@/src/types/Dashboard";

type RecentOrdersProps = {
  orders: RecentOrder[];
};

// the "Recent Orders" panel, list of RecentOrderCard
export default function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <section className="rounded-[10px] border border-[#C9D6CE] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.25)] sm:px-7 sm:py-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-[24px] text-[#2F4531]">Recent Orders</h2>
        <Link href={ORG_LINKS.orders()} className="font-body text-[11px] text-[#008A58] hover:underline">
          View all orders →
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="font-body py-8 text-center text-[13px] text-[#7C8A82]">No orders yet.</p>
      ) : (
        <div className="mt-5 flex flex-col gap-6">
          {orders.map((order) => (
            <RecentOrderCard key={order.orderId} order={order} />
          ))}
        </div>
      )}
    </section>
  );
}
