export type StorefrontOrderIssueType =
  | "SHIPPING_DAMAGE"
  | "MISSING_PARTS_OR_HARDWARE"
  | "WRONG_ITEM_RECEIVED"
  | "FINISH_OR_QUALITY_ISSUE"
  | "DELIVERY_PROBLEM"
  | "RETURN_REQUEST"
  | "GENERAL_ORDER_ISSUE";

export type CustomerSafeOrderIssueStatus =
  | "ISSUE_RECEIVED"
  | "UNDER_REVIEW"
  | "NEEDS_MORE_INFORMATION"
  | "APPROVED_FOR_ACTION"
  | "DECLINED"
  | "RESOLVED";

export type StorefrontOrderIssueInput = {
  issueType: StorefrontOrderIssueType;
  reportedByName: string;
  reportedByEmail: string;
  reportedByPhone?: string | null;
  customerMessage: string;
  issueDetails: {
    damageDescription?: string | null;
    packageConditionDescription?: string | null;
    missingItems?: string | null;
    expectedItemDetails?: string | null;
    receivedItemDetails?: string | null;
    qualityIssueDescription?: string | null;
    deliveryProblemDescription?: string | null;
    returnReason?: string | null;
    generalNotes?: string | null;
    customerAttachmentSummary?: {
      attachmentCount?: number | null;
      note?: string | null;
    } | null;
  };
};

export type CraftBoardOrderIssueHandoff = {
  sourceMetadata: {
    sourceSystem: "Craft & Board";
    sourceChannel: "storefront";
    sourceFlow: "post_delivery_issue_report";
    storefrontOrderAttemptId: string;
    storefrontOrderReference: string;
    publicStatusToken: string;
    handoffVersion: string;
    submittedAt: string;
  };
  customerSnapshot: {
    name: string;
    email: string;
    phone: string | null;
  };
  issueSnapshot: {
    issueType: StorefrontOrderIssueType;
    customerMessage: string;
    issueDetails: StorefrontOrderIssueInput["issueDetails"];
    customerSafeSummary: string;
  };
  storefrontStatusSnapshot: {
    currentOrderStatus: string | null;
    orderStatusLabel: string | null;
  };
};

export type StorefrontCustomerOrderIssueSummary = {
  id: string;
  issueType: StorefrontOrderIssueType;
  issueTypeLabel: string;
  customerSafeStatus: CustomerSafeOrderIssueStatus;
  customerSafeStatusLabel: string;
  customerSafeSummary: string;
  createdAt: string;
  lastUpdatedAt: string;
  resolutionCustomerMessage: string | null;
};
