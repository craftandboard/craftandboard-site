import { decimalToNumber } from "../../utils/decimal.js";
import { mapLinkedLead, mapLinkedProject } from "./adapters/projectLinkAdapter.js";
import { getProposalForOrganization, listProposalsForOrganization } from "./adapters/proposalRepository.js";
import { translateProposalStatus } from "./adapters/statusAdapter.js";

function mapProposalLine(line: {
  id: string;
  name: string;
  description: string | null;
  qty: { toNumber(): number };
  unit: string | null;
  priceCents: number;
  sortOrder: number;
}) {
  return {
    id: line.id,
    name: line.name,
    description: line.description,
    qty: decimalToNumber(line.qty),
    unit: line.unit,
    priceCents: line.priceCents,
    sortOrder: line.sortOrder
  };
}

export async function listProposalsView(input: {
  organizationId: string;
  query?: string;
}) {
  const proposals = await listProposalsForOrganization(input);

  return {
    ok: true,
    proposals: proposals.map((proposal) => {
      const translatedStatus = translateProposalStatus(proposal.status);

      return {
        id: proposal.id,
        title: proposal.title,
        publicToken: proposal.publicToken,
        rawStatus: proposal.status,
        canonicalStatus: translatedStatus.canonicalStatus,
        statusLabel: translatedStatus.statusLabel,
        isFinal: translatedStatus.isFinal,
        version: proposal.version,
        project: mapLinkedProject(proposal.project),
        lead: mapLinkedLead(proposal.lead),
        sectionCount: proposal.sections.length,
        lineCount: proposal.lines.length,
        totalAmountCents: proposal.lines.reduce((sum, line) => sum + line.priceCents, 0),
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString()
      };
    })
  };
}

export async function getProposalDetailView(input: {
  organizationId: string;
  proposalLookup: string;
}) {
  const proposal = await getProposalForOrganization(input);

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  const translatedStatus = translateProposalStatus(proposal.status);

  return {
    ok: true,
    proposal: {
      id: proposal.id,
      title: proposal.title,
      publicToken: proposal.publicToken,
      rawStatus: proposal.status,
      canonicalStatus: translatedStatus.canonicalStatus,
      statusLabel: translatedStatus.statusLabel,
      isFinal: translatedStatus.isFinal,
      version: proposal.version,
      project: mapLinkedProject(proposal.project),
      lead: mapLinkedLead(proposal.lead),
      sections: proposal.sections.map((section) => ({
        id: section.id,
        title: section.title,
        sortOrder: section.sortOrder,
        lines: section.lines.map(mapProposalLine)
      })),
      unsectionedLines: proposal.lines.map(mapProposalLine),
      createdAt: proposal.createdAt.toISOString(),
      updatedAt: proposal.updatedAt.toISOString()
    }
  };
}

