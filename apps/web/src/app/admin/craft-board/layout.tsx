import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Nav } from "../../../components/nav";
import { getViewerContext } from "../../../lib/api";

export default async function CraftBoardAdminLayout({
  children
}: {
  children: ReactNode;
}) {
  const context = await getViewerContext();

  if (!context) {
    redirect("/login");
  }

  return (
    <div className="cb-admin-report space-y-6">
      <section className="rounded-[2rem] border border-[#e2d6c9] bg-[#fffaf4] p-6 shadow-[0_16px_40px_rgba(73,50,33,0.06)]">
        <p className="text-sm uppercase tracking-[0.28em] text-[#6b7550]">Private Control Room</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-[#2c221b]">Craft &amp; Board admin tools</h2>
            <p className="mt-2 max-w-3xl text-sm text-[#6f5f51]">
              Orders, shelf launch, SEO, Pinterest, backlinks, and outreach are grouped here behind a signed-in admin session.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <Nav />
        </div>
      </section>
      {children}
    </div>
  );
}
