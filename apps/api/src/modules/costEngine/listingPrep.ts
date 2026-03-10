import type { ListingPrepPackageStatus, ListingReadinessStatus } from "./contracts.js";

type FieldFlags = Record<string, boolean>;

function isBlank(value: unknown) {
  return value === null || value === undefined || String(value).trim() === "";
}

export function buildMarketplaceFieldValidationResult(input: {
  listingReadinessStatus: ListingReadinessStatus;
  marketplaceFields: Record<string, unknown>;
  strongerAlerts: { warnings: Array<{ code: string; severity: "BLOCKING" | "WARNING"; message: string }> };
  overrideApproved?: boolean;
}): {
  validationStatus: "VALID" | "INVALID" | "REVIEW_NEEDED";
  missingFields: string[];
  weakFields: string[];
  readyFields: string[];
  perFieldReadiness: FieldFlags;
  validationSummary: string;
} {
  const fields = input.marketplaceFields;
  const missingFields: string[] = [];
  const weakFields: string[] = [];
  const readyFields: string[] = [];

  const checks: FieldFlags = {
    productLabel: !isBlank(fields.productLabel),
    sku: !isBlank(fields.sku),
    dimensionSummary: !isBlank(fields.dimensionSummary),
    materialSummary: !isBlank(fields.materialSummary),
    edgeBandSummary: !isBlank(fields.edgeBandSummary),
    packagingSummary: !isBlank(fields.packagingSummary),
    shippingSummary: !isBlank(fields.shippingSummary),
    feePresetLabel: !isBlank(fields.feePresetLabel),
    shippingZoneLabel: !isBlank(fields.shippingZoneLabel),
    launchStrategyLabel: !isBlank(fields.launchStrategyLabel)
  };

  for (const [key, value] of Object.entries(checks)) {
    if (value) {
      readyFields.push(key);
    } else if (key === "sku" || key === "shippingZoneLabel") {
      weakFields.push(key);
    } else {
      missingFields.push(key);
    }
  }

  const blockingWarnings = input.strongerAlerts.warnings.filter((warning) => warning.severity === "BLOCKING");
  const validationStatus: "VALID" | "INVALID" | "REVIEW_NEEDED" =
    input.listingReadinessStatus === "BLOCKED" || (blockingWarnings.length > 0 && !input.overrideApproved)
      ? "INVALID"
      : missingFields.length > 0 || weakFields.length > 0
        ? "REVIEW_NEEDED"
        : "VALID";

  return {
    validationStatus,
    missingFields,
    weakFields,
    readyFields,
    perFieldReadiness: checks,
    validationSummary:
      validationStatus === "VALID"
        ? "Marketplace-prep fields are complete enough for internal listing handoff."
        : validationStatus === "INVALID"
          ? "Marketplace-prep fields are still blocked by missing required fields or unreviewed pricing alerts."
          : "Marketplace-prep fields are close, but still need review before final handoff."
  };
}

export function buildPriceFloorOverrideSnapshot(input: {
  strongerAlerts: { warnings: Array<{ code: string; severity: "BLOCKING" | "WARNING"; message: string }> };
  reason?: string | null;
  approved?: boolean;
  approvedByMembershipId?: string | null;
}) {
  const blockingWarnings = input.strongerAlerts.warnings.filter((warning) => warning.severity === "BLOCKING");
  return {
    overrideRequested: Boolean(input.reason && blockingWarnings.length > 0),
    overrideApproved: Boolean(input.approved),
    overrideReason: input.reason ?? null,
    approvedByMembershipId: input.approvedByMembershipId ?? null,
    blockingWarningCodes: blockingWarnings.map((warning) => warning.code),
    summary:
      blockingWarnings.length === 0
        ? "No price-floor override is needed."
        : input.approved
          ? "Blocking price-floor warnings were reviewed and approved as an intentional override."
          : input.reason
            ? "Price-floor override was requested and is awaiting approval."
            : "Blocking price-floor warnings still require an explicit override reason."
  };
}

export function calculateListingPrepPackageStatus(input: {
  listingReadinessStatus: ListingReadinessStatus;
  validationStatus: "VALID" | "INVALID" | "REVIEW_NEEDED";
  overrideSnapshot: { overrideRequested: boolean; overrideApproved: boolean };
}) {
  let packageStatus: ListingPrepPackageStatus = "READY_FOR_REVIEW";
  let packageReadinessLabel: "READY" | "READY_WITH_OVERRIDE" | "BLOCKED" = "READY";

  if (input.listingReadinessStatus === "BLOCKED" && !input.overrideSnapshot.overrideApproved) {
    packageStatus = "BLOCKED";
    packageReadinessLabel = "BLOCKED";
  } else if (input.validationStatus === "INVALID") {
    packageStatus = "BLOCKED";
    packageReadinessLabel = "BLOCKED";
  } else if (input.overrideSnapshot.overrideApproved) {
    packageStatus = "READY";
    packageReadinessLabel = "READY_WITH_OVERRIDE";
  } else if (input.validationStatus === "VALID" && input.listingReadinessStatus === "READY") {
    packageStatus = "READY";
    packageReadinessLabel = "READY";
  }

  return {
    packageStatus,
    packageReadinessLabel
  };
}
