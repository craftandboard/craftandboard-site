export function translateProposalStatus(rawStatus: string | null) {
  const normalized = (rawStatus ?? "").trim().toLowerCase();

  if (!normalized) {
    return {
      rawStatus,
      canonicalStatus: "unknown",
      statusLabel: "Unknown",
      isFinal: false
    };
  }

  if (["accepted", "rejected", "archived"].includes(normalized)) {
    return {
      rawStatus,
      canonicalStatus: normalized,
      statusLabel: normalized.charAt(0).toUpperCase() + normalized.slice(1),
      isFinal: true
    };
  }

  if (normalized === "sent") {
    return {
      rawStatus,
      canonicalStatus: "sent",
      statusLabel: "Sent",
      isFinal: false
    };
  }

  if (normalized === "draft") {
    return {
      rawStatus,
      canonicalStatus: "draft",
      statusLabel: "Draft",
      isFinal: false
    };
  }

  return {
    rawStatus,
    canonicalStatus: normalized,
    statusLabel: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    isFinal: false
  };
}

const PROPOSAL_STATUS_ORDER = ["draft", "sent", "accepted", "rejected", "archived"] as const;
type ProposalStatusValue = (typeof PROPOSAL_STATUS_ORDER)[number];

const PROPOSAL_TRANSITIONS: Record<ProposalStatusValue, ReadonlyArray<ProposalStatusValue>> = {
  draft: ["sent", "archived"],
  sent: ["accepted", "rejected", "archived"],
  accepted: ["archived"],
  rejected: ["archived"],
  archived: []
};

export function normalizeProposalStatusInput(rawStatus: string) {
  return rawStatus.trim().toLowerCase();
}

export function isKnownProposalStatus(rawStatus: string) {
  return PROPOSAL_STATUS_ORDER.includes(normalizeProposalStatusInput(rawStatus) as ProposalStatusValue);
}

export function canTransitionProposalStatus(fromStatus: string | null, toStatus: string) {
  const normalizedTo = normalizeProposalStatusInput(toStatus) as ProposalStatusValue;

  if (!isKnownProposalStatus(normalizedTo)) {
    return false;
  }

  const normalizedFrom = normalizeProposalStatusInput(fromStatus ?? "");
  if (!normalizedFrom) {
    return normalizedTo === "draft";
  }
  if (normalizedFrom === normalizedTo) {
    return true;
  }
  if (!isKnownProposalStatus(normalizedFrom)) {
    return false;
  }

  return PROPOSAL_TRANSITIONS[normalizedFrom as ProposalStatusValue].includes(normalizedTo);
}
