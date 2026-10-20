'use client';

import { Header } from "../components/ui/Header";
import { HeroSection } from "../components/ui/LandingPage/HeroSection";
import { OrgSlider } from "../components/ui/LandingPage/OrgSlider";
import { Cal_Sans, Braah_One, Lato } from 'next/font/google';

const braahOne = Braah_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export default function Home() {
  return (
    <main className="flex flex-col w-full">
      <Header
        loggedIn={false}
        onLogin={() => console.log("Log in clicked")}
        onCreateAccount={() => console.log("Sign up clicked")}
      />

      <div className="flex w-full flex-col gap-[50px] p-[20px] pt-[40px]">
        <HeroSection />
        <div className="border-b border-[#D4D4D4] w-[90%] mx-auto" />
        <div className="flex flex-col items-center text-center">
          <h1 className={`${braahOne.className} flex flex-row items-center whitespace-nowrap text-[64px] font-normal text-[#000000]`}>
            What is <span className="ml-4 text-[#199E72]">The Quiver</span>?
          </h1>

          <p className="mx-auto max-w-6xl">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
            quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </div>
        
        <OrgSlider />
        <div className="border-b border-[#D4D4D4] w-[90%] mx-auto" />
      </div>
    </main>
  );
}