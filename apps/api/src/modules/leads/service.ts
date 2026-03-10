import {
  createLeadForOrganization,
  getLeadForOrganization,
  listLeadsForOrganization,
  updateLeadForOrganization
} from "./adapters/leadRepository.js";
import {
  canTransitionLeadStatus,
  isKnownLeadStatus,
  normalizeLeadStatusInput,
  translateLeadStatus
} from "./adapters/statusAdapter.js";

function mapProjectLink(project: {
  id: string;
  key: string | null;
  name: string;
  status: string | null;
  stage: string | null;
} | null) {
  if (!project) {
    return null;
  }

  return {
    id: project.id,
    key: project.key,
    name: project.name,
    status: project.status,
    stage: project.stage
  };
}

export async function listLeadsView(input: {
  organizationId: string;
  query?: string;
}) {
  const leads = await listLeadsForOrganization(input);

  return {
    ok: true,
    leads: leads.map((lead) => {
      const translatedStatus = translateLeadStatus(lead.status);
      return {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        rawStatus: lead.status,
        rawStage: lead.stage,
        stageKey: translatedStatus.stageKey,
        stageLabel: translatedStatus.stageLabel,
        isClosed: translatedStatus.isClosed,
        project: mapProjectLink(lead.project),
        proposalCount: lead.proposals.length,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString()
      };
    })
  };
}

export async function getLeadDetailView(input: {
  organizationId: string;
  leadLookup: string;
}) {
  const lead = await getLeadForOrganization(input);

  if (!lead) {
    throw new Error("Lead not found.");
  }

  const translatedStatus = translateLeadStatus(lead.status);

  return {
    ok: true,
    lead: {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      notes: lead.notes,
      rawStatus: lead.status,
      rawStage: lead.stage,
      stageKey: translatedStatus.stageKey,
      stageLabel: translatedStatus.stageLabel,
      isClosed: translatedStatus.isClosed,
      project: mapProjectLink(lead.project),
      proposals: lead.proposals.map((proposal) => ({
        id: proposal.id,
        title: proposal.title,
        status: proposal.status,
        version: proposal.version,
        publicToken: proposal.publicToken,
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString()
      })),
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString()
    }
  };
}

function mapLeadRow(lead: Awaited<ReturnType<typeof createLeadForOrganization>>) {
  const translatedStatus = translateLeadStatus(lead.status);

  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    address: lead.address,
    notes: lead.notes,
    rawStatus: lead.status,
    rawStage: lead.stage,
    stageKey: translatedStatus.stageKey,
    stageLabel: translatedStatus.stageLabel,
    isClosed: translatedStatus.isClosed,
    project: mapProjectLink(lead.project),
    proposalCount: lead.proposals.length,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString()
  };
}

export async function createLead(input: {
  organizationId: string;
  projectId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: string | null;
  stage?: string | null;
  notes?: string | null;
}) {
  const normalizedStatus =
    input.status === undefined || input.status === null ? "lead_new" : normalizeLeadStatusInput(input.status);

  if (!isKnownLeadStatus(normalizedStatus)) {
    throw new Error("Invalid lead status.");
  }

  const lead = await createLeadForOrganization({
    ...input,
    status: normalizedStatus,
    stage: input.stage ?? null
  });

  return {
    ok: true,
    lead: mapLeadRow(lead)
  };
}

export async function updateLead(input: {
  organizationId: string;
  leadId: string;
  projectId?: string | null;
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: string | null;
  stage?: string | null;
  notes?: string | null;
}) {
  let currentLead = null;
  if (input.status !== undefined) {
    currentLead = await getLeadForOrganization({
      organizationId: input.organizationId,
      leadLookup: input.leadId
    });

    if (!currentLead) {
      throw new Error("Lead not found.");
    }

    const nextStatus = input.status === null ? "" : normalizeLeadStatusInput(input.status);
    if (!nextStatus || !isKnownLeadStatus(nextStatus)) {
      throw new Error("Invalid lead status.");
    }
    if (!canTransitionLeadStatus(currentLead.status, nextStatus)) {
      throw new Error("Invalid lead status transition.");
    }
  }

  const lead = await updateLeadForOrganization({
    ...input,
    status: input.status === undefined || input.status === null ? input.status : normalizeLeadStatusInput(input.status)
  });

  if (!lead) {
    throw new Error("Lead not found.");
  }

  return {
    ok: true,
    lead: mapLeadRow(lead)
  };
}
