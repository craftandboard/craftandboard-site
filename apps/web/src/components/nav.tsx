"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    title: "MVP Pilot",
    links: [
      { href: "/leads", label: "Leads" },
      { href: "/projects", label: "Projects" },
      { href: "/pilot-ops", label: "Pilot Ops" },
      { href: "/pilot-feedback", label: "Pilot Feedback" },
      { href: "/settings", label: "Settings" }
    ]
  },
  {
    title: "Operations",
    links: [
      { href: "/", label: "Dashboard" },
      { href: "/orders", label: "Orders" },
      { href: "/manufacturing", label: "Manufacturing" },
      { href: "/parts-scans", label: "Parts & Scans" },
      { href: "/cost-calculator", label: "Cost Calculator" },
      { href: "/costing", label: "Costing" },
      { href: "/machines", label: "Machines" },
      { href: "/inventory", label: "Inventory" },
      { href: "/admin/craft-board/inquiries", label: "Inquiries" },
      { href: "/admin/craft-board/proposals", label: "Proposals" },
      { href: "/admin/craft-board/deposits", label: "Deposits" },
      { href: "/admin/craft-board/orders", label: "Craft Orders" },
      { href: "/admin/craft-board/dashboard", label: "Marketing Dashboard" },
      { href: "/admin/craft-board/cabinet-shelves/launch", label: "Cabinet Shelf Launch" },
      { href: "/admin/craft-board/seo", label: "SEO Ops" },
      { href: "/admin/craft-board/seo/pinterest", label: "Pinterest Ops" },
      { href: "/admin/craft-board/seo/backlinks", label: "Backlink Ops" },
      { href: "/admin/craft-board/outreach", label: "Outreach Workspace" },
      { href: "/admin/craft-board/production-board", label: "Production Board" },
      { href: "/admin/craft-board/production-jobs", label: "Production Jobs" },
      { href: "/settings", label: "Settings" }
    ]
  },
  {
    title: "Transitional Tools",
    links: [
      { href: "/material-forecast", label: "Forecast" },
      { href: "/remnants", label: "Remnants" },
      { href: "/machine-events", label: "Machine Events" },
      { href: "/stage-signals", label: "Signals" },
      { href: "/trusted-auto-apply", label: "Auto-Apply" },
      { href: "/labels", label: "Labels" },
      { href: "/batches", label: "Batches" },
      { href: "/stations", label: "Stations" },
      { href: "/production", label: "Legacy Production" },
      { href: "/configurator-test", label: "Configurator" }
    ]
  }
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-3">
      {sections.map((section) => (
        <div key={section.title} className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
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
                      ? "border-emerald-300 bg-emerald-300/20 text-emerald-50"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-emerald-200/30 hover:text-white"
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
