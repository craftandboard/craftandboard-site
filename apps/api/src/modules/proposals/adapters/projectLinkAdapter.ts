export function mapLinkedProject(project: {
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

export function mapLinkedLead(lead: {
  id: string;
  name: string;
  status: string | null;
  stage: string | null;
} | null) {
  if (!lead) {
    return null;
  }

  return {
    id: lead.id,
    name: lead.name,
    status: lead.status,
    stage: lead.stage
  };
}

