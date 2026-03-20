import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "./Container";

export function Hero({
  eyebrow,
  title,
  body,
  primaryCta,
  secondaryCta,
  aside
}: {
  eyebrow?: string;
  title: string;
  body: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  aside?: ReactNode;
}) {
  return (
    <div className="border-b border-[#d8c8b7]/70 bg-[linear-gradient(180deg,rgba(255,251,246,0.9),rgba(243,233,220,0.8))]">
      <Container className="grid gap-8 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
        <div>
          {eyebrow ? (
            <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">{eyebrow}</p>
          ) : null}
          <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-cormorant)] text-5xl leading-none text-[#241811] sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#5c4a3d] sm:text-lg">{body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={primaryCta.href}
              className="rounded-full bg-[#2b1d16] px-6 py-3 text-sm font-medium text-[#f6eee4] transition hover:bg-[#4a3529]"
            >
              {primaryCta.label}
            </Link>
            {secondaryCta ? (
              <Link
                href={secondaryCta.href}
                className="rounded-full border border-[#b99b7f] px-6 py-3 text-sm font-medium text-[#3e2a1d] transition hover:border-[#8d6b4f] hover:bg-[#f7efe6]"
              >
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
        <div>{aside}</div>
      </Container>
    </div>
  );
}
