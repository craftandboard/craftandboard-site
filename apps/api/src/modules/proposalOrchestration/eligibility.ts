import { getProposalPaymentSummaryView } from "../payments/service.js";
import type { ProposalEligibilityView } from "./contracts.js";

type ProposalBundle = {
  id: string;
  status: string | null;
  depositPolicy: "NO_DEPOSIT_REQUIRED" | "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
  project: { id: string } | null;
  acceptance: { id: string; status: string } | null;
  conversion: { id: string; status: string; projectId: string | null } | null;
  lead: { id: string } | null;
};

export async function evaluateProposalConversionEligibility(input: {
  organizationId: string;
  proposal: ProposalBundle;
}) {
  const reasons: string[] = [];
  const requiredActions: string[] = [];

  if (input.proposal.status && ["rejected", "archived"].includes(input.proposal.status.trim().toLowerCase())) {
    reasons.push("proposal_state_blocked");
  }

  if (!input.proposal.acceptance || input.proposal.acceptance.status !== "ACCEPTED") {
    reasons.push("acceptance_required");
    requiredActions.push("accept_proposal");
  }

  const paymentSummary = await getProposalPaymentSummaryView({
    organizationId: input.organizationId,
    proposalId: input.proposal.id
  });

  if (
    input.proposal.depositPolicy === "DEPOSIT_REQUIRED_BEFORE_CONVERSION" &&
    paymentSummary.summary.depositRequestedAmountCents > paymentSummary.summary.depositPaidAmountCents
  ) {
    reasons.push("deposit_not_satisfied");
    requiredActions.push("collect_required_deposit");
  }

  if (input.proposal.conversion?.status === "CONVERTED" || input.proposal.project?.id || input.proposal.conversion?.projectId) {
    reasons.push("already_converted");
  }

  const eligible = reasons.length === 0;

  const snapshot = {
    proposalId: input.proposal.id,
    proposalStatus: input.proposal.status,
    acceptanceStatus: input.proposal.acceptance?.status ?? null,
    depositPolicy: input.proposal.depositPolicy,
    paymentSummary: paymentSummary.summary,
    existingProjectId: input.proposal.project?.id ?? input.proposal.conversion?.projectId ?? null,
    existingConversionStatus: input.proposal.conversion?.status ?? null,
    hasLead: Boolean(input.proposal.lead?.id)
  };

  return {
    eligible,
    reasons,
    requiredActions,
    snapshot
  } satisfies ProposalEligibilityView;
}
