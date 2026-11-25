import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { calSans, lato } from "../styles/fonts";
import "../styles/globals.css";
import { Footer } from "../components/ui/Footer";
import SessionHeartbeat from "../components/auth/SessionHeartbeat";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "The Quiver",
  description: "DLSU Student Organization E-Commerce Site",
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml"}
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${calSans.variable} ${lato.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Footer/>
        <SessionHeartbeat />
      </body>
    </html>
  );
}
