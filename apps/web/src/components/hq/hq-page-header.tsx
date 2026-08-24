import type { ReactNode } from "react";
import { HqStatusBadge } from "./hq-status-badge";
import type { HqSectionStatus } from "../../lib/hq/types";

export function HqPageHeader({
  eyebrow,
  title,
  intent,
  status,
  children
}: {
  eyebrow: string;
  title: string;
  intent: string;
  status?: HqSectionStatus;
  children?: ReactNode;
}) {
  return (
    <header className="rounded-[2rem] border border-[#e2d6c9] bg-[#fffaf4] p-6 shadow-[0_16px_40px_rgba(73,50,33,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[#6b7550]">{eyebrow}</p>
          <h2 className="text-3xl font-semibold tracking-tight text-[#2c221b]">{title}</h2>
          <p className="max-w-3xl text-sm leading-7 text-[#6f5f51]">{intent}</p>
        </div>
        {status ? <HqStatusBadge status={status} /> : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </header>
  );
}
