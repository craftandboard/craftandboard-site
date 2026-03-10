import { getLeadForOrganization, updateLeadForOrganization } from "../leads/adapters/leadRepository.js";
import { canTransitionLeadStatus, normalizeLeadStatusInput } from "../leads/adapters/statusAdapter.js";

export async function syncLeadWonState(input: {
  organizationId: string;
  leadId: string;
  projectId?: string | null;
}) {
  const current = await getLeadForOrganization({
    organizationId: input.organizationId,
    leadLookup: input.leadId
  });

  if (!current) {
    return { skipped: true, lead: null };
  }

  const nextStatus = normalizeLeadStatusInput("won");
  if (!canTransitionLeadStatus(current.status, nextStatus)) {
    return {
      skipped: true,
      lead: current
    };
  }

  const lead = await updateLeadForOrganization({
    organizationId: input.organizationId,
    leadId: input.leadId,
    projectId: input.projectId ?? current.project?.id ?? null,
    status: nextStatus,
    stage: "converted"
  });

  return {
    skipped: false,
    lead
  };
}
