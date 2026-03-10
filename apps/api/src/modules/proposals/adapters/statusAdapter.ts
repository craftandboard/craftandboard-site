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

