import type { ReactNode } from "react";
import Link from "next/link";

// small rounded tag in the top right of a stat card
export function Badge({ tone = "info", children }: { tone?: "warning" | "info"; children: ReactNode }) {
  const colors =
    tone === "warning"
      ? "border-[#E8C547] bg-[#FDE9A0] text-[#6B4E00]"
      : "border-[#BFE3C9] bg-[#E8F7EE] text-[#2F4531]";

  return (
    <span className={`font-body inline-flex h-[20px] items-center rounded-[6px] border px-2 text-[10px] font-bold leading-none ${colors}`}>
      {children}
    </span>
  );
}

type StatCardProps = {
  value: string | number;
  label: string;
  badge?: ReactNode;
  footnote?: ReactNode; 
  linkLabel: string;
  href: string;
};

export default function StatCard({ value, label, badge, footnote, linkLabel, href }: StatCardProps) {
  return (
    <div className="relative rounded-[8px] border border-[#2F8F6B]/50 bg-[#F3FFF6] shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-all duration-200 ease-in-out hover:scale-105 hover:border-[#004D31] hover:shadow-lg">
      {badge && <div className="absolute right-3 top-3 z-10 flex h-[20px] items-center">{badge}</div>}

      <Link href={href} aria-label={`${label}: ${linkLabel}`} className="group flex h-full flex-col px-5 pb-3 pt-10">
        <p className="font-heading text-[44px] leading-none text-[#008A58]">{value}</p>
        <h3 className="font-body mt-2 text-[15px] font-bold text-[#1E3A2C]">{label}</h3>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#BFE3C9] pt-2">
          <span className="font-body text-[11px] text-[#5E7A6A]">{footnote}</span>
          <span className="font-body text-[11px] text-[#008A58] group-hover:underline">{linkLabel} →</span>
        </div>
      </Link>
    </div>
  );
}
