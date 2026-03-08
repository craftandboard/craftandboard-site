import type { Metadata } from "next";
import { CurrentContextChip } from "../components/current-context-chip";
import { Nav } from "../components/nav";
import { getViewerContext } from "../lib/api";
import "../components/labels/shelf-label.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Craft & Board",
  description: "Local foundation scaffold for the Craft & Board manufacturing SaaS."
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const contextPromise = getViewerContext();

  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
          <header className="mb-10 rounded-[2rem] border border-white/10 bg-[var(--panel)] p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">
                  craftandboard.com
                </p>
                <div>
                  <h1 className="text-4xl font-semibold tracking-tight text-white">
                    Craft &amp; Board
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                    Manufacturing SaaS foundation for custom shelving operations,
                    batching, CNC prep, and shop-floor workflows.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start gap-4 lg:items-end">
                <CurrentContextChip context={await contextPromise} />
                <Nav />
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
