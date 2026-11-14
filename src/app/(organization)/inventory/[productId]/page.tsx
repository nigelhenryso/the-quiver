import { calSans, lato } from "@/src/styles/fonts";
import AddProductForm from "@/src/components/ui/orgUi/inventory/AddProductForm";

export const metadata = {
  title: "Add New Product | The Quiver Seller Hub",
};

export default function OrgAddProductPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FDFFFC]">
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 pb-16 pt-10 lg:px-10">
        <h1 className={`${calSans.className} text-[32px] text-[#004D31] sm:text-[36px]`}>
          Add New Product
        </h1>
        <p className={`${lato.className} mt-1 text-[14px] text-[#5C8F78]`}>
          List a new merchandise or pre-order item to the campus marketplace.
        </p>
        <div className="mt-5 border-t border-[#DDE5E0]" />

        <AddProductForm />
      </main>

      <footer className="border-t border-[#C9D6CE] bg-[#F3FFF6] py-4 text-center">
        <p className={`${calSans.className} text-[12px] text-[#199E72]`}>
          © 2026 The Quiver. All rights reserved.
        </p>
      </footer>
    </div>
  );
}