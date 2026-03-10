"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getConversion,
  getLeads,
  getPilotFeedback,
  getProposalAcceptance,
  getProposalPaymentSummary,
  getProjects,
  getProposals,
  listAcceptanceIntakes,
  type LeadListItem,
  type PilotFeedbackItem,
  type ProjectListItem,
  type ProposalAcceptanceIntakeItem,
  type ProposalAcceptanceItem,
  type ProposalConversionItem,
  type ProposalEligibility,
  type ProposalListItem,
  type ProposalPaymentSummary
} from "../lib/api";
import {
  getConversionStatusLabel,
  getIntakeStatusLabel,
  getPilotNextActionLabel,
  getPilotWorkflowStatusLabel,
  isAcceptanceCompleted,
  needsNewAcceptanceLink
} from "../lib/mvp";
import { PilotBlockersList } from "./pilot-blockers-list";
import { PilotFeedbackList } from "./pilot-feedback-list";
import { PilotSummaryCards } from "./pilot-summary-cards";
import { PilotWorkflowTable, type PilotWorkflowRow } from "./pilot-workflow-table";

type ProposalOpsDetail = {
  proposalId: string;
  acceptance: ProposalAcceptanceItem | null;
  intakes: ProposalAcceptanceIntakeItem[];
  paymentSummary: ProposalPaymentSummary | null;
  conversion: ProposalConversionItem | null;
};

export function PilotOpsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [feedback, setFeedback] = useState<PilotFeedbackItem[]>([]);
  const [proposalOps, setProposalOps] = useState<Record<string, ProposalOpsDetail>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsPayload, proposalsPayload, projectsPayload, feedbackPayload] = await Promise.all([
        getLeads(),
        getProposals(),
        getProjects(),
        getPilotFeedback()
      ]);

      const nextLeads = leadsPayload?.leads ?? [];
      const nextProposals = proposalsPayload?.proposals ?? [];
      const nextProjects = projectsPayload?.projects ?? [];
      const nextFeedback = feedbackPayload?.feedback ?? [];

      const proposalDetailEntries = await Promise.all(
        nextProposals.map(async (proposal) => {
          const [acceptancePayload, intakesPayload, paymentSummaryPayload, conversionPayload] = await Promise.all([
            getProposalAcceptance(proposal.id),
            listAcceptanceIntakes(proposal.id),
            getProposalPaymentSummary(proposal.id),
            getConversion(proposal.id)
          ]);

          return [
            proposal.id,
            {
              proposalId: proposal.id,
              acceptance: acceptancePayload?.acceptance ?? null,
              intakes: intakesPayload?.intakes ?? [],
              paymentSummary: paymentSummaryPayload?.summary ?? null,
              conversion: conversionPayload?.conversion ?? null
            } satisfies ProposalOpsDetail
          ] as const;
        })
      );

      setLeads(nextLeads);
      setProposals(nextProposals);
      setProjects(nextProjects);
      setFeedback(nextFeedback);
      setProposalOps(Object.fromEntries(proposalDetailEntries));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load pilot operations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const workflowRows = useMemo(() => {
    return leads.map((lead) => {
      const linkedProposals = proposals
        .filter((proposal) => proposal.lead?.id === lead.id)
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
      const proposal = linkedProposals[0] ?? null;
      const project =
        (proposal?.project?.id ? projects.find((entry) => entry.id === proposal.project?.id) : null) ??
        (lead.project?.id ? projects.find((entry) => entry.id === lead.project?.id) : null) ??
        null;
      const ops = proposal ? proposalOps[proposal.id] ?? null : null;
      const latestIntake = ops?.intakes[0] ?? null;
      const acceptanceCompleted = isAcceptanceCompleted(
        ops?.acceptance?.status ?? (latestIntake?.status === "HANDOFF_ACCEPTED" ? "HANDOFF_ACCEPTED" : null)
      );
      const hasActiveLink = latestIntake?.status === "OPEN";
      const linkNeedsReissue = proposal ? needsNewAcceptanceLink(latestIntake?.status) || (hasActiveLink && !proposal.publicToken) : false;
      const depositRequired = proposal?.depositPolicy === "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
      const paymentSummary = ops?.paymentSummary;
      const blockerCount = feedback.filter((item) => {
        const isOpen = item.status !== "RESOLVED";
        const isCritical = item.severity === "BLOCKER" || item.severity === "HIGH";
        const path = item.pagePath ?? "";
        return (
          isOpen &&
          isCritical &&
          (path.includes(lead.id) || (proposal?.id ? path.includes(proposal.id) : false) || (project?.id ? path.includes(project.id) : false))
        );
      }).length;

      const workflowStatus = getPilotWorkflowStatusLabel({
        hasProposal: Boolean(proposal),
        hasActiveLink,
        linkNeedsReissue,
        acceptanceCompleted,
        depositRequired,
        depositOutstandingAmountCents: paymentSummary?.depositRequestedAmountCents
          ? (paymentSummary.depositRequestedAmountCents - paymentSummary.depositPaidAmountCents)
          : 0,
        conversionStatus: ops?.conversion?.status ?? null,
        projectCreated: Boolean(project?.id ?? ops?.conversion?.projectId),
        blockerCount
      });

      const nextAction = getPilotNextActionLabel({
        hasProposal: Boolean(proposal),
        hasActiveLink,
        linkNeedsReissue,
        acceptanceCompleted,
        depositRequired,
        depositRequestedAmountCents: paymentSummary?.depositRequestedAmountCents ?? 0,
        depositOutstandingAmountCents: paymentSummary?.depositRequestedAmountCents
          ? paymentSummary.depositRequestedAmountCents - paymentSummary.depositPaidAmountCents
          : 0,
        conversionStatus: ops?.conversion?.status ?? null,
        projectCreated: Boolean(project?.id ?? ops?.conversion?.projectId),
        blockerCount
      });

      const latestActivityAt = [
        lead.updatedAt,
        proposal?.updatedAt ?? null,
        project?.updatedAt ?? null,
        ops?.acceptance?.updatedAt ?? null,
        ops?.conversion?.updatedAt ?? null
      ]
        .filter(Boolean)
        .sort((left, right) => new Date(right as string).getTime() - new Date(left as string).getTime())[0] as string;

      return {
        leadId: lead.id,
        leadName: lead.name,
        proposalId: proposal?.id ?? null,
        proposalTitle: proposal?.title ?? null,
        projectId: project?.id ?? ops?.conversion?.projectId ?? null,
        projectName: project?.name ?? null,
        workflowStatus,
        nextAction,
        acceptanceStatus: acceptanceCompleted
          ? "Acceptance completed"
          : proposal
            ? hasActiveLink
              ? "Waiting on customer acceptance"
              : linkNeedsReissue
                ? "Needs new acceptance link"
                : "Waiting on acceptance"
            : "Waiting on proposal",
        depositStatus: depositRequired
          ? paymentSummary?.depositRequestedAmountCents
            ? paymentSummary.depositPaidAmountCents >= paymentSummary.depositRequestedAmountCents
              ? "Deposit paid"
              : "Waiting on deposit"
            : "Deposit not requested"
          : "No deposit required",
        conversionStatus: proposal
          ? getConversionStatusLabel(ops?.conversion?.status ?? (project ? "CONVERTED" : null))
          : "Waiting on proposal",
        blockerCount,
        latestActivityAt
      } satisfies PilotWorkflowRow;
    });
  }, [feedback, leads, projects, proposalOps, proposals]);

  const blockerItems = useMemo(
    () =>
      feedback.filter(
        (item) =>
          item.status !== "RESOLVED" && (item.severity === "BLOCKER" || item.severity === "HIGH")
      ),
    [feedback]
  );

  const waitingRows = workflowRows.filter((row) =>
    [
      "Waiting on proposal",
      "Waiting on customer acceptance",
      "Needs new acceptance link",
      "Waiting on deposit",
      "Blocked by pilot issue",
      "Conversion blocked"
    ].includes(row.workflowStatus)
  );
  const readyRows = workflowRows.filter((row) =>
    ["Ready to convert", "Project created", "Ready for next action"].includes(row.workflowStatus)
  );

  const summaryCards = useMemo(
    () => [
      { label: "Pilot Items", value: String(workflowRows.length) },
      { label: "Proposals", value: String(proposals.length) },
      {
        label: "Active Links",
        value: String(
          Object.values(proposalOps).filter((detail) => detail.intakes[0]?.status === "OPEN").length
        )
      },
      {
        label: "Accepted",
        value: String(
          Object.values(proposalOps).filter((detail) => isAcceptanceCompleted(detail.acceptance?.status)).length
        ),
        tone: "success" as const
      },
      {
        label: "Converted",
        value: String(workflowRows.filter((row) => row.workflowStatus === "Project created").length),
        tone: "success" as const
      },
      {
        label: "Open Blockers",
        value: String(blockerItems.filter((item) => item.severity === "BLOCKER").length),
        tone: blockerItems.some((item) => item.severity === "BLOCKER") ? ("danger" as const) : ("neutral" as const)
      },
      {
        label: "High Severity",
        value: String(blockerItems.length),
        tone: blockerItems.length ? ("warning" as const) : ("neutral" as const)
      }
    ],
    [blockerItems, proposalOps, proposals.length, workflowRows]
  );

  const pivotSignal =
    blockerItems.length === 0 &&
    workflowRows.some((row) => row.workflowStatus === "Project created")
      ? "Pilot is stable enough to consider shifting primary build energy toward the Hugo cost calculator."
      : "Keep primary build energy on FieldMetriq pilot blockers until contractor flows are consistently completing.";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">MVP Pilot</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Pilot Ops</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
            Track where each contractor workflow is stuck, what blockers are still open, and whether FieldMetriq is
            stable enough to pause and shift attention toward the Hugo cost calculator.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/pilot-feedback" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">
            Open Feedback
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-emerald-950"
          >
            Refresh Pilot State
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-300/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          Loading pilot operations...
        </div>
      ) : (
        <>
          <PilotSummaryCards items={summaryCards} />

          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Decision Support</p>
            <p className="mt-3 text-sm text-slate-200">{pivotSignal}</p>
          </section>

          <PilotWorkflowTable
            rows={workflowRows}
            title="Active tester workflows"
            emptyState="No lead-driven pilot workflows exist yet."
          />

          <div className="grid gap-6 xl:grid-cols-2">
            <PilotWorkflowTable
              rows={waitingRows}
              title="Waiting on action"
              emptyState="Nothing is waiting on customer acceptance, deposit, or manual recovery right now."
            />
            <PilotWorkflowTable
              rows={readyRows}
              title="Ready for next step"
              emptyState="Nothing is ready for the next step yet."
            />
          </div>

          <PilotBlockersList items={blockerItems} />

          <PilotFeedbackList initialStatus="NEW" initialSeverity="ALL" compact />
        </>
      )}
    </div>
  );
}
