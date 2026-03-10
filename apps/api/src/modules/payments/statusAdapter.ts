const DEPOSIT_REQUEST_STATUSES = ["DRAFT", "REQUESTED", "PARTIALLY_PAID", "PAID", "VOID"] as const;
const PAYMENT_STATUSES = ["PENDING", "SUCCEEDED", "FAILED", "CANCELED", "REFUNDED"] as const;

export type KnownDepositRequestStatus = (typeof DEPOSIT_REQUEST_STATUSES)[number];
export type KnownPaymentStatus = (typeof PAYMENT_STATUSES)[number];

export function normalizeDepositRequestStatusInput(rawStatus: string) {
  return rawStatus.trim().toUpperCase().replace(/\s+/g, "_");
}

export function normalizePaymentStatusInput(rawStatus: string) {
  return rawStatus.trim().toUpperCase().replace(/\s+/g, "_");
}

export function isKnownDepositRequestStatus(status: string): status is KnownDepositRequestStatus {
  return DEPOSIT_REQUEST_STATUSES.includes(status as KnownDepositRequestStatus);
}

export function isKnownPaymentStatus(status: string): status is KnownPaymentStatus {
  return PAYMENT_STATUSES.includes(status as KnownPaymentStatus);
}

export function canTransitionDepositRequestStatus(fromStatus: string, toStatus: string) {
  if (fromStatus === toStatus) {
    return true;
  }

  const transitions: Record<KnownDepositRequestStatus, KnownDepositRequestStatus[]> = {
    DRAFT: ["REQUESTED", "VOID"],
    REQUESTED: ["PARTIALLY_PAID", "PAID", "VOID"],
    PARTIALLY_PAID: ["PAID", "VOID"],
    PAID: [],
    VOID: []
  };

  return (
    isKnownDepositRequestStatus(fromStatus) &&
    isKnownDepositRequestStatus(toStatus) &&
    transitions[fromStatus].includes(toStatus)
  );
}

export function canTransitionPaymentStatus(fromStatus: string, toStatus: string) {
  if (fromStatus === toStatus) {
    return true;
  }

  const transitions: Record<KnownPaymentStatus, KnownPaymentStatus[]> = {
    PENDING: ["SUCCEEDED", "FAILED", "CANCELED"],
    SUCCEEDED: ["REFUNDED"],
    FAILED: [],
    CANCELED: [],
    REFUNDED: []
  };

  return isKnownPaymentStatus(fromStatus) && isKnownPaymentStatus(toStatus) && transitions[fromStatus].includes(toStatus);
}
