"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { formatCurrency, getConversionStatusLabel, getIntakeStatusLabel, humanizeToken } from "../lib/mvp";
import { StatusBadge } from "./status-badge";

export function PilotStatusCard({
  leadId,
  latestIntakeStatus,
  acceptanceStatus,
  conversionStatus,
  conversionBlockedReason,
  requestedAmountCents,
  paidAmountCents,
  outstandingAmountCents
}: {
  leadId: string | null | undefined;
  latestIntakeStatus: string | null | undefined;
  acceptanceStatus: string | null | undefined;
  conversionStatus: string | null | undefined;
  conversionBlockedReason?: string | null;
  requestedAmountCents?: number | null;
  paidAmountCents?: number | null;
  outstandingAmountCents?: number | null;
}) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pilot Readiness</p>
      <div className="mt-4 grid gap-3">
        <StatusRow
          label="Lead linked"
          value={leadId ? "Ready" : "Missing"}
          detail={leadId ? <Link href={`/leads/${leadId}`} className="text-emerald-300 underline">Open lead</Link> : "Create from a lead before sharing externally."}
        />
        <StatusRow label="Acceptance link" value={getIntakeStatusLabel(latestIntakeStatus)} />
        <StatusRow
          label="Acceptance state"
          value={acceptanceStatus ? humanizeToken(acceptanceStatus) : "Pending"}
        />
        <StatusRow
          label="Deposit visibility"
          value={`${formatCurrency(requestedAmountCents)} requested / ${formatCurrency(paidAmountCents)} paid`}
          detail={`Outstanding ${formatCurrency(outstandingAmountCents)}`}
        />
        <StatusRow
          label="Conversion"
          value={getConversionStatusLabel(conversionStatus)}
          detail={conversionBlockedReason ?? "Run conversion evaluation when acceptance and deposit state are ready."}
        />
      </div>
    </article>
  );
}

function StatusRow({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <StatusBadge value={value} label={value} />
      </div>
      {detail ? <div className="mt-2 text-sm text-slate-300">{detail}</div> : null}
    </div>
  );
}
