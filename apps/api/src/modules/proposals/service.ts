import { decimalToNumber } from "../../utils/decimal.js";
import { mapLinkedLead, mapLinkedProject } from "./adapters/projectLinkAdapter.js";
import {
  createProposalForOrganization,
  createProposalLineForOrganization,
  createProposalSectionForOrganization,
  getProposalForOrganization,
  listProposalsForOrganization,
  updateProposalForOrganization,
  updateProposalLineForOrganization,
  updateProposalSectionForOrganization
} from "./adapters/proposalRepository.js";
import {
  canTransitionProposalStatus,
  isKnownProposalStatus,
  normalizeProposalStatusInput,
  translateProposalStatus
} from "./adapters/statusAdapter.js";

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

function mapProposalSection(section: {
  id: string;
  title: string;
  sortOrder: number;
  lines: Array<{
    id: string;
    name: string;
    description: string | null;
    qty: { toNumber(): number };
    unit: string | null;
    priceCents: number;
    sortOrder: number;
  }>;
}) {
  return {
    id: section.id,
    title: section.title,
    sortOrder: section.sortOrder,
    lines: section.lines.map(mapProposalLine)
  };
}

function mapProposalRow(proposal: Awaited<ReturnType<typeof createProposalForOrganization>>) {
  const translatedStatus = translateProposalStatus(proposal.status);

  return {
    id: proposal.id,
    title: proposal.title,
    publicToken: proposal.publicToken,
    depositPolicy: proposal.depositPolicy,
    rawStatus: proposal.status,
    canonicalStatus: translatedStatus.canonicalStatus,
    statusLabel: translatedStatus.statusLabel,
    isFinal: translatedStatus.isFinal,
    version: proposal.version,
    project: mapLinkedProject(proposal.project),
    lead: mapLinkedLead(proposal.lead),
    sections: proposal.sections.map(mapProposalSection),
    unsectionedLines: proposal.lines.map(mapProposalLine),
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString()
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
        depositPolicy: proposal.depositPolicy,
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
      depositPolicy: proposal.depositPolicy,
      rawStatus: proposal.status,
      canonicalStatus: translatedStatus.canonicalStatus,
      statusLabel: translatedStatus.statusLabel,
      isFinal: translatedStatus.isFinal,
      version: proposal.version,
      project: mapLinkedProject(proposal.project),
      lead: mapLinkedLead(proposal.lead),
      sections: proposal.sections.map((section) => ({
        ...mapProposalSection(section)
      })),
      unsectionedLines: proposal.lines.map(mapProposalLine),
      createdAt: proposal.createdAt.toISOString(),
      updatedAt: proposal.updatedAt.toISOString()
    }
  };
}

export async function createProposal(input: {
  organizationId: string;
  projectId?: string | null;
  leadId?: string | null;
  title?: string | null;
  status?: string | null;
  depositPolicy?: "NO_DEPOSIT_REQUIRED" | "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
  version?: number;
  publicToken?: string | null;
}) {
  const normalizedStatus =
    input.status === undefined || input.status === null ? "draft" : normalizeProposalStatusInput(input.status);

  if (!isKnownProposalStatus(normalizedStatus)) {
    throw new Error("Invalid proposal status.");
  }

  const proposal = await createProposalForOrganization({
    ...input,
    status: normalizedStatus
  });

  return {
    ok: true,
    proposal: mapProposalRow(proposal)
  };
}

export async function updateProposal(input: {
  organizationId: string;
  proposalId: string;
  projectId?: string | null;
  leadId?: string | null;
  title?: string | null;
  status?: string | null;
  depositPolicy?: "NO_DEPOSIT_REQUIRED" | "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
  version?: number;
  publicToken?: string | null;
}) {
  if (input.status !== undefined) {
    const current = await getProposalForOrganization({
      organizationId: input.organizationId,
      proposalLookup: input.proposalId
    });

    if (!current) {
      throw new Error("Proposal not found.");
    }

    const nextStatus = input.status === null ? "" : normalizeProposalStatusInput(input.status);
    if (!nextStatus || !isKnownProposalStatus(nextStatus)) {
      throw new Error("Invalid proposal status.");
    }
    if (!canTransitionProposalStatus(current.status, nextStatus)) {
      throw new Error("Invalid proposal status transition.");
    }
  }

  const proposal = await updateProposalForOrganization({
    ...input,
    status: input.status === undefined || input.status === null ? input.status : normalizeProposalStatusInput(input.status)
  });

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  return {
    ok: true,
    proposal: mapProposalRow(proposal)
  };
}

export async function createProposalSection(input: {
  organizationId: string;
  proposalId: string;
  title: string;
  sortOrder?: number;
}) {
  const section = await createProposalSectionForOrganization(input);

  return {
    ok: true,
    section: {
      id: section.id,
      title: section.title,
      sortOrder: section.sortOrder
    }
  };
}

export async function updateProposalSection(input: {
  organizationId: string;
  proposalId: string;
  sectionId: string;
  title?: string;
  sortOrder?: number;
}) {
  const section = await updateProposalSectionForOrganization(input);

  if (!section) {
    throw new Error("Proposal section not found.");
  }

  return {
    ok: true,
    section: {
      id: section.id,
      title: section.title,
      sortOrder: section.sortOrder
    }
  };
}

export async function createProposalLine(input: {
  organizationId: string;
  proposalId: string;
  sectionId?: string | null;
  name: string;
  description?: string | null;
  qty?: number;
  unit?: string | null;
  priceCents?: number;
  sortOrder?: number;
}) {
  const line = await createProposalLineForOrganization(input);

  return {
    ok: true,
    line: mapProposalLine(line)
  };
}

export async function updateProposalLine(input: {
  organizationId: string;
  proposalId: string;
  lineId: string;
  sectionId?: string | null;
  name?: string;
  description?: string | null;
  qty?: number;
  unit?: string | null;
  priceCents?: number;
  sortOrder?: number;
}) {
  const line = await updateProposalLineForOrganization(input);

  if (!line) {
    throw new Error("Proposal line not found.");
  }

  return {
    ok: true,
    line: mapProposalLine(line)
  };
}
