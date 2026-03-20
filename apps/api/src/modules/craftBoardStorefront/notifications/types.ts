import type { CraftBoardCustomerOrderStatus } from "../status/types.js";

export type StorefrontNotificationEventCode =
  | "ORDER_PAYMENT_RECEIVED"
  | "ORDER_CONFIRMATION_READY"
  | "ORDER_STATUS_UPDATED"
  | "ORDER_SHIPPED"
  | "ORDER_NEEDS_ATTENTION"
  | "ORDER_CHANGE_REQUEST_RECEIVED"
  | "ORDER_CHANGE_REQUEST_UPDATED"
  | "ORDER_CHANGE_REQUEST_RESOLVED"
  | "ORDER_ISSUE_REPORTED"
  | "ORDER_ISSUE_UPDATED"
  | "ORDER_ISSUE_RESOLVED";

export type StorefrontNotificationSendResult = {
  sendAccepted: boolean;
  provider: string;
  providerMessageId: string | null;
  sendReference: string | null;
  warnings: string[];
  errorCode: string | null;
  errorMessage: string | null;
};

export type StorefrontEmailPayload = {
  toEmail: string;
  subject: string;
  html: string;
  text: string;
};

export type StorefrontOrderEmailSummary = {
  productDisplayName: string;
  summaryLines: string[];
};

export type StorefrontConfirmationEmailPayload = {
  customerName: string;
  orderReference: string;
  paidAt: string;
  amountPaidCents: number | null;
  statusUrl: string;
  productSummary: StorefrontOrderEmailSummary;
  commercialSummary: {
    subtotalAmountCents: number;
    shippingAmountCents: number;
    taxAmountCents: number;
    totalAmountCents: number;
  };
  supportContact: string;
};

export type StorefrontStatusUpdateEmailPayload = {
  customerName: string;
  orderReference: string;
  statusCode: CraftBoardCustomerOrderStatus;
  statusLabel: string;
  statusDescription: string;
  statusUrl: string;
  productSummary: StorefrontOrderEmailSummary;
  supportContact: string;
};

export type StorefrontChangeRequestEmailPayload = {
  customerName: string;
  orderReference: string;
  requestTypeLabel: string;
  requestSummary: string;
  requestStatusLabel: string;
  statusUrl: string;
  supportContact: string;
};

export type StorefrontOrderIssueEmailPayload = {
  customerName: string;
  orderReference: string;
  issueTypeLabel: string;
  issueSummary: string;
  issueStatusLabel: string;
  statusUrl: string;
  supportContact: string;
};
