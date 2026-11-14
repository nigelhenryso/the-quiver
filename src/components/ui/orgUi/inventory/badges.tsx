import { lato } from "@/src/styles/fonts";
import { getStockStatus, stockStatusLabel } from "@/src/app/(organization)/inventory/data";

const stockColors = {
  in: "border-[#9EE2C0] bg-[#E9FBF2] text-[#008A58]",
  low: "border-[#E8C547] bg-[#FDE9A0] text-[#6B4E00]",
  out: "border-[#F2A9B3] bg-[#FFE8EB] text-[#C4112F]",
} as const;

export function StockBadge({ stock, salesL30D }: { stock: number; salesL30D: number }) {
  const status = getStockStatus(stock, salesL30D);
  return (
    <span
      className={`${lato.className} inline-block whitespace-nowrap rounded-[6px] border px-2 py-[3px] text-[12px] font-bold ${stockColors[status]}`}
    >
      {stockStatusLabel[status]} ({stock})
    </span>
  );
}

export function StatusPill({ published }: { published: boolean }) {
  return (
    <span
      className={`${lato.className} inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-bold ${
        published ? "bg-[#E3F5EA] text-[#004D31]" : "bg-[#EDF0F2] text-[#3F4B54]"
      }`}
    >
      <span
        aria-hidden
        className={`h-[6px] w-[6px] rounded-full ${published ? "bg-[#004D31]" : "bg-[#5C6870]"}`}
      />
      {published ? "Live" : "Unpublished"}
    </span>
  );
}