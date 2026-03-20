import { Cormorant_Garamond, Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

const headingFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"]
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"]
});

export function StorefrontShell({ children }: { children: ReactNode }) {
  return (
    <div className={`${headingFont.variable} ${bodyFont.variable} min-h-screen bg-transparent font-[family-name:var(--font-manrope)] text-[#261d17]`}>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
