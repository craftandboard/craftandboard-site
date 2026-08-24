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
  eyebrow?: string;
  title: string;
  intent: string;
  status?: HqSectionStatus;
  children?: ReactNode;
}) {
  return (
    <header className="rounded-[1.5rem] border border-[#e2d6c9] bg-[#fffaf4] p-4 shadow-[0_16px_40px_rgba(73,50,33,0.06)] sm:rounded-[2rem] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          {eyebrow ? (
            <p className="text-xs uppercase tracking-[0.3em] text-[#67714d]">{eyebrow}</p>
          ) : null}
          <h2 className="break-words text-2xl font-semibold tracking-tight text-[#2c221b] sm:text-3xl">
            {title}
          </h2>
          <p className="max-w-3xl text-base leading-7 text-[#6f5f51]">{intent}</p>
        </div>
        {status ? <HqStatusBadge status={status} /> : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </header>
  );
}
