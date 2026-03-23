"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  body,
  children,
  footer,
  notice
}: {
  eyebrow: string;
  title: string;
  body: string;
  children: ReactNode;
  footer?: ReactNode;
  notice?: ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <section className="space-y-6">
        <div className="inline-flex rounded-full border border-[#d9ccb9] bg-[#fffaf4] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.3em] text-[#6b7550]">
          {eyebrow}
        </div>
        <div className="space-y-4">
          <h1 className="max-w-xl font-[family-name:var(--font-cormorant)] text-5xl leading-[0.95] text-[#2c221b] sm:text-6xl">
            {title}
          </h1>
          <p className="max-w-xl text-base leading-7 text-[#6f5f51]">{body}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.75rem] border border-[#e2d6c9] bg-[#fffaf4] p-5 shadow-[0_16px_40px_rgba(73,50,33,0.05)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[#8a7869]">Private access</p>
            <p className="mt-3 text-sm leading-6 text-[#5e5043]">
              For internal team access only. Customers should use the public storefront and contact paths instead of this page.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-[#e2d6c9] bg-[#f7f0e7] p-5 shadow-[0_16px_40px_rgba(73,50,33,0.05)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[#8a7869]">Need the storefront?</p>
            <p className="mt-3 text-sm leading-6 text-[#5e5043]">
              Looking for cabinet shelves? Return to the public shopping flow instead of the admin workspace.
            </p>
            <Link
              href="/shop/cabinet-shelves"
              className="mt-4 inline-flex text-sm font-medium text-[#6b7550] underline underline-offset-4"
            >
              Go to cabinet shelves
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-[#e2d6c9] bg-[#fffaf4] p-8 shadow-[0_26px_60px_rgba(73,50,33,0.08)]">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,_rgba(139,114,87,0.12),_transparent_55%),radial-gradient(circle_at_top_right,_rgba(117,133,79,0.10),_transparent_48%)]" />
        <div className="relative space-y-6">
          {notice}
          {children}
          {footer ? <div className="border-t border-[#eadfd3] pt-5">{footer}</div> : null}
        </div>
      </section>
    </div>
  );
}
