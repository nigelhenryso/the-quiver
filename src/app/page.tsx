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

      <div className="pt-[80px] mt-[20px] p-[20px]">
        <HeroSection />
      </div>
    </main>
  );
}