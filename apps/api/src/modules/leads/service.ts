import { getLeadForOrganization, listLeadsForOrganization } from "./adapters/leadRepository.js";
import { translateLeadStatus } from "./adapters/statusAdapter.js";

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

