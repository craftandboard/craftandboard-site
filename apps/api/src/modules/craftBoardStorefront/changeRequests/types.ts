export type StorefrontChangeRequestType =
  | "UPDATE_DIMENSIONS"
  | "UPDATE_MATERIAL_OR_FINISH"
  | "UPDATE_MOUNTING"
  | "UPDATE_SHIPPING_ADDRESS"
  | "HOLD_ORDER"
  | "CANCEL_REQUEST"
  | "GENERAL_CHANGE_REQUEST";

export type CustomerSafeChangeRequestStatus =
  | "REQUEST_RECEIVED"
  | "UNDER_REVIEW"
  | "NEEDS_MORE_INFORMATION"
  | "APPROVED"
  | "DECLINED"
  | "RESOLVED";

export type StorefrontChangeRequestInput = {
  requestType: StorefrontChangeRequestType;
  requestedByName: string;
  requestedByEmail: string;
  requestedByPhone?: string | null;
  customerMessage: string;
  requestedChanges: {
    proposedDimensions?: {
      width?: number | null;
      depth?: number | null;
      thickness?: number | null;
      length?: number | null;
      height?: number | null;
      unit?: "IN" | null;
    } | null;
    requestedMaterialOrFinish?: string | null;
    requestedMounting?: string | null;
    requestedShippingAddress?: {
      fullName: string;
      address1: string;
      address2?: string | null;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    } | null;
    holdReason?: string | null;
    cancelReason?: string | null;
    generalNotes?: string | null;
  };
};

export type CraftBoardChangeRequestHandoff = {
  sourceMetadata: {
    sourceSystem: "Craft & Board";
    sourceChannel: "storefront";
    sourceFlow: "post_purchase_change_request";
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
  requestSnapshot: {
    requestType: StorefrontChangeRequestType;
    customerMessage: string;
    requestedChanges: StorefrontChangeRequestInput["requestedChanges"];
    customerSafeSummary: string;
  };
  storefrontStatusSnapshot: {
    currentOrderStatus: string | null;
    orderStatusLabel: string | null;
  };
};

export type StorefrontCustomerChangeRequestSummary = {
  id: string;
  requestType: StorefrontChangeRequestType;
  requestTypeLabel: string;
  customerSafeStatus: CustomerSafeChangeRequestStatus;
  customerSafeStatusLabel: string;
  customerSafeSummary: string;
  createdAt: string;
  lastUpdatedAt: string;
  resolutionCustomerMessage: string | null;
};
