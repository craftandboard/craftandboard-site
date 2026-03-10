import {
  acceptProposal,
  ProposalOrchestrationConflictError
} from "../proposalOrchestration/service.js";

export async function handoffToProposalOrchestrator(input: {
  organizationId: string;
  proposalId: string;
  actorMembershipId?: string | null;
  decisionSource: "MANUAL_EXTERNAL" | "PROVIDER_CONFIRMED";
  note?: string | null;
  metadata?: unknown;
}) {
  try {
    const result = await acceptProposal({
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      membershipId: input.actorMembershipId ?? null,
      decisionSource: input.decisionSource,
      note: input.note,
      metadata: input.metadata
    });

    return {
      accepted: true,
      skipped: result.acceptance.status === "ACCEPTED",
      acceptance: result.acceptance
    };
  } catch (error) {
    if (error instanceof ProposalOrchestrationConflictError) {
      return {
        accepted: false,
        skipped: false,
        reason: error.message
      };
    }

    throw error;
  }
}
