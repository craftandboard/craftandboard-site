"use client";

import { CopyLinkButton } from "./copy-link-button";
import { StatusBadge } from "./status-badge";
import { formatDateTime, getIntakeStatusLabel, humanizeToken } from "../lib/mvp";
import type { ProposalAcceptanceIntakeItem } from "../lib/api";

export function AcceptanceLinkStatusCard({
  latestIntake,
  recentIntakes,
  latestLink,
  isPending,
  onCreate,
  onReissue
}: {
  latestIntake: ProposalAcceptanceIntakeItem | null;
  recentIntakes: ProposalAcceptanceIntakeItem[];
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
  const activeLinkReady = Boolean(latestLink && latestIntake?.status === "OPEN");
  const activeButUnshareable = Boolean(latestIntake?.status === "OPEN" && !latestLink);
  const completionState = Boolean(
    latestIntake?.status === "SUBMITTED" || latestIntake?.status === "HANDOFF_ACCEPTED"
  );

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
            {activeLinkReady
              ? "Active link ready to share"
              : activeButUnshareable
                ? "Needs new link"
                : completionState
                  ? "Public confirmation already received"
                  : latestIntake
                    ? getIntakeStatusLabel(latestIntake.status)
                    : "Create an acceptance link so the tester can open the public review flow."}
          </p>
          <p className="mt-2 text-sm text-slate-300">
            {activeLinkReady
              ? "Share the current link below with the contractor tester."
              : activeButUnshareable
                ? "A historical active intake exists, but the token is not stored in plain text anymore. Issue a fresh link before sharing again."
                : completionState
                  ? "No further public action is required unless you intentionally want to issue a fresh link for another review cycle."
                  : latestIntake
                    ? "Use the action below if the latest link can no longer be used."
                    : "A new public review link has not been issued yet."}
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
          {activeLinkReady && latestLink ? <CopyLinkButton value={latestLink} /> : null}
        </div>

        {latestLink ? (
          <div className="rounded-2xl border border-white/10 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Latest Share Link</p>
            <p className="mt-2 break-all text-sm text-white">{latestLink}</p>
            {!activeLinkReady ? (
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

        {recentIntakes.length ? (
          <div className="rounded-2xl border border-white/10 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recent Link History</p>
            <div className="mt-3 space-y-3">
              {recentIntakes.slice(0, 3).map((intake, index) => (
                <div key={intake.id} className="rounded-2xl border border-white/10 px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={intake.status} label={getIntakeStatusLabel(intake.status)} />
                      {index === 0 ? (
                        <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                          Latest
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                          Historical
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{formatDateTime(intake.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
