import type { CategorySales } from "@/src/lib/sales";

const COLORS = ["#00583A", "#0B8A5C", "#16B57A", "#4CD49C", "#A3EBCB", "#6FA58C", "#C7F2DD"];
const colorAt = (i: number) => COLORS[i % COLORS.length];

const compactPeso = (amount: number) =>
  "₱" + new Intl.NumberFormat("en-PH", { notation: "compact", maximumFractionDigits: 1 }).format(amount).toLowerCase();

const pesoFull = (amount: number) =>
  "₱" + amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Donut({ categories, revenue, units }: { categories: CategorySales[]; revenue: number; units: number }) {
  const r = 70;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative h-[180px] w-[180px]">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" role="img" aria-label="Category distribution share">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#E8F0EB" strokeWidth="18" />
        {categories.map((c, i) => {
          const length = c.share * circumference;
          const segment = (
            <circle
              key={c.name}
              cx="90"
              cy="90"
              r={r}
              fill="none"
              stroke={colorAt(i)}
              strokeWidth="18"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
            />
          );
          offset += length;
          return segment;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-body text-[9px] font-bold tracking-[0.12em] text-[#8C9A92]">TOTAL NET</span>
        <span className="font-heading text-[26px] leading-tight text-[#1E3A2C]">{compactPeso(revenue)}</span>
        <span className="font-body mt-1 rounded-full bg-[#E8F7EE] px-2 py-[1px] text-[9px] font-bold text-[#2F4531]">
          {units} Unit{units === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

export default function CategoryBreakdown({
  categories,
  revenue,
  units,
}: {
  categories: CategorySales[];
  revenue: number;
  units: number;
}) {
  return (
    <section className="rounded-[10px] border border-[#DCE6E0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] sm:px-6">
      <h2 className="font-heading text-[20px] text-[#1E3A2C]">Sales per category</h2>
      <p className="font-body mt-1 border-b border-[#E3EBE6] pb-3 text-[10.5px] text-[#8C9A92]">
        Breakdown of gross revenue, unit volume, and relative share across official merchandise lines
      </p>

      {categories.length === 0 ? (
        <p className="font-body py-16 text-center text-[12px] text-[#8C9A92]">No claimed sales in this period.</p>
      ) : (
        <div className="mt-5 flex flex-col gap-8 md:flex-row md:items-start">
          <div className="flex flex-col items-center rounded-[10px] border border-[#E3EBE6] bg-[#F7FAF8] px-6 py-5">
            <Donut categories={categories} revenue={revenue} units={units} />
            <span className="font-body mt-3 text-[9px] text-[#8C9A92]">Category Distribution Share</span>
          </div>

          <ul className="flex flex-1 flex-col gap-5 pt-2">
            {categories.map((c, i) => {
              const pct = (c.share * 100).toFixed(1);
              return (
                <li key={c.name}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-[10px] w-[10px] rounded-full" style={{ background: colorAt(i) }} aria-hidden />
                      <span className="font-body text-[12px] font-bold text-[#1E3A2C]">{c.name}</span>
                      <span className="font-body text-[9.5px] text-[#8C9A92]">
                        • {c.units} unit{c.units === 1 ? "" : "s"} sold
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-body text-[13px] font-bold text-[#1E3A2C]">{pesoFull(c.revenue)}</span>
                      <span className="font-body rounded-[4px] bg-[#E8F7EE] px-[6px] py-[1px] text-[9.5px] font-bold text-[#2F4531]">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-[6px] w-full rounded-full bg-[#E8F0EB]">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colorAt(i) }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
