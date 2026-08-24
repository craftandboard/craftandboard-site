import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { requireHqViewer } from "../../lib/hq/access";
import { HQ_HOME_PATH } from "../../lib/hq/nav";

/**
 * HQ is a deliberately light, warm-paper design with no dark variant. Declaring
 * the scheme stops browsers (Chrome auto-dark in particular) from inverting
 * card backgrounds while leaving the explicitly-set text colors alone, which
 * is what produced dark-text-on-dark-background.
 */
export const viewport: Viewport = {
  colorScheme: "light"
};

/** Every (hq) route is private. Nothing here should ever be indexed. */
export const metadata: Metadata = {
  title: "Craft & Board HQ",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true
    }
  }
};

/**
 * Minimal partner-facing shell. The root layout skips its admin chrome for
 * these routes, so this is the whole frame: the name, small, top left, and
 * nothing else. Phone width is the design target.
 */
export default async function HqLayout({ children }: { children: ReactNode }) {
  await requireHqViewer();

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-3xl px-4 py-5">
        <header className="mb-4">
          <Link
            href={HQ_HOME_PATH}
            className="inline-flex min-h-[2.75rem] items-center text-base font-semibold tracking-tight text-[#2c221b]"
          >
            Craft &amp; Board
          </Link>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
