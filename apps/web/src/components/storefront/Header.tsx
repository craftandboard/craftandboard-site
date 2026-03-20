"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { storefrontConfig } from "../../lib/storefront/config";
import { Container } from "./Container";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[#dccdbc]/80 bg-[#fbf5ee]/90 backdrop-blur">
      <Container className="py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-[family-name:var(--font-cormorant)] text-3xl leading-none text-[#231710]">
            {storefrontConfig.brandName}
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {storefrontConfig.navigation.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm transition ${
                    active ? "text-[#2b1d16]" : "text-[#6b584a] hover:text-[#2b1d16]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:block">
            <Link
              href={storefrontConfig.primaryCtaHref}
              className="rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7efe5]"
            >
              Start Your Project
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d1beab] text-[#2b1d16] lg:hidden"
            aria-expanded={open}
            aria-label="Toggle navigation menu"
          >
            <span className="sr-only">Toggle navigation</span>
            <div className="space-y-1.5">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </div>
          </button>
        </div>

        {open ? (
          <div className="mt-4 space-y-3 rounded-[1.5rem] border border-[#dccdbc] bg-[#fffaf4] p-4 lg:hidden">
            {storefrontConfig.navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-3 py-3 text-sm text-[#47372c] hover:bg-[#f1e6da]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={storefrontConfig.primaryCtaHref}
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-full bg-[#2b1d16] px-5 py-3 text-center text-sm font-medium text-[#f7efe5]"
            >
              Start Your Project
            </Link>
          </div>
        ) : null}
      </Container>
    </header>
  );
}
