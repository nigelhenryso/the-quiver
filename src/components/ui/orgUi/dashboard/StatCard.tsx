import type { ReactNode } from "react";
import Link from "next/link";

// small rounded tag in the top right of a stat card
export function Badge({
  tone = "info",
  children,
}: {
  tone?: "warning" | "info";
  children: ReactNode;
}) {
  const colors =
    tone === "warning"
      ? "border-[#E8C547] bg-[#FDE9A0] text-[#6B4E00]"
      : "border-[#BFE3C9] bg-[#E8F7EE] text-[#2F4531]";

  return (
    <span
      className={`font-body rounded-full border px-2 py-[2px] text-[9px] font-bold ${colors}`}
    >
      {children}
    </span>
  );
}

type StatCardProps = {
  value: string | number;
  label: string;
  badge?: ReactNode; // top right corner
  linkLabel: string; // ex: "Verify now"
  href: string;
};

// one of the 4 number boxes inside Quick View
export default function StatCard({ value, label, badge, linkLabel, href }: StatCardProps) {
  return (
        <div className="relative flex flex-col rounded-[8px] border border-[#2F8F6B]/50 bg-[#F3FFF6] px-5 pb-3 pt-10 shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-all duration-200 ease-in-out hover:scale-105 hover:border-[#004D31] hover:shadow-lg">
      <p className={`font-heading text-[44px] leading-none text-[#008A58]`}>{value}</p>
      <h3 className={`font-body mt-2 text-[15px] font-bold text-[#1E3A2C]`}>{label}</h3>

      <div className="mt-4 border-t border-[#BFE3C9] pt-2 text-right">
        <Link
          href={href}
          className={`font-body text-[11px] text-[#008A58] hover:underline`}
        >
          {linkLabel} →
        </Link>
      </div>
    </div>
  );
}