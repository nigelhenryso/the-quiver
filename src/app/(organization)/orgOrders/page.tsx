import { Header } from "@/src/components/ui/Header";
import { Footer } from "@/src/components/ui/Footer";

export const metadata = {
  title: "Orders | The Quiver Seller Hub",
};

export default function OrgOrdersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#FBFFFB] to-[#E4FFCC]">
      <Header loggedIn />

      <main className="mx-auto w-full max-w-[960px] flex-1 px-5 pb-16 pt-12 sm:px-8">
        <h1 className={`font-heading text-[32px] text-[#199E72] sm:text-[36px]`}>
          Orders
        </h1>
        <p className={`font-body mt-1 text-[12.5px] text-[#8DBBA6]`}>
          View and manage orders from your customers.
        </p>

        {/* later: add the orders content here */}
      </main>

      <Footer/>
    </div>
  );
}