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

