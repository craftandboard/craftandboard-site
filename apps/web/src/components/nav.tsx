"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    title: "Overview",
    links: [
      { href: "/admin/craft-board/dashboard", label: "Dashboard" },
      { href: "/admin/craft-board/cabinet-shelves/launch", label: "Cabinet Shelf Launch" }
    ]
  },
  {
    title: "Orders & Ops",
    links: [
      { href: "/admin/craft-board/inquiries", label: "Inquiries" },
      { href: "/admin/craft-board/proposals", label: "Proposals" },
      { href: "/admin/craft-board/deposits", label: "Deposits" },
      { href: "/admin/craft-board/orders", label: "Orders" },
      { href: "/admin/craft-board/production-board", label: "Production Board" },
      { href: "/admin/craft-board/production-jobs", label: "Production Jobs" },
    ]
  },
  {
    title: "Marketing",
    links: [
      { href: "/admin/craft-board/seo", label: "SEO" },
      { href: "/admin/craft-board/seo/pinterest", label: "Pinterest" },
      { href: "/admin/craft-board/seo/backlinks", label: "Backlinks" },
      { href: "/admin/craft-board/outreach", label: "Outreach" }
    ]
  }
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-4">
      {sections.map((section) => (
        <div key={section.title} className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#8a7869]">
            {section.title}
          </p>
          <div className="flex flex-wrap gap-3">
            {section.links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(`${link.href}/`));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? "border-[#cfd7bb] bg-[#eef1e4] text-[#4e5738]"
                      : "border-[#e2d6c9] bg-[#fffaf4] text-[#5f5144] hover:border-[#cabba9] hover:text-[#2c221b]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
