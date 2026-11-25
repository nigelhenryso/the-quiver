
import { BankNote } from "../../logos";
import { Badge } from "../dashboard/StatCard";
import Peso from "./Peso";

export default function TotalSalesCard({ revenue, units, rangeLabel }: { revenue: number; units: number; rangeLabel: string }) {
  return (
    <section className="rounded-[10px] border border-[#DCE6E0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between">
        <Badge>Live Net Revenue</Badge>
        <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#E8F7EE] text-[#008A58]">
          <BankNote width={16} height={16} color="currentColor" aria-hidden />
        </span>
      </div>
      <h2 className="font-body mt-2 text-[15px] text-[#1E3A2C]">Total Sales</h2>
      <Peso amount={revenue} className="font-heading mt-1 block text-[28px] leading-tight text-[#1E3A2C]" />
      <div className="mt-4 flex items-center justify-between border-t border-[#E3EBE6] pt-2">
        <span className="font-body text-[11px] font-bold text-[#008A58]">{rangeLabel}</span>
        <span className="font-body text-[11px] text-[#8C9A92]">
          {units} total item{units === 1 ? "" : "s"}
        </span>
      </div>
    </section>
  );
}
