import { ChevronLeft, ChevronRight } from "lucide-react";
import { lato } from "../../../../../../../../../../Downloads/the-quiver-dashboard-updates-new/the-quiver-dashboard-updates-new/the-quiver-feat-dashboard/src/lib/fonts";

type PageNavProps = {
  page: number; // 1-based
  pageCount: number;
  onChange: (page: number) => void;
};

// shows up to 5 page numbers around the current page
function visiblePages(page: number, pageCount: number) {
  const size = Math.min(5, pageCount);
  let start = Math.max(1, page - Math.floor(size / 2));
  start = Math.min(start, pageCount - size + 1);
  return Array.from({ length: size }, (_, i) => start + i);
}

export default function PageNav({ page, pageCount, onChange }: PageNavProps) {
  if (pageCount <= 1) return null;

  const base = `${lato.className} flex h-[34px] w-[41px] items-center justify-center border-l border-[#C9D6CE] text-[13px] font-bold text-[#1E3A2C] transition-all duration-200 ease-in-out active:scale-95`;

  return (
    <nav aria-label="Pagination" className="flex overflow-hidden rounded-[6px] border border-[#C9D6CE]">
      <button
        type="button"
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className={`${base} border-l-0 text-[#9AA59E] hover:bg-[#F3FFF6] disabled:cursor-not-allowed disabled:hover:bg-transparent`}
      >
        <ChevronLeft size={16} />
      </button>

      {visiblePages(page, pageCount).map((n) => (
        <button
          key={n}
          type="button"
          aria-current={n === page ? "page" : undefined}
          onClick={() => onChange(n)}
          className={`${base} ${n === page ? "bg-[#004D31] text-white" : "hover:bg-[#F3FFF6]"}`}
        >
          {n}
        </button>
      ))}

      <button
        type="button"
        aria-label="Next page"
        disabled={page === pageCount}
        onClick={() => onChange(page + 1)}
        className={`${base} text-[#9AA59E] hover:bg-[#F3FFF6] disabled:cursor-not-allowed disabled:hover:bg-transparent`}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}