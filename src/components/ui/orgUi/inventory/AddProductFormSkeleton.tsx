import { basicInformationFieldWidth, basicInformationRowClass, pickupFieldRowClass, productCardClass, productFormGridClass, productFormProgressClass, productFormSectionsClass } from "./productFormLayout";

const block = "rounded-[8px] bg-[#E3F5EA]";
const salesRow = "grid items-center gap-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-x-4";
const tile = `${block} aspect-square w-24 xl:w-[108px]`;

export default function AddProductFormSkeleton() {
  return (
    <>
      <p role="status" className="sr-only">Loading product form…</p>
      <div aria-hidden="true" className={productFormGridClass}>
        <div className={`${productCardClass} ${productFormProgressClass}`}>
          <div className="motion-safe:animate-pulse">
            <div className="border-b border-[#E3E3E3] pb-2">
              <div className={`${block} h-5 w-16`} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1 lg:flex-col">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className={`${block} h-9 w-28 lg:w-full`} />
              ))}
            </div>
          </div>
        </div>
        <div className={productFormSectionsClass}>
          <div className={productCardClass}>
            <div className="motion-safe:animate-pulse">
              <SkeletonHeading />
              <div className="mt-4 space-y-5">
                <div className={basicInformationRowClass}>
                  <div className={`${block} mt-1 h-4 w-24 sm:justify-self-end`} />
                  <div className="flex flex-wrap gap-6 xl:gap-8">
                    {Array.from({ length: 5 }, (_, index) => (
                      <div key={index} className={tile} />
                    ))}
                  </div>
                </div>
                <div className={basicInformationRowClass}>
                  <div className={`${block} mt-1 h-4 w-24 sm:justify-self-end`} />
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className={tile} />
                    <div className="w-56 max-w-full space-y-2">
                      <div className={`${block} h-3 w-full`} />
                      <div className={`${block} h-3 w-3/4`} />
                      <div className={`${block} h-3 w-1/2`} />
                    </div>
                  </div>
                </div>
                <SkeletonField fieldClass={`h-9 ${basicInformationFieldWidth}`} />
                <SkeletonField fieldClass={`h-9 ${basicInformationFieldWidth}`} />
                <SkeletonField fieldClass={`h-40 ${basicInformationFieldWidth}`} />
              </div>
            </div>
          </div>
          <div className={productCardClass}>
            <div className="motion-safe:animate-pulse">
              <SkeletonHeading />
              <div className="mt-4 max-w-3xl space-y-5">
                <SkeletonField rowClass={salesRow} fieldClass="h-10" />
                <SkeletonField rowClass={salesRow} />
                <SkeletonField rowClass={salesRow} />
                <div className="space-y-3 sm:ml-9">
                  <div className={`${block} h-[62px]`} />
                  <div className={`${block} h-[62px]`} />
                </div>
              </div>
            </div>
          </div>
          <div className={productCardClass}>
            <div className="motion-safe:animate-pulse">
              <SkeletonHeading />
              <div className="mt-4 space-y-5">
                {Array.from({ length: 4 }, (_, index) => <SkeletonField key={index} rowClass={pickupFieldRowClass} fieldClass="h-9 max-w-[575px]" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SkeletonHeading() {
  return <div className="border-b border-[#DDE5E0] py-1 pb-3"><div className={`${block} h-5 w-40`} /></div>;
}

function SkeletonField({ rowClass = basicInformationRowClass, fieldClass = "h-9" }: { rowClass?: string; fieldClass?: string }) {
  return (
    <div className={rowClass}>
      <div className={`${block} mt-1 h-4 w-3/4 max-w-28 sm:justify-self-end`} />
      <div className={`${block} ${fieldClass}`} />
    </div>
  );
}
