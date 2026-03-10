import {
  getProposalForOrganization,
  updateProposalForOrganization
} from "../proposals/adapters/proposalRepository.js";
import {
  canTransitionProposalStatus,
  normalizeProposalStatusInput
} from "../proposals/adapters/statusAdapter.js";

export async function syncProposalStatus(input: {
  organizationId: string;
  proposalId: string;
  nextStatus: "accepted" | "rejected" | "archived";
  projectId?: string | null;
}) {
  const current = await getProposalForOrganization({
    organizationId: input.organizationId,
    proposalLookup: input.proposalId
  });

  if (!current) {
    throw new Error("Proposal not found.");
  }

  const normalizedStatus = normalizeProposalStatusInput(input.nextStatus);
  if (!canTransitionProposalStatus(current.status, normalizedStatus)) {
    return { skipped: true, proposal: current };
  }

  const updated = await updateProposalForOrganization({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    status: normalizedStatus,
    ...(input.projectId !== undefined ? { projectId: input.projectId } : {})
  });

  return {
    skipped: false,
    proposal: updated
  };
}
