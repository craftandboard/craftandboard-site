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

export function applyChannelMappingPreset(input: {
  preset?: {
    id: string;
    name: string;
    channelCode: string;
    productLabelFormat?: string | null;
    skuFormat?: string | null;
    includeWarningNotes?: boolean;
    includeOverrideNotes?: boolean;
    dimensionsFormat?: string | null;
    materialFormat?: string | null;
    packagingFormat?: string | null;
    pricingFormat?: string | null;
    fieldOrderingSnapshot?: Record<string, unknown> | null;
    notes?: string | null;
  } | null;
  marketplaceFields: Record<string, unknown>;
  warningSnapshot?: WarningItem[] | null;
  overrideSnapshot?: Record<string, unknown> | null;
}) {
  const preset = input.preset ?? null;
  if (!preset) {
    return {
      ...(input.marketplaceFields ?? {}),
      channelPresetLabel: null,
      channelCode: null
    };
  }

  const templated = applyMarketplaceMappingTemplate({
    mappingTemplate: {
      id: preset.id,
      name: preset.name,
      productLabelFormat: preset.productLabelFormat ?? null,
      skuFormat: preset.skuFormat ?? null,
      includeWarningNotes: preset.includeWarningNotes ?? true,
      includeOverrideNotes: preset.includeOverrideNotes ?? true,
      dimensionsFormat: preset.dimensionsFormat ?? null,
      materialFormat: preset.materialFormat ?? null,
      packagingFormat: preset.packagingFormat ?? null,
      pricingFormat: preset.pricingFormat ?? null,
      notes: preset.notes ?? null,
      templateSnapshot: preset.fieldOrderingSnapshot ?? null
    },
    marketplaceFields: input.marketplaceFields,
    warningSnapshot: input.warningSnapshot,
    overrideSnapshot: input.overrideSnapshot
  });

  return {
    ...templated,
    channelPresetLabel: preset.name,
    channelCode: preset.channelCode,
    fieldOrderingSnapshot: preset.fieldOrderingSnapshot ?? null
  };
}

export function buildLaunchContextSnapshot(input: {
  channelCode?: string | null;
  launchStrategy?: string | null;
  listingReadinessStatus?: string | null;
  readyForListingPrepStatus?: string | null;
  overrideApproved?: boolean;
  feePresetLabel?: string | null;
  shippingZoneLabel?: string | null;
}) {
  return {
    channelCode: input.channelCode ?? "AMAZON_MANUAL",
    launchStrategy: input.launchStrategy ?? null,
    listingReadinessStatus: input.listingReadinessStatus ?? null,
    readyForListingPrepStatus: input.readyForListingPrepStatus ?? null,
    overrideApproved: Boolean(input.overrideApproved),
    feePresetLabel: input.feePresetLabel ?? null,
    shippingZoneLabel: input.shippingZoneLabel ?? null
  };
}

export function selectBestDefaultChannelPreset(input: {
  presets: Array<{
    id: string;
    name: string;
    channelCode: string;
    status?: string | null;
    defaultForChannel?: boolean | null;
    defaultLaunchStrategies?: unknown;
    priority?: number | null;
    autoApplyEnabled?: boolean | null;
  }>;
  launchContext: {
    channelCode?: string | null;
    launchStrategy?: string | null;
  };
}) {
  const channelCode = input.launchContext.channelCode ?? "AMAZON_MANUAL";
  const launchStrategy = input.launchContext.launchStrategy ?? null;
  const eligible = (input.presets ?? []).filter((preset) => {
    if (preset.channelCode !== channelCode) return false;
    if (preset.status && preset.status !== "ACTIVE") return false;
    if (!preset.autoApplyEnabled && !preset.defaultForChannel) return false;
    if (!Array.isArray(preset.defaultLaunchStrategies)) return true;
    if (!launchStrategy) return true;
    return preset.defaultLaunchStrategies.includes(launchStrategy);
  });

  const sorted = [...eligible].sort((left, right) => {
    const leftDefault = left.defaultForChannel ? 1 : 0;
    const rightDefault = right.defaultForChannel ? 1 : 0;
    if (leftDefault !== rightDefault) return rightDefault - leftDefault;
    const leftPriority = left.priority ?? 0;
    const rightPriority = right.priority ?? 0;
    if (leftPriority !== rightPriority) return rightPriority - leftPriority;
    return left.name.localeCompare(right.name);
  });

  return sorted[0] ?? null;
}

export function buildPresetSelectionSummary(input: {
  preset?: {
    id: string;
    name: string;
    channelCode: string;
    defaultForChannel?: boolean | null;
    priority?: number | null;
    autoApplyEnabled?: boolean | null;
  } | null;
  launchContext: Record<string, unknown>;
  autoApplied?: boolean;
  manualReason?: string | null;
}) {
  const autoApplied = Boolean(input.autoApplied);
  return {
    presetId: input.preset?.id ?? null,
    presetLabel: input.preset?.name ?? null,
    channelCode: input.preset?.channelCode ?? input.launchContext.channelCode ?? "AMAZON_MANUAL",
    autoApplied,
    launchContext: input.launchContext,
    summary: input.preset
      ? autoApplied
        ? `Preset "${input.preset.name}" was auto-applied from launch context.`
        : `Preset "${input.preset.name}" was selected manually.`
      : "No channel preset is applied.",
    selectionReason: autoApplied
      ? "Matched channel and launch-context defaults."
      : input.manualReason ?? null,
    priority: input.preset?.priority ?? null,
    defaultForChannel: Boolean(input.preset?.defaultForChannel),
    autoApplyEnabled: Boolean(input.preset?.autoApplyEnabled)
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

export function buildApprovalHistorySnapshot(input: {
  existingHistory?: Array<Record<string, unknown>> | null;
  nextAction?: "APPROVED" | "APPROVED_WITH_OVERRIDE" | "MARKED_REVIEW" | "BLOCKED" | "ARCHIVED" | "PRESET_APPLIED" | null;
  actorMembershipId?: string | null;
  reason?: string | null;
  details?: Record<string, unknown> | null;
  createdAt?: string | Date | null;
}) {
  const history = Array.isArray(input.existingHistory) ? [...input.existingHistory] : [];
  if (!input.nextAction) {
    return {
      latest: history[0] ?? null,
      history
    };
  }

  const nextEntry = {
    action: input.nextAction,
    actorMembershipId: input.actorMembershipId ?? null,
    reason: input.reason ?? null,
    details: input.details ?? null,
    createdAt:
      input.createdAt instanceof Date
        ? input.createdAt.toISOString()
        : (input.createdAt as string | null | undefined) ?? new Date().toISOString()
  };

  const deduped = history.filter((entry) => {
    return !(
      entry.action === nextEntry.action &&
      entry.reason === nextEntry.reason &&
      JSON.stringify(entry.details ?? null) === JSON.stringify(nextEntry.details ?? null)
    );
  });

  const combined = [nextEntry, ...deduped].slice(0, 10);
  return {
    latest: nextEntry,
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

export function calculateApprovalState(input: {
  readyForListingPrepSummary?: Record<string, unknown> | null;
  overrideSnapshot?: Record<string, unknown> | null;
  manualAmazonExportSnapshot?: Record<string, unknown> | null;
  explicitApproval?: boolean;
}) {
  const readyStatus = String(input.readyForListingPrepSummary?.readyForListingPrepStatus ?? "NEEDS_REVIEW");
  const blockingReasons = Array.isArray(input.readyForListingPrepSummary?.blockingReasons)
    ? (input.readyForListingPrepSummary?.blockingReasons as string[])
    : [];
  const overrideApproved = Boolean(input.overrideSnapshot?.overrideApproved);
  const hasExport = Boolean(input.manualAmazonExportSnapshot && Object.keys(input.manualAmazonExportSnapshot).length > 0);

  if (blockingReasons.length > 0 || readyStatus === "BLOCKED") {
    return {
      approvalState: "BLOCKED",
      approvalWarnings: blockingReasons,
      approvalBlockingReasons: blockingReasons
    };
  }

  if (!hasExport || readyStatus === "NEEDS_REVIEW") {
    return {
      approvalState: "READY_FOR_REVIEW",
      approvalWarnings: ["Package still needs review before approval."],
      approvalBlockingReasons: []
    };
  }

  if (!input.explicitApproval) {
    return {
      approvalState: "READY_FOR_REVIEW",
      approvalWarnings: overrideApproved
        ? ["Package is ready for internal approval with an override review attached."]
        : ["Package is ready for internal approval."],
      approvalBlockingReasons: []
    };
  }

  if (overrideApproved || readyStatus === "READY_WITH_OVERRIDE") {
    return {
      approvalState: "APPROVED_WITH_OVERRIDE",
      approvalWarnings: ["Package was approved with a price-floor override."],
      approvalBlockingReasons: []
    };
  }

  return {
    approvalState: "APPROVED",
    approvalWarnings: [],
    approvalBlockingReasons: []
  };
}

export function buildApprovalSummarySnapshot(input: {
  approvalState: string;
  readyForListingPrepSummary?: Record<string, unknown> | null;
  overrideSnapshot?: Record<string, unknown> | null;
  approvedAt?: string | Date | null;
  approvedByMembershipId?: string | null;
}) {
  return {
    approvalState: input.approvalState,
    approvalWarnings:
      input.approvalState === "APPROVED_WITH_OVERRIDE"
        ? ["Approved with a reviewed price-floor override."]
        : input.approvalState === "READY_FOR_REVIEW"
          ? ["Package still requires review before approval."]
          : [],
    approvalBlockingReasons: Array.isArray(input.readyForListingPrepSummary?.blockingReasons)
      ? input.readyForListingPrepSummary?.blockingReasons
      : [],
    overrideSummary: input.overrideSnapshot ?? null,
    approvedAt:
      input.approvedAt instanceof Date
        ? input.approvedAt.toISOString()
        : (input.approvedAt as string | null | undefined) ?? null,
    approvedByMembershipId: input.approvedByMembershipId ?? null,
    summary:
      input.approvalState === "APPROVED"
        ? "Package is approved for manual listing prep."
        : input.approvalState === "APPROVED_WITH_OVERRIDE"
          ? "Package is approved for manual listing prep with an override."
          : input.approvalState === "BLOCKED"
            ? "Package is blocked and cannot be approved yet."
            : "Package is not approved yet."
  };
}

export function buildManualAmazonExportSnapshot(input: {
  packageId: string;
  comparisonSetId?: string | null;
  scenarioId: string;
  approvalState: string;
  exportContractVersion?: string | null;
  exportShapeSnapshot?: Record<string, unknown> | null;
  readyForListingPrepSummary?: Record<string, unknown> | null;
  overrideSnapshot?: Record<string, unknown> | null;
  channelPreset?: { id: string; name: string; channelCode: string } | null;
  approvedAt?: string | Date | null;
}) {
  const snapshot = input.exportShapeSnapshot ?? {};
  return {
    exportContractVersion: input.exportContractVersion ?? "manual-amazon-v1",
    packageId: input.packageId,
    selectedScenarioId: input.scenarioId,
    comparisonSetId: input.comparisonSetId ?? null,
    approvalState: input.approvalState,
    channelPresetLabel: input.channelPreset?.name ?? null,
    channelCode: input.channelPreset?.channelCode ?? "AMAZON_MANUAL",
    productLabel: snapshot.productLabel ?? null,
    internalSku: snapshot.internalSku ?? null,
    dimensionsSummary: snapshot.dimensionsSummary ?? null,
    materialSummary: snapshot.materialSummary ?? null,
    edgeBandSummary: snapshot.edgeBandSummary ?? null,
    packagingSummary: snapshot.packagingSummary ?? null,
    shippingSummary: snapshot.shippingSummary ?? null,
    launchStrategyLabel: snapshot.launchStrategyLabel ?? null,
    feePresetLabel: snapshot.feePresetLabel ?? null,
    shippingZoneLabel: snapshot.shippingZoneLabel ?? null,
    recommendedLaunchPrice: snapshot.pricingSummary ?? null,
    warningSummary: snapshot.warningsSummary ?? [],
    overrideSummary: input.overrideSnapshot ?? null,
    readinessSummary: input.readyForListingPrepSummary ?? null,
    assumptionsSnapshot: snapshot.assumptionsSnapshot ?? null,
    resultSnapshot: snapshot.resultSnapshot ?? null,
    generatedAt: new Date().toISOString(),
    approvedAt:
      input.approvedAt instanceof Date
        ? input.approvedAt.toISOString()
        : (input.approvedAt as string | null | undefined) ?? null
  };
}

export function buildManualListingWorksheet(input: {
  worksheetVersion?: string | null;
  packageId: string;
  packageApprovalState: string;
  currentApprovedArtifact: boolean;
  selectedScenarioId: string;
  selectedScenarioName?: string | null;
  exportShapeSnapshot?: Record<string, unknown> | null;
  approvalSummarySnapshot?: Record<string, unknown> | null;
  readyForListingPrepSummary?: Record<string, unknown> | null;
  overrideSummary?: Record<string, unknown> | null;
  presetSelectionSummary?: Record<string, unknown> | null;
  approvedAt?: string | Date | null;
}) {
  const snapshot = input.exportShapeSnapshot ?? {};
  const marketplaceFieldSnapshot =
    (snapshot.marketplaceFieldSnapshot as Record<string, unknown> | null | undefined) ?? null;
  return {
    worksheetVersion: input.worksheetVersion ?? "manual-listing-v1",
    packageId: input.packageId,
    packageApprovalState: input.packageApprovalState,
    currentApprovedArtifact: input.currentApprovedArtifact,
    selectedScenarioId: input.selectedScenarioId,
    selectedScenarioName: input.selectedScenarioName ?? null,
    productLabel: snapshot.productLabel ?? null,
    internalSku: snapshot.internalSku ?? null,
    dimensionsSummary: snapshot.dimensionsSummary ?? null,
    thicknessSummary: snapshot.thicknessSummary ?? null,
    materialSummary: snapshot.materialSummary ?? null,
    edgeBandSummary: snapshot.edgeBandSummary ?? null,
    packagingSummary: snapshot.packagingSummary ?? null,
    shippingSummary: snapshot.shippingSummary ?? null,
    channelPresetLabel: snapshot.channelPresetLabel ?? null,
    launchStrategyLabel: snapshot.launchStrategyLabel ?? null,
    feePresetLabel: snapshot.feePresetLabel ?? null,
    shippingZoneLabel: snapshot.shippingZoneLabel ?? null,
    recommendedLaunchPrice: snapshot.pricingSummary ?? null,
    minimumPrice: marketplaceFieldSnapshot?.minimumPrice ?? null,
    saferMarginPrice: marketplaceFieldSnapshot?.saferMarginPrice ?? null,
    warningSummary: snapshot.warningsSummary ?? [],
    overrideSummary: input.overrideSummary ?? null,
    readinessSummary: input.readyForListingPrepSummary ?? null,
    approvalSummary: input.approvalSummarySnapshot ?? null,
    presetSelectionSummary: input.presetSelectionSummary ?? null,
    manualReviewPrompts: [
      "Confirm title and SKU before manual listing entry.",
      "Review warnings and override notes before publishing."
    ],
    assumptionsSnapshot: snapshot.assumptionsSnapshot ?? null,
    resultSnapshot: snapshot.resultSnapshot ?? null,
    generatedAt: new Date().toISOString(),
    approvedAt:
      input.approvedAt instanceof Date
        ? input.approvedAt.toISOString()
        : (input.approvedAt as string | null | undefined) ?? null
  };
}

function buildChecklistItems(fields: string[], readiness: Record<string, unknown>) {
  const perField = (readiness.perFieldReadiness ?? {}) as Record<string, boolean>;
  return fields.map((field) => ({
    field,
    ready: Boolean(perField[field])
  }));
}

export function buildOperatorFieldChecklist(input: {
  validationSnapshot?: Record<string, unknown> | null;
  readyForListingPrepSummary?: Record<string, unknown> | null;
  preset?: {
    requiredFieldChecklistSnapshot?: Record<string, unknown> | null;
    optionalFieldChecklistSnapshot?: Record<string, unknown> | null;
    worksheetPromptSnapshot?: Record<string, unknown> | null;
  } | null;
}) {
  const validation = input.validationSnapshot ?? {};
  const requiredFields = Array.isArray(input.preset?.requiredFieldChecklistSnapshot?.fields)
    ? (input.preset?.requiredFieldChecklistSnapshot?.fields as string[])
    : [
        "productLabel",
        "dimensionSummary",
        "materialSummary",
        "edgeBandSummary",
        "packagingSummary",
        "pricingSummary"
      ];
  const optionalFields = Array.isArray(input.preset?.optionalFieldChecklistSnapshot?.fields)
    ? (input.preset?.optionalFieldChecklistSnapshot?.fields as string[])
    : ["sku", "shippingSummary", "feePresetLabel", "shippingZoneLabel", "launchStrategyLabel"];
  const requiredChecklist = buildChecklistItems(requiredFields, validation);
  const optionalChecklist = buildChecklistItems(optionalFields, validation);
  const requiredMissing = requiredChecklist.filter((item) => !item.ready).map((item) => item.field);
  const optionalIncomplete = optionalChecklist.filter((item) => !item.ready).map((item) => item.field);
  const manualReviewPrompts = Array.isArray(input.preset?.worksheetPromptSnapshot?.prompts)
    ? (input.preset?.worksheetPromptSnapshot?.prompts as string[])
    : [
        "Confirm the product label matches the shelf variant you want to list.",
        "Confirm packaging and shipping notes before manual Amazon entry.",
        "Review warnings and override notes before treating this package as final."
      ];

  return {
    requiredChecklist,
    optionalChecklist,
    requiredCompleteFields: requiredChecklist.filter((item) => item.ready).map((item) => item.field),
    requiredMissingFields: requiredMissing,
    optionalIncompleteFields: optionalIncomplete,
    manualReviewPrompts,
    readinessSummary:
      requiredMissing.length === 0
        ? "Required listing-prep fields are complete."
        : `Required fields still missing: ${requiredMissing.join(", ")}.`,
    blockingReasons: Array.isArray(input.readyForListingPrepSummary?.blockingReasons)
      ? (input.readyForListingPrepSummary?.blockingReasons as string[])
      : [],
    reviewReasons: Array.isArray(input.readyForListingPrepSummary?.reviewReasons)
      ? (input.readyForListingPrepSummary?.reviewReasons as string[])
      : []
  };
}

export function buildChannelHandoffSummary(input: {
  preset?: {
    id: string;
    name: string;
    channelCode: string;
    worksheetFieldOrderingSnapshot?: Record<string, unknown> | null;
    worksheetPromptSnapshot?: Record<string, unknown> | null;
    requiredFieldChecklistSnapshot?: Record<string, unknown> | null;
    optionalFieldChecklistSnapshot?: Record<string, unknown> | null;
    notes?: string | null;
  } | null;
  selectionSummary?: Record<string, unknown> | null;
}) {
  return {
    channelCode: input.preset?.channelCode ?? "AMAZON_MANUAL",
    presetLabel: input.preset?.name ?? null,
    autoApplied: Boolean(input.selectionSummary?.autoApplied),
    selectionReason:
      typeof input.selectionSummary?.selectionReason === "string"
        ? String(input.selectionSummary.selectionReason)
        : null,
    groupingOrder:
      input.preset?.worksheetFieldOrderingSnapshot ??
      ({
        groups: ["header", "specs", "pricing", "fulfillment", "warnings", "checklist", "prompts"]
      } as Record<string, unknown>),
    operatorPrompts:
      input.preset?.worksheetPromptSnapshot ??
      ({
        prompts: [
          "Use this worksheet as the manual Amazon listing prep source.",
          "Resolve warnings before copying final values into Amazon."
        ]
      } as Record<string, unknown>),
    requiredFieldChecklist:
      input.preset?.requiredFieldChecklistSnapshot ??
      ({ fields: ["productLabel", "dimensionSummary", "materialSummary", "pricingSummary"] } as Record<string, unknown>),
    optionalFieldChecklist:
      input.preset?.optionalFieldChecklistSnapshot ??
      ({ fields: ["sku", "shippingSummary", "feePresetLabel", "shippingZoneLabel"] } as Record<string, unknown>),
    notes: input.preset?.notes ?? null,
    summary: input.preset
      ? `Channel handoff uses preset "${input.preset.name}" for ${input.preset.channelCode}.`
      : "No channel-specific handoff preset is applied."
  };
}

export function buildCurrentApprovedArtifactSummary(input: {
  packageId: string;
  name?: string | null;
  approvalState: string;
  currentApprovedArtifact: boolean;
  exportVersion?: string | null;
  exportContractVersion?: string | null;
  worksheetVersion?: string | null;
  operatorWorksheetVersion?: string | null;
  approvedAt?: string | Date | null;
  overrideSnapshot?: Record<string, unknown> | null;
}) {
  return {
    packageId: input.packageId,
    packageName: input.name ?? null,
    currentApprovedArtifact: input.currentApprovedArtifact,
    approvalState: input.approvalState,
    hasOverride: Boolean(input.overrideSnapshot?.overrideApproved),
    exportVersion: input.exportVersion ?? null,
    exportContractVersion: input.exportContractVersion ?? null,
    worksheetVersion: input.worksheetVersion ?? null,
    operatorWorksheetVersion: input.operatorWorksheetVersion ?? null,
    approvedAt:
      input.approvedAt instanceof Date
        ? input.approvedAt.toISOString()
        : (input.approvedAt as string | null | undefined) ?? null,
    summary: input.currentApprovedArtifact
      ? "This is the current approved artifact to use for manual listing prep."
      : "This package is a historical or in-progress artifact, not the current approved one."
  };
}

export function buildOperatorWorksheetPackage(input: {
  operatorWorksheetVersion?: string | null;
  packageId: string;
  packageName?: string | null;
  packageApprovalState: string;
  currentApprovedArtifact: boolean;
  selectedScenarioId: string;
  selectedScenarioName?: string | null;
  exportShapeSnapshot?: Record<string, unknown> | null;
  manualListingWorksheetSnapshot?: Record<string, unknown> | null;
  checklistSnapshot?: Record<string, unknown> | null;
  channelHandoffSummary?: Record<string, unknown> | null;
  currentApprovedArtifactSummary?: Record<string, unknown> | null;
  approvedAt?: string | Date | null;
}) {
  const snapshot = input.manualListingWorksheetSnapshot ?? {};
  return {
    operatorWorksheetVersion: input.operatorWorksheetVersion ?? "operator-listing-v1",
    headerSummary: {
      packageName: input.packageName ?? null,
      scenarioName: input.selectedScenarioName ?? null,
      approvalState: input.packageApprovalState,
      currentApprovedArtifact: input.currentApprovedArtifact
    },
    packageIdentitySummary: {
      packageId: input.packageId,
      selectedScenarioId: input.selectedScenarioId,
      selectedScenarioName: input.selectedScenarioName ?? null
    },
    approvalExportStatusSummary: {
      approvalState: input.packageApprovalState,
      worksheetVersion: snapshot.worksheetVersion ?? null,
      exportVersion: input.exportShapeSnapshot?.exportMetadata
        ? (input.exportShapeSnapshot.exportMetadata as Record<string, unknown>).exportVersion ?? null
        : null,
      approvedAt:
        input.approvedAt instanceof Date
          ? input.approvedAt.toISOString()
          : (input.approvedAt as string | null | undefined) ?? null
    },
    pricingBlock: {
      recommendedLaunchPrice: snapshot.recommendedLaunchPrice ?? null,
      minimumPrice: snapshot.minimumPrice ?? null,
      saferMarginPrice: snapshot.saferMarginPrice ?? null
    },
    specBlock: {
      productLabel: snapshot.productLabel ?? null,
      internalSku: snapshot.internalSku ?? null,
      dimensionsSummary: snapshot.dimensionsSummary ?? null,
      thicknessSummary: snapshot.thicknessSummary ?? null,
      materialSummary: snapshot.materialSummary ?? null,
      edgeBandSummary: snapshot.edgeBandSummary ?? null
    },
    fulfillmentBlock: {
      packagingSummary: snapshot.packagingSummary ?? null,
      shippingSummary: snapshot.shippingSummary ?? null,
      feePresetLabel: snapshot.feePresetLabel ?? null,
      shippingZoneLabel: snapshot.shippingZoneLabel ?? null
    },
    warningOverrideBlock: {
      warnings: snapshot.warningSummary ?? [],
      overrideSummary: snapshot.overrideSummary ?? null,
      readinessSummary: snapshot.readinessSummary ?? null
    },
    fieldChecklist: input.checklistSnapshot ?? null,
    manualEntryPrompts:
      (input.checklistSnapshot?.manualReviewPrompts as unknown[]) ??
      (input.channelHandoffSummary?.operatorPrompts as Record<string, unknown> | undefined)?.prompts ??
      [],
    channelHandoffNotes: input.channelHandoffSummary ?? null,
    currentApprovedArtifactSummary: input.currentApprovedArtifactSummary ?? null,
    generatedAt: new Date().toISOString()
  };
}

export function buildWorksheetSummarySnapshot(input: {
  worksheet?: Record<string, unknown> | null;
  presetSelectionSummary?: Record<string, unknown> | null;
}) {
  return {
    worksheetVersion: input.worksheet?.worksheetVersion ?? null,
    productLabel: input.worksheet?.productLabel ?? null,
    channelPresetLabel: input.worksheet?.channelPresetLabel ?? null,
    approvalState: input.worksheet?.packageApprovalState ?? null,
    manualReviewPrompts: input.worksheet?.manualReviewPrompts ?? [],
    presetSelectionSummary: input.presetSelectionSummary ?? null,
    summary:
      typeof input.worksheet?.productLabel === "string"
        ? `Worksheet prepared for ${String(input.worksheet.productLabel)}.`
        : "Worksheet prepared for manual listing prep."
  };
}
