"use client";

import { CopyLinkButton } from "./copy-link-button";
import { StatusBadge } from "./status-badge";
import { formatDateTime, getIntakeStatusLabel, humanizeToken } from "../lib/mvp";
import type { ProposalAcceptanceIntakeItem } from "../lib/api";

export function AcceptanceLinkStatusCard({
  latestIntake,
  latestLink,
  isPending,
  onCreate,
  onReissue
}: {
  latestIntake: ProposalAcceptanceIntakeItem | null;
  latestLink: string | null;
  isPending: boolean;
  onCreate: () => void;
  onReissue: () => void;
}) {
  const needsReissue =
    latestIntake &&
    ["EXPIRED", "REVOKED", "FAILED", "SUBMITTED", "HANDOFF_ACCEPTED", "HANDOFF_REJECTED"].includes(
      latestIntake.status
    );
  const canCopy = Boolean(latestLink && latestIntake?.status === "OPEN");

  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Share & Acceptance</p>
      <div className="mt-4 space-y-4 text-sm text-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            value={latestIntake?.status ?? "missing"}
            label={latestIntake ? getIntakeStatusLabel(latestIntake.status) : "No live link"}
          />
          {latestIntake?.source ? <StatusBadge value={latestIntake.source} label={humanizeToken(latestIntake.source)} /> : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
          <p className="font-medium text-white">
            {latestIntake
              ? getIntakeStatusLabel(latestIntake.status)
              : "Create an acceptance link so the tester can open the public review flow."}
          </p>
          <div className="mt-3 grid gap-2 text-xs text-slate-400">
            <p>Created: {formatDateTime(latestIntake?.createdAt)}</p>
            <p>Expires: {formatDateTime(latestIntake?.tokenExpiresAt)}</p>
            <p>
              Last handoff:{" "}
              {latestIntake?.handedOffAt ? formatDateTime(latestIntake.handedOffAt) : "No external submission yet"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={latestIntake ? onReissue : onCreate}
            disabled={isPending}
            className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-emerald-950 disabled:opacity-60"
          >
            {isPending
              ? "Working..."
              : latestIntake
                ? needsReissue
                  ? "Reissue Acceptance Link"
                  : "Create New Link"
                : "Create Acceptance Link"}
          </button>
          {canCopy && latestLink ? <CopyLinkButton value={latestLink} /> : null}
        </div>

        {latestLink ? (
          <div className="rounded-2xl border border-white/10 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Latest Share Link</p>
            <p className="mt-2 break-all text-sm text-white">{latestLink}</p>
            {!canCopy ? (
              <p className="mt-3 text-xs text-slate-400">
                This link is kept for history, but a fresh link should be shared before the next tester attempt.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 px-4 py-4 text-sm text-slate-300">
            No active acceptance link is available yet.
          </div>
        )}
      </div>
    </article>
  );
}
