import { Suspense, type ReactNode } from "react";
import AddProductFormSkeleton from "./AddProductFormSkeleton";

export default function ProductFormPage({ title, description, children }: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div data-add-product-page className="flex min-h-[calc(100vh-59px)] flex-col bg-[#FDFFFC] pb-[var(--product-action-bar-height,0px)]">
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 pb-16 pt-7 lg:px-10">
        <h1 className="font-heading mb-0 text-[32px] text-[#004D31] sm:text-[36px]">{title}</h1>
        <p className="font-body mt-0 text-[14px] text-[#5C8F78]">{description}</p>
        <div className="mt-6 border-t border-[#DDE5E0]" />
        <Suspense fallback={<AddProductFormSkeleton />}>{children}</Suspense>
      </main>
    </div>
  );
}
