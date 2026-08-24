import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireHqViewer } from "../../lib/hq/access";

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

export default async function HqLayout({ children }: { children: ReactNode }) {
  const viewer = await requireHqViewer();

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#e2d6c9] bg-[#fffaf4] p-6 shadow-[0_16px_40px_rgba(73,50,33,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#6b7550]">Partner Portal</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#2c221b]">
              Craft &amp; Board HQ
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#6f5f51]">
              One gated place for Brandon, Tim, and Tyler to see the plan and work out the
              partnership. Read-only by design — answers are transcribed, documents live in Google
              Docs.
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8d6b4f]">
            Signed in as {viewer.name ?? viewer.email}
          </p>
        </div>
      </section>
      {children}
    </div>
  );
}
