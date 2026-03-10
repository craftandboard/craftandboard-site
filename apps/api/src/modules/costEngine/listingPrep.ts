import type { ListingPrepPackageStatus, ListingReadinessStatus } from "./contracts.js";

type FieldFlags = Record<string, boolean>;
type WarningItem = { code: string; severity: "BLOCKING" | "WARNING"; message: string };

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

export function applyMarketplaceMappingTemplate(input: {
  mappingTemplate?: {
    id: string;
    name: string;
    productLabelFormat?: string | null;
    skuFormat?: string | null;
    includeWarningNotes?: boolean;
    includeOverrideNotes?: boolean;
    dimensionsFormat?: string | null;
    materialFormat?: string | null;
    packagingFormat?: string | null;
    pricingFormat?: string | null;
    notes?: string | null;
    templateSnapshot?: Record<string, unknown> | null;
  } | null;
  marketplaceFields: Record<string, unknown>;
  warningSnapshot?: WarningItem[] | null;
  overrideSnapshot?: Record<string, unknown> | null;
}) {
  const template = input.mappingTemplate ?? null;
  const fields = { ...input.marketplaceFields };
  const warningNotes =
    template?.includeWarningNotes === false
      ? null
      : (input.warningSnapshot ?? []).map((warning) => warning.message).join(" | ") || null;
  const overrideNotes =
    template?.includeOverrideNotes === false
      ? null
      : typeof input.overrideSnapshot?.summary === "string"
        ? String(input.overrideSnapshot.summary)
        : null;

  return {
    ...fields,
    productLabel:
      typeof template?.productLabelFormat === "string" && !isBlank(fields.productLabel)
        ? template.productLabelFormat.replace("{productLabel}", String(fields.productLabel))
        : fields.productLabel ?? null,
    sku:
      typeof template?.skuFormat === "string" && !isBlank(fields.sku)
        ? template.skuFormat.replace("{sku}", String(fields.sku))
        : fields.sku ?? null,
    dimensionSummary:
      template?.dimensionsFormat && !isBlank(fields.dimensionSummary)
        ? template.dimensionsFormat.replace("{dimensionSummary}", String(fields.dimensionSummary))
        : fields.dimensionSummary ?? null,
    materialSummary:
      template?.materialFormat && !isBlank(fields.materialSummary)
        ? template.materialFormat.replace("{materialSummary}", String(fields.materialSummary))
        : fields.materialSummary ?? null,
    packagingSummary:
      template?.packagingFormat && !isBlank(fields.packagingSummary)
        ? template.packagingFormat.replace("{packagingSummary}", String(fields.packagingSummary))
        : fields.packagingSummary ?? null,
    pricingSummary:
      template?.pricingFormat && !isBlank(fields.pricingSummary)
        ? template.pricingFormat.replace("{pricingSummary}", String(fields.pricingSummary))
        : fields.pricingSummary ?? null,
    mappingTemplateLabel: template?.name ?? null,
    mappingTemplateNotes: template?.notes ?? null,
    warningNotes,
    overrideNotes
  };
}

export function buildOverrideHistorySnapshot(input: {
  existingHistory?: Array<Record<string, unknown>> | null;
  latestOverride?: Record<string, unknown> | null;
  approvedAt?: string | Date | null;
  approvedByMembershipId?: string | null;
}) {
  const history = Array.isArray(input.existingHistory) ? [...input.existingHistory] : [];
  const latest = input.latestOverride ?? null;

  if (!latest) {
    return {
      activeOverride: null,
      latestOverride: null,
      history
    };
  }

  const nextEntry = {
    overrideRequested: Boolean(latest.overrideRequested),
    overrideApproved: Boolean(latest.overrideApproved),
    overrideReason: latest.overrideReason ?? null,
    summary: latest.summary ?? null,
    approvedAt:
      input.approvedAt instanceof Date
        ? input.approvedAt.toISOString()
        : (input.approvedAt as string | null | undefined) ?? null,
    approvedByMembershipId: input.approvedByMembershipId ?? (latest.approvedByMembershipId as string | null) ?? null,
    blockingWarningCodes: Array.isArray(latest.blockingWarningCodes) ? latest.blockingWarningCodes : []
  };

  const deduped = history.filter((entry) => {
    return !(
      entry.overrideReason === nextEntry.overrideReason &&
      entry.overrideApproved === nextEntry.overrideApproved &&
      entry.summary === nextEntry.summary
    );
  });

  const combined = [nextEntry, ...deduped].slice(0, 5);

  return {
    activeOverride: nextEntry.overrideApproved || nextEntry.overrideRequested ? nextEntry : null,
    latestOverride: nextEntry,
    history: combined
  };
}

export function buildExportMetadataBlock(input: {
  exportVersion?: string | null;
  packageId?: string | null;
  mappingTemplate?: { id: string; name: string } | null;
}) {
  return {
    exportVersion: input.exportVersion ?? "listing-prep-v1",
    generatedAt: new Date().toISOString(),
    packageId: input.packageId ?? null,
    mappingTemplateId: input.mappingTemplate?.id ?? null,
    mappingTemplateLabel: input.mappingTemplate?.name ?? null
  };
}

export function calculateReadyForListingPrep(input: {
  listingReadinessStatus: ListingReadinessStatus;
  validationSnapshot: {
    validationStatus: "VALID" | "INVALID" | "REVIEW_NEEDED";
    missingFields?: string[];
    weakFields?: string[];
  };
  packageStatus: { packageStatus: ListingPrepPackageStatus; packageReadinessLabel: "READY" | "READY_WITH_OVERRIDE" | "BLOCKED" };
  strongerAlerts: { warnings: WarningItem[] };
  overrideSnapshot?: { overrideApproved?: boolean; summary?: string | null } | null;
  exportShapeSnapshot?: Record<string, unknown> | null;
  mappingTemplate?: { id: string; name: string } | null;
}) {
  const blockingReasons: string[] = [];
  const reviewReasons: string[] = [];
  const blockingWarnings = (input.strongerAlerts.warnings ?? []).filter((warning) => warning.severity === "BLOCKING");

  if (input.listingReadinessStatus === "BLOCKED") {
    blockingReasons.push("Listing readiness is still blocked.");
  }
  if (input.validationSnapshot.validationStatus === "INVALID") {
    blockingReasons.push("Required marketplace-prep fields are still missing or unresolved.");
  }
  if (blockingWarnings.length > 0 && !input.overrideSnapshot?.overrideApproved) {
    blockingReasons.push("Blocking floor-price alerts still require an approved override.");
  }
  if (!input.exportShapeSnapshot || isBlank(input.exportShapeSnapshot.productLabel)) {
    blockingReasons.push("Stable export shape is incomplete.");
  }

  if (input.validationSnapshot.validationStatus === "REVIEW_NEEDED") {
    reviewReasons.push("Marketplace-prep fields still need review.");
  }
  if ((input.validationSnapshot.weakFields ?? []).length > 0) {
    reviewReasons.push("Some marketplace-prep fields are weak but not fully missing.");
  }
  if (!input.mappingTemplate) {
    reviewReasons.push("No marketplace mapping template is applied yet.");
  }
  if (input.packageStatus.packageReadinessLabel === "READY_WITH_OVERRIDE") {
    reviewReasons.push("Package is ready only because a floor-price override was approved.");
  }

  const readyForListingPrep = blockingReasons.length === 0 && reviewReasons.length === 0;
  const readyForListingPrepStatus =
    blockingReasons.length > 0
      ? "BLOCKED"
      : input.packageStatus.packageReadinessLabel === "READY_WITH_OVERRIDE"
        ? "READY_WITH_OVERRIDE"
        : reviewReasons.length > 0
          ? "NEEDS_REVIEW"
          : "READY";

  return {
    readyForListingPrep,
    readyForListingPrepStatus,
    blockingReasons,
    reviewReasons,
    summary:
      readyForListingPrepStatus === "READY"
        ? "Package is clean enough to hand off for internal listing prep."
        : readyForListingPrepStatus === "READY_WITH_OVERRIDE"
          ? "Package can move forward, but only with an approved floor-price override."
          : readyForListingPrepStatus === "BLOCKED"
            ? "Package is not ready for listing prep until blocking issues are resolved."
            : "Package is close, but still needs review before listing handoff."
  };
}

export function buildStableListingPrepExportShape(input: {
  packageId?: string | null;
  comparisonSetId?: string | null;
  scenarioId: string;
  scenarioName: string;
  listingReadinessStatus: ListingReadinessStatus;
  packageStatus: ListingPrepPackageStatus;
  mappedMarketplaceFields: Record<string, unknown>;
  exportSnapshot?: Record<string, unknown> | null;
  warningSnapshot?: WarningItem[] | null;
  overrideSnapshot?: Record<string, unknown> | null;
  overrideHistorySnapshot?: Record<string, unknown> | null;
  readyForListingPrepSummary?: Record<string, unknown> | null;
  mappingTemplate?: { id: string; name: string } | null;
  exportVersion?: string | null;
}) {
  return {
    packageId: input.packageId ?? null,
    packageStatus: input.packageStatus,
    listingReadinessStatus: input.listingReadinessStatus,
    selectedScenarioId: input.scenarioId,
    comparisonSetId: input.comparisonSetId ?? null,
    scenarioName: input.scenarioName,
    productLabel: input.mappedMarketplaceFields.productLabel ?? null,
    internalSku: input.mappedMarketplaceFields.sku ?? null,
    dimensionsSummary: input.mappedMarketplaceFields.dimensionSummary ?? null,
    thicknessSummary: input.mappedMarketplaceFields.thicknessSummary ?? null,
    materialSummary: input.mappedMarketplaceFields.materialSummary ?? null,
    edgeBandSummary: input.mappedMarketplaceFields.edgeBandSummary ?? null,
    packagingSummary: input.mappedMarketplaceFields.packagingSummary ?? null,
    shippingSummary: input.mappedMarketplaceFields.shippingSummary ?? null,
    pricingSummary: input.mappedMarketplaceFields.pricingSummary ?? null,
    feePresetLabel: input.mappedMarketplaceFields.feePresetLabel ?? null,
    shippingZoneLabel: input.mappedMarketplaceFields.shippingZoneLabel ?? null,
    launchStrategyLabel: input.mappedMarketplaceFields.launchStrategyLabel ?? null,
    warningsSummary: input.warningSnapshot ?? [],
    overrideSummary: input.overrideSnapshot ?? null,
    overrideHistorySummary: input.overrideHistorySnapshot ?? null,
    mappingTemplateLabel: input.mappingTemplate?.name ?? null,
    assumptionsSnapshot: input.exportSnapshot?.assumptionsSnapshot ?? null,
    resultSnapshot: input.exportSnapshot?.resultSnapshot ?? null,
    marketplaceFieldSnapshot: input.mappedMarketplaceFields,
    exportMetadata: buildExportMetadataBlock({
      exportVersion: input.exportVersion,
      packageId: input.packageId,
      mappingTemplate: input.mappingTemplate ?? null
    }),
    readyForListingPrepSummary: input.readyForListingPrepSummary ?? null,
    generatedAt: new Date().toISOString()
  };
}
