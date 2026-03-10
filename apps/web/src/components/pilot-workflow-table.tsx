"use client";

import Link from "next/link";
import { formatDateTime, humanizeToken } from "../lib/mvp";
import { StatusBadge } from "./status-badge";

export type PilotWorkflowRow = {
  leadId: string;
  leadName: string;
  proposalId: string | null;
  proposalTitle: string | null;
  projectId: string | null;
  projectName: string | null;
  workflowStatus: string;
  nextAction: string;
  acceptanceStatus: string;
  depositStatus: string;
  conversionStatus: string;
  blockerCount: number;
  latestActivityAt: string;
};

export function PilotWorkflowTable({
  rows,
  title,
  emptyState
}: {
  rows: PilotWorkflowRow[];
  title: string;
  emptyState: string;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pilot Ops</p>
        <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
      </div>

      {rows.length ? (
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="px-3 py-3">Lead</th>
                <th className="px-3 py-3">Workflow</th>
                <th className="px-3 py-3">Acceptance</th>
                <th className="px-3 py-3">Deposit</th>
                <th className="px-3 py-3">Conversion</th>
                <th className="px-3 py-3">Next Action</th>
                <th className="px-3 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.leadId} className="border-t border-white/10 align-top">
                  <td className="px-3 py-4">
                    <div className="space-y-2">
                      <div className="font-medium text-white">{row.leadName}</div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/leads/${row.leadId}`} className="text-emerald-300 underline">
                          Lead
                        </Link>
                        {row.proposalId ? (
                          <Link href={`/proposals/${row.proposalId}`} className="text-emerald-300 underline">
                            Proposal
                          </Link>
                        ) : null}
                        {row.projectId ? (
                          <Link href={`/projects/${row.projectId}`} className="text-emerald-300 underline">
                            Project
                          </Link>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-400">
                        {row.proposalTitle ?? "No proposal yet"}
                        {row.projectName ? ` · ${row.projectName}` : ""}
                      </p>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="space-y-2">
                      <StatusBadge value={row.workflowStatus} label={row.workflowStatus} />
                      {row.blockerCount > 0 ? (
                        <p className="text-xs text-rose-200">{row.blockerCount} blocker/high issue(s) open</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <StatusBadge value={row.acceptanceStatus} label={row.acceptanceStatus} />
                  </td>
                  <td className="px-3 py-4">
                    <StatusBadge value={row.depositStatus} label={row.depositStatus} />
                  </td>
                  <td className="px-3 py-4">
                    <StatusBadge value={row.conversionStatus} label={row.conversionStatus} />
                  </td>
                  <td className="px-3 py-4 text-slate-200">{row.nextAction}</td>
                  <td className="px-3 py-4 text-slate-400">{formatDateTime(row.latestActivityAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-slate-300">
          {emptyState}
        </div>
      )}
    </section>
  );
}
