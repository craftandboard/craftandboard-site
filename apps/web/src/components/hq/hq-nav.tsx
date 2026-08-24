import Link from "next/link";
import { HQ_HOME_PATH, HQ_SECTIONS } from "../../lib/hq/nav";
import type { HqSectionKey } from "../../lib/hq/types";

export function HqNav({ activeKey }: { activeKey?: HqSectionKey }) {
  return (
    <nav aria-label="Craft &amp; Board HQ" className="flex flex-wrap items-center gap-2">
      <Link
        href={HQ_HOME_PATH}
        className="inline-flex min-h-[2.75rem] items-center rounded-full border border-[#e2d6c9] bg-[#fffaf4] px-4 text-base font-medium text-[#6f5f51]! transition hover:border-[#c9b7a3] hover:text-[#2c221b]!"
      >
        HQ
      </Link>
      {HQ_SECTIONS.map((section) => {
        const isActive = section.key === activeKey;

        return (
          <Link
            key={section.key}
            href={section.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "inline-flex min-h-[2.75rem] items-center rounded-full border border-[#c9b7a3] bg-[#2c221b] px-4 text-base font-medium text-[#fffaf4]!"
                : "inline-flex min-h-[2.75rem] items-center rounded-full border border-[#e2d6c9] bg-[#fffaf4] px-4 text-base font-medium text-[#6f5f51]! transition hover:border-[#c9b7a3] hover:text-[#2c221b]!"
            }
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
