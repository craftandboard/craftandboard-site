import { createProjectForOrganization } from "../projects/adapters/projectRepository.js";

export async function createProjectFromProposal(input: {
  organizationId: string;
  proposal: {
    id: string;
    title: string | null;
    lead?: { name: string | null } | null;
  };
}) {
  const baseName = input.proposal.title?.trim() || input.proposal.lead?.name?.trim() || `Proposal ${input.proposal.id}`;

  return createProjectForOrganization({
    organizationId: input.organizationId,
    name: baseName,
    status: "planned",
    stage: "converted",
    scopeSummary: `Converted from proposal ${input.proposal.id}`
  });
}
