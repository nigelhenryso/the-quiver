import {
  carouselPanelClass,
  carouselTrackClass,
  productCardClass,
  productImageClass,
} from "./carouselStyles";

export default function ProductRowSkeleton({ label }: { label: string }) {
  return (
    <>
      <p role="status" className="sr-only">{label}</p>
      <div aria-hidden="true" className={`${carouselPanelClass} motion-safe:animate-pulse`}>
        <div className="flex items-center gap-2">
          <div className="size-9 shrink-0 rounded-full bg-[#C9E1C2]" />
          <div className="h-3 w-24 rounded bg-[#C9E1C2]" />
        </div>

        <div className={`${carouselTrackClass} mt-2 overflow-hidden`}>
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className={productCardClass}>
              <div className={productImageClass} />
              <div className="ml-auto mt-1.5 h-[15px] w-1/3 rounded bg-[#D5E8D0]" />
              <div className="mx-auto mt-1.5 h-5 w-2/3 rounded bg-[#D5E8D0]" />
              <div className="mx-auto mt-0.5 h-4 w-1/3 rounded bg-[#D5E8D0]" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
