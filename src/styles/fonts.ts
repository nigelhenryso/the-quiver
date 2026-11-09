import { Cal_Sans, Lato } from "next/font/google";

export const calSans = Cal_Sans({
  weight: "400",
  subsets: ['latin'],
  display: "swap",
  variable: "--font-cal-sans",
});

export const lato = Lato({
  weight: ["400", "700"],
  subsets: ['latin'],
  display: "swap",
  variable: "--font-lato"
});