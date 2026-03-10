const LEAD_STAGE_LABELS: Record<string, string> = {
  lead_new: "New Lead",
  jobwalk_scheduled: "Job Walk Scheduled",
  jobwalk_complete: "Job Walk Complete",
  estimate_sent: "Estimate Sent",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
  archived: "Archived"
};

const LEAD_STATUS_ORDER = [
  "lead_new",
  "jobwalk_scheduled",
  "jobwalk_complete",
  "estimate_sent",
  "proposal_sent",
  "won",
  "lost",
  "archived"
] as const;

type LeadStatusValue = (typeof LEAD_STATUS_ORDER)[number];

const LEAD_TRANSITIONS: Record<LeadStatusValue, ReadonlyArray<LeadStatusValue>> = {
  lead_new: ["jobwalk_scheduled", "lost", "archived"],
  jobwalk_scheduled: ["jobwalk_complete", "lost", "archived"],
  jobwalk_complete: ["estimate_sent", "lost", "archived"],
  estimate_sent: ["proposal_sent", "lost", "archived"],
  proposal_sent: ["won", "lost", "archived"],
  won: ["archived"],
  lost: ["archived"],
  archived: []
};

export function normalizeLeadStatusInput(rawStatus: string) {
  return rawStatus.trim().toLowerCase();
}

export function isKnownLeadStatus(rawStatus: string) {
  return LEAD_STATUS_ORDER.includes(normalizeLeadStatusInput(rawStatus) as LeadStatusValue);
}

export function canTransitionLeadStatus(fromStatus: string | null, toStatus: string) {
  const normalizedTo = normalizeLeadStatusInput(toStatus) as LeadStatusValue;

  if (!isKnownLeadStatus(normalizedTo)) {
    return false;
  }

  const normalizedFrom = normalizeLeadStatusInput(fromStatus ?? "");
  if (!normalizedFrom) {
    return normalizedTo === "lead_new";
  }
  if (normalizedFrom === normalizedTo) {
    return true;
  }
  if (!isKnownLeadStatus(normalizedFrom)) {
    return false;
  }

  return LEAD_TRANSITIONS[normalizedFrom as LeadStatusValue].includes(normalizedTo);
}

export function translateLeadStatus(rawStatus: string | null) {
  const normalized = (rawStatus ?? "").trim().toLowerCase();

  if (!normalized) {
    return {
      rawStatus,
      stageKey: "unknown",
      stageLabel: "Unknown",
      isClosed: false
    };
  }

  if (normalized === "won" || normalized === "lost" || normalized === "archived") {
    return {
      rawStatus,
      stageKey: normalized,
      stageLabel: LEAD_STAGE_LABELS[normalized] ?? normalized,
      isClosed: true
    };
  }

  if (normalized.startsWith("jobwalk")) {
    return {
      rawStatus,
      stageKey: "jobwalk",
      stageLabel: LEAD_STAGE_LABELS[normalized] ?? "Job Walk",
      isClosed: false
    };
  }

  if (normalized.startsWith("estimate")) {
    return {
      rawStatus,
      stageKey: "estimate",
      stageLabel: LEAD_STAGE_LABELS[normalized] ?? "Estimate",
      isClosed: false
    };
  }

  if (normalized.startsWith("proposal")) {
    return {
      rawStatus,
      stageKey: "proposal",
      stageLabel: LEAD_STAGE_LABELS[normalized] ?? "Proposal",
      isClosed: false
    };
  }

  return {
    rawStatus,
    stageKey: normalized,
    stageLabel: LEAD_STAGE_LABELS[normalized] ?? normalized.replace(/_/g, " "),
    isClosed: false
  };
}
