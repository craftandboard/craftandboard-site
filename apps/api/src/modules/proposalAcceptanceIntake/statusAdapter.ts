const INTAKE_STATUSES = [
  "OPEN",
  "SUBMITTED",
  "VERIFIED",
  "HANDOFF_ACCEPTED",
  "HANDOFF_REJECTED",
  "EXPIRED",
  "REVOKED",
  "FAILED"
] as const;

type IntakeStatusValue = (typeof INTAKE_STATUSES)[number];

const INTAKE_TRANSITIONS: Record<IntakeStatusValue, ReadonlyArray<IntakeStatusValue>> = {
  OPEN: ["SUBMITTED", "EXPIRED", "REVOKED"],
  SUBMITTED: ["VERIFIED", "FAILED"],
  VERIFIED: ["HANDOFF_ACCEPTED", "HANDOFF_REJECTED", "FAILED"],
  HANDOFF_ACCEPTED: [],
  HANDOFF_REJECTED: [],
  EXPIRED: [],
  REVOKED: [],
  FAILED: []
};

export function isKnownIntakeStatus(rawStatus: string) {
  return INTAKE_STATUSES.includes(rawStatus.trim().toUpperCase() as IntakeStatusValue);
}

export function normalizeIntakeStatus(rawStatus: string) {
  return rawStatus.trim().toUpperCase();
}

export function canTransitionIntakeStatus(fromStatus: string, toStatus: string) {
  const normalizedFrom = normalizeIntakeStatus(fromStatus) as IntakeStatusValue;
  const normalizedTo = normalizeIntakeStatus(toStatus) as IntakeStatusValue;

  if (!isKnownIntakeStatus(normalizedFrom) || !isKnownIntakeStatus(normalizedTo)) {
    return false;
  }

  if (normalizedFrom === normalizedTo) {
    return true;
  }

  return INTAKE_TRANSITIONS[normalizedFrom].includes(normalizedTo);
}

export function isTerminalIntakeStatus(status: string) {
  const normalized = normalizeIntakeStatus(status);
  return ["HANDOFF_ACCEPTED", "HANDOFF_REJECTED", "EXPIRED", "REVOKED", "FAILED"].includes(normalized);
}
