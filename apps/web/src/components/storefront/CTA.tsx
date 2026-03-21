import Link from "next/link";
import { Container } from "./Container";

export function CTA({
  eyebrow,
  title,
  body,
  primary,
  secondary
}: {
  eyebrow?: string;
  title: string;
  body: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <div className="rounded-[2.5rem] border border-[#d5c1af] bg-[#2c1f18] py-12 text-[#f7efe5] shadow-[0_22px_60px_rgba(35,22,16,0.18)]">
      <Container className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          {eyebrow ? <p className="text-xs uppercase tracking-[0.35em] text-[#d6b89c]">{eyebrow}</p> : null}
          <h2 className="mt-4 font-[family-name:var(--font-cormorant)] text-4xl leading-none sm:text-5xl">{title}</h2>
          <p className="mt-4 text-base leading-7 text-[#ebddcf]">{body}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={primary.href}
            className="rounded-full bg-[#f1dfcb] px-6 py-3 text-sm font-medium text-[#2b1d16]"
          >
            {primary.label}
          </Link>
          {secondary ? (
            <Link
              href={secondary.href}
              className="rounded-full border border-[#92735f] px-6 py-3 text-sm font-medium text-[#f1dfcb]"
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
