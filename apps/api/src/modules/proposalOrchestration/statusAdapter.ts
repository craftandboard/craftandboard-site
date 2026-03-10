const ACCEPTANCE_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "CANCELED"] as const;
const CONVERSION_STATUSES = ["PENDING", "ELIGIBLE", "BLOCKED", "CONVERTED", "FAILED", "CANCELED"] as const;
const DECISION_SOURCES = ["MANUAL_INTERNAL", "MANUAL_EXTERNAL", "PROVIDER_CONFIRMED"] as const;

export type AcceptanceStatus = (typeof ACCEPTANCE_STATUSES)[number];
export type ConversionStatus = (typeof CONVERSION_STATUSES)[number];
export type DecisionSource = (typeof DECISION_SOURCES)[number];

export function normalizeAcceptanceStatus(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "_");
}

export function normalizeConversionStatus(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "_");
}

export function normalizeDecisionSource(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "_");
}

export function isKnownAcceptanceStatus(value: string): value is AcceptanceStatus {
  return ACCEPTANCE_STATUSES.includes(value as AcceptanceStatus);
}

export function isKnownConversionStatus(value: string): value is ConversionStatus {
  return CONVERSION_STATUSES.includes(value as ConversionStatus);
}

export function isKnownDecisionSource(value: string): value is DecisionSource {
  return DECISION_SOURCES.includes(value as DecisionSource);
}

export function canTransitionAcceptanceStatus(fromStatus: string, toStatus: string) {
  if (fromStatus === toStatus) {
    return true;
  }

  const transitions: Record<AcceptanceStatus, AcceptanceStatus[]> = {
    PENDING: ["ACCEPTED", "REJECTED", "CANCELED"],
    ACCEPTED: ["CANCELED"],
    REJECTED: [],
    CANCELED: []
  };

  return (
    isKnownAcceptanceStatus(fromStatus) &&
    isKnownAcceptanceStatus(toStatus) &&
    transitions[fromStatus].includes(toStatus)
  );
}

export function canTransitionConversionStatus(fromStatus: string, toStatus: string) {
  if (fromStatus === toStatus) {
    return true;
  }

  const transitions: Record<ConversionStatus, ConversionStatus[]> = {
    PENDING: ["ELIGIBLE", "BLOCKED", "CANCELED"],
    ELIGIBLE: ["CONVERTED", "FAILED", "CANCELED"],
    BLOCKED: ["ELIGIBLE"],
    CONVERTED: [],
    FAILED: [],
    CANCELED: []
  };

  return (
    isKnownConversionStatus(fromStatus) &&
    isKnownConversionStatus(toStatus) &&
    transitions[fromStatus].includes(toStatus)
  );
}
