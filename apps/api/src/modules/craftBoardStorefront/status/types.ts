export type CraftBoardCustomerOrderStatus =
  | "PAYMENT_RECEIVED"
  | "ORDER_RECEIVED"
  | "IN_REVIEW"
  | "IN_PRODUCTION"
  | "PREPARING_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "NEEDS_ATTENTION";

export type CustomerOrderStatusTimelineItem = {
  statusCode: CraftBoardCustomerOrderStatus;
  statusLabel: string;
  description: string;
  occurredAt: string | null;
  isCurrent: boolean;
  isComplete: boolean;
};

export type CustomerOrderStatusPayload = {
  orderReference: string;
  statusTokenSafe: string;
  currentStatus: CraftBoardCustomerOrderStatus;
  currentStatusLabel: string;
  currentStatusDescription: string;
  lastUpdatedAt: string | null;
  orderPlacedAt: string;
  paidAt: string | null;
  amountPaidCents: number | null;
  totalAmountCents: number;
  productSummary: {
    productDisplayName: string;
    summaryLines: string[];
    quantity: number;
  };
  shippingSummary: {
    shippingMode: string | null;
    packagingProfile: string | null;
    carrierName: string | null;
    serviceLevel: string | null;
    estimatedTransitDays: number | null;
    shippingCostCents: number | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    customerMessage: string | null;
  };
  changeRequestEligible: boolean;
  changeRequestMessage: string | null;
  changeRequests: Array<{
    id: string;
    requestType: string;
    requestTypeLabel: string;
    customerSafeStatus: string;
    customerSafeStatusLabel: string;
    customerSafeSummary: string;
    createdAt: string;
    lastUpdatedAt: string;
    resolutionCustomerMessage: string | null;
  }>;
  issueReportEligible: boolean;
  issueReportMessage: string | null;
  issues: Array<{
    id: string;
    issueType: string;
    issueTypeLabel: string;
    customerSafeStatus: string;
    customerSafeStatusLabel: string;
    customerSafeSummary: string;
    createdAt: string;
    lastUpdatedAt: string;
    resolutionCustomerMessage: string | null;
  }>;
  timeline: CustomerOrderStatusTimelineItem[];
  supportMessage: string | null;
};

export type FieldMetriqOrderStatusSnapshot = {
  orderReference: string | null;
  rawStatus: string | null;
  rawPhase: string | null;
  statusLabel: string | null;
  productionStartedAt: string | null;
  preparingToShipAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  lastUpdatedAt: string | null;
  carrierName: string | null;
  serviceLevel: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  needsAttention: boolean;
  customerNotes: string[];
  raw: Record<string, unknown> | null;
};
