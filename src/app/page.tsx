'use client';

import { Header } from "../components/ui/Header";

export default function Home() {
  return (
    <main>
      <Header
        loggedIn={false}
        onLogin={() => console.log("Log in clicked")}
        onCreateAccount={() => console.log("Sign up clicked")}
      />
    </main>
  );
}