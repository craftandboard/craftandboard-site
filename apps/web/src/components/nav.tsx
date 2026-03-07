"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
  { href: "/production", label: "Production" },
  { href: "/manufacturing", label: "Manufacturing" },
  { href: "/labels", label: "Labels" },
  { href: "/configurator-test", label: "Configurator" },
  { href: "/batches", label: "Batches" },
  { href: "/stations", label: "Stations" },
  { href: "/settings", label: "Settings" }
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-3">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

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
    </nav>
  );
}
