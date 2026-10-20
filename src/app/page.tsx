'use client';

import { Header } from "../components/ui/Header";
import { HeroSection } from "../components/ui/LandingPage/HeroSection";

export default function Home() {
  return (
    <main className="flex flex-col w-full">
      <Header
        loggedIn={false}
        onLogin={() => console.log("Log in clicked")}
        onCreateAccount={() => console.log("Sign up clicked")}
      />

      <div className="pt-[40px] m-auto p-[20px] items-center">
        <HeroSection />
        <div className="border-b border-[#D4D4D4] w-[90%] mx-auto"/>
      </div>
    </main>
  );
}