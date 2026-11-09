'use client';

import { useState } from "react";
import { Header } from "../components/ui/Header";
import { HeroSection } from "../components/ui/LandingPage/HeroSection";
import { OrgSlider } from "../components/ui/LandingPage/OrgSlider";
import { FAQSection } from "../components/ui/LandingPage/FAQSection";
import { Footer } from "../components/ui/Footer";

export default function Home() {
  const [modal, setModal] = useState<"login" | "signup" | null>(null);

  return (
    <main className="flex flex-col w-full">
      <header className="fixed top-0 left-0 z-50 w-full">
        <Header
          loggedIn={false}
          onLogin={() => setModal("login")}
          onCreateAccount={() => setModal("signup")}
        />
      </header>
      

      <div className="flex w-full flex-col pt-[80px] gap-[50px] p-[20px] pt-[40px]">
        <HeroSection />
        <div className="border-b border-[#D4D4D4] w-[90%] mx-auto" />
        <div className="flex flex-col items-center text-center">
          <h1 className={`font-heading flex flex-row items-center whitespace-nowrap text-[64px] font-normal text-[#000000]`}>
            What is <span className="ml-4 text-[#199E72]">The Quiver</span>?
          </h1>

          <p className="font-body mx-auto max-w-6xl">
            The Quiver is an e-commerce platform that allows student organizations within De La Salle University (DLSU) to efficiently sell their merchandise to the student body. The Quiver aims to replace the current reliance on Google Sheets and Forms, which often results in cluttered records, limited analysis, and difficulty in monitoring orders and transactions. By providing a centralized, user-friendly platform, the project seeks to streamline the buying and selling process, improve transparency, and enhance the overall experience for both student organizations and buyers.
          </p>
        </div>
        
        <OrgSlider />
        <div className="border-b border-[#D4D4D4] w-[90%] mx-auto" />
          <div className="m-8">
            <FAQSection/>
          </div>
      </div>

      <Footer/>
    </main>
  );
}