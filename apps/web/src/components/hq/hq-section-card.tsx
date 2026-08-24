import Link from "next/link";
import { HqStatusBadge } from "./hq-status-badge";
import type { HqSectionSummary } from "../../lib/hq/types";

export function HqSectionCard({ section }: { section: HqSectionSummary }) {
  return (
    <Link
      href={section.href}
      className="group flex flex-col justify-between rounded-[1.75rem] border border-[#e2d6c9] bg-[#fffaf4] p-6 transition hover:border-[#c9b7a3] hover:shadow-[0_16px_40px_rgba(73,50,33,0.08)]"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-[#2c221b] group-hover:underline">
            {section.label}
          </h3>
          <HqStatusBadge status={section.status} />
        </div>
        <p className="mt-3 text-sm leading-6 text-[#6f5f51]">{section.summary}</p>
      </div>
      <p className="mt-5 text-xs uppercase tracking-[0.18em] text-[#8d6b4f]">{section.detail}</p>
    </Link>
  );
}
