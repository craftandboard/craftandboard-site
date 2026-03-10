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
    operatorPromptTemplateSnapshot?: Record<string, unknown> | null;
    copyGroupOrderingSnapshot?: Record<string, unknown> | null;
    worksheetSectionLabelSnapshot?: Record<string, unknown> | null;
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

export function buildOperatorPromptSnapshot(input: {
  approvalState: string;
  currentApprovedArtifact: boolean;
  warningSnapshot?: WarningItem[] | null;
  overrideSnapshot?: Record<string, unknown> | null;
  checklistSnapshot?: Record<string, unknown> | null;
  preset?: {
    operatorPromptTemplateSnapshot?: Record<string, unknown> | null;
  } | null;
}) {
  const requiredMissing = Array.isArray(input.checklistSnapshot?.requiredMissingFields)
    ? (input.checklistSnapshot?.requiredMissingFields as string[])
    : [];
  const warnings = input.warningSnapshot ?? [];
  const criticalPrompts = [
    ...(requiredMissing.length ? [`Resolve required fields first: ${requiredMissing.join(", ")}.`] : []),
    ...(warnings.some((warning) => warning.severity === "BLOCKING")
      ? ["A blocking pricing or readiness warning still needs attention before final manual entry."]
      : []),
    ...(Boolean(input.overrideSnapshot?.overrideApproved)
      ? ["This package is usable, but only because an override was approved. Double-check the floor-price rationale."]
      : [])
  ];
  const reviewPrompts = Array.isArray(input.preset?.operatorPromptTemplateSnapshot?.reviewPrompts)
    ? (input.preset?.operatorPromptTemplateSnapshot?.reviewPrompts as string[])
    : [
        "Confirm title, dimensions, and material against the product variant being listed.",
        "Check shipping and packaging summaries before copying values into Amazon."
      ];
  const completionPrompts = Array.isArray(input.preset?.operatorPromptTemplateSnapshot?.completionPrompts)
    ? (input.preset?.operatorPromptTemplateSnapshot?.completionPrompts as string[])
    : [
        "Use the current approved artifact only.",
        "After manual entry, re-check warnings and override notes once before treating the listing as final."
      ];

  return {
    criticalPrompts,
    reviewPrompts,
    completionPrompts,
    summary:
      input.approvalState === "APPROVED" || input.approvalState === "APPROVED_WITH_OVERRIDE"
        ? "Operator prompts are ready for manual listing work."
        : "Operator prompts highlight what still needs review before using this package."
  };
}

export function buildCopyExportSnapshot(input: {
  packageId: string;
  exportShapeSnapshot?: Record<string, unknown> | null;
  operatorWorksheetSnapshot?: Record<string, unknown> | null;
  checklistSnapshot?: Record<string, unknown> | null;
  promptSnapshot?: Record<string, unknown> | null;
  preset?: {
    copyGroupOrderingSnapshot?: Record<string, unknown> | null;
    worksheetSectionLabelSnapshot?: Record<string, unknown> | null;
  } | null;
}) {
  const exportShape = input.exportShapeSnapshot ?? {};
  const ordering =
    (input.preset?.copyGroupOrderingSnapshot as Record<string, unknown> | null) ??
    ({ groups: ["identity", "specs", "fulfillment", "pricing", "warnings", "checklist", "prompts"] } as Record<string, unknown>);
  const labels =
    (input.preset?.worksheetSectionLabelSnapshot as Record<string, unknown> | null) ??
    ({
      identity: "Package identity",
      specs: "Product, dimensions, and material",
      fulfillment: "Packaging and shipping",
      pricing: "Pricing",
      warnings: "Warnings and overrides",
      checklist: "Checklist",
      prompts: "Operator prompts"
    } as Record<string, unknown>);

  return {
    packageId: input.packageId,
    groupOrdering: ordering,
    labels,
    groups: {
      identity: {
        label: labels.identity ?? "Package identity",
        value: {
          productLabel: exportShape.productLabel ?? null,
          internalSku: exportShape.internalSku ?? null,
          scenarioName: exportShape.scenarioName ?? null
        }
      },
      specs: {
        label: labels.specs ?? "Product, dimensions, and material",
        value: {
          dimensionsSummary: exportShape.dimensionsSummary ?? null,
          thicknessSummary: exportShape.thicknessSummary ?? null,
          materialSummary: exportShape.materialSummary ?? null,
          edgeBandSummary: exportShape.edgeBandSummary ?? null
        }
      },
      fulfillment: {
        label: labels.fulfillment ?? "Packaging and shipping",
        value: {
          packagingSummary: exportShape.packagingSummary ?? null,
          shippingSummary: exportShape.shippingSummary ?? null,
          feePresetLabel: exportShape.feePresetLabel ?? null,
          shippingZoneLabel: exportShape.shippingZoneLabel ?? null
        }
      },
      pricing: {
        label: labels.pricing ?? "Pricing",
        value: {
          pricingSummary: exportShape.pricingSummary ?? null
        }
      },
      warnings: {
        label: labels.warnings ?? "Warnings and overrides",
        value: {
          warnings: exportShape.warningsSummary ?? [],
          overrideSummary: exportShape.overrideSummary ?? null
        }
      },
      checklist: {
        label: labels.checklist ?? "Checklist",
        value: input.checklistSnapshot ?? null
      },
      prompts: {
        label: labels.prompts ?? "Operator prompts",
        value: input.promptSnapshot ?? null
      }
    },
    quickCopySummary: [
      exportShape.productLabel ?? "Unnamed product",
      exportShape.dimensionsSummary ?? "No dimensions",
      exportShape.materialSummary ?? "No material",
      exportShape.pricingSummary ?? "No pricing summary"
    ].join(" | ")
  };
}

export function buildPlainTextWorksheet(input: {
  operatorWorksheetSnapshot?: Record<string, unknown> | null;
  checklistSnapshot?: Record<string, unknown> | null;
  promptSnapshot?: Record<string, unknown> | null;
  currentApprovedArtifactSummary?: Record<string, unknown> | null;
}) {
  const worksheet = input.operatorWorksheetSnapshot ?? {};
  const header = (worksheet.headerSummary ?? {}) as Record<string, unknown>;
  const pricing = (worksheet.pricingBlock ?? {}) as Record<string, unknown>;
  const specs = (worksheet.specBlock ?? {}) as Record<string, unknown>;
  const fulfillment = (worksheet.fulfillmentBlock ?? {}) as Record<string, unknown>;
  const warnings = (worksheet.warningOverrideBlock ?? {}) as Record<string, unknown>;
  const checklist = input.checklistSnapshot ?? {};
  const prompts = input.promptSnapshot ?? {};

  const lines = [
    `Operator Worksheet ${String(worksheet.operatorWorksheetVersion ?? "operator-listing-v1")}`,
    `Package: ${String(header.packageName ?? "Unknown package")}`,
    `Approval: ${String(header.approvalState ?? "Unknown")}`,
    `Current approved artifact: ${header.currentApprovedArtifact ? "Yes" : "No"}`,
    `Product: ${String(specs.productLabel ?? "Unknown")}`,
    `Dimensions: ${String(specs.dimensionsSummary ?? "Unknown")}`,
    `Material: ${String(specs.materialSummary ?? "Unknown")}`,
    `Edge band: ${String(specs.edgeBandSummary ?? "Unknown")}`,
    `Packaging: ${String(fulfillment.packagingSummary ?? "Unknown")}`,
    `Shipping: ${String(fulfillment.shippingSummary ?? "Unknown")}`,
    `Launch price: ${String(pricing.recommendedLaunchPrice ?? "Unknown")}`,
    `Minimum price: ${String(pricing.minimumPrice ?? "Unknown")}`,
    `Safer margin price: ${String(pricing.saferMarginPrice ?? "Unknown")}`,
    `Required missing fields: ${Array.isArray(checklist.requiredMissingFields) ? checklist.requiredMissingFields.join(", ") || "None" : "None"}`,
    `Warnings: ${Array.isArray(warnings.warnings) ? JSON.stringify(warnings.warnings) : "None"}`,
    `Override: ${warnings.overrideSummary ? JSON.stringify(warnings.overrideSummary) : "None"}`,
    `Critical prompts: ${Array.isArray(prompts.criticalPrompts) ? prompts.criticalPrompts.join(" | ") || "None" : "None"}`,
    `Summary: ${String(input.currentApprovedArtifactSummary?.summary ?? "Use the current approved artifact summary for final handoff context.")}`
  ];

  return {
    text: lines.join("\n"),
    lineCount: lines.length
  };
}

export function buildStructuredWorksheetExport(input: {
  operatorWorksheetSnapshot?: Record<string, unknown> | null;
  copyExportSnapshot?: Record<string, unknown> | null;
  promptSnapshot?: Record<string, unknown> | null;
  checklistSnapshot?: Record<string, unknown> | null;
  currentApprovedArtifactSummary?: Record<string, unknown> | null;
}) {
  return {
    operatorWorksheet: input.operatorWorksheetSnapshot ?? null,
    copyExport: input.copyExportSnapshot ?? null,
    prompts: input.promptSnapshot ?? null,
    checklist: input.checklistSnapshot ?? null,
    currentApprovedArtifact: input.currentApprovedArtifactSummary ?? null,
    generatedAt: new Date().toISOString()
  };
}

export function buildWorksheetErgonomicsSummary(input: {
  checklistSnapshot?: Record<string, unknown> | null;
  promptSnapshot?: Record<string, unknown> | null;
  copyExportSnapshot?: Record<string, unknown> | null;
  currentApprovedArtifact: boolean;
}) {
  const groups = (input.copyExportSnapshot?.groups ?? {}) as Record<string, unknown>;
  const criticalPrompts = Array.isArray(input.promptSnapshot?.criticalPrompts)
    ? (input.promptSnapshot?.criticalPrompts as string[])
    : [];
  const reviewPrompts = Array.isArray(input.promptSnapshot?.reviewPrompts)
    ? (input.promptSnapshot?.reviewPrompts as string[])
    : [];
  const requiredChecklist = Array.isArray(input.checklistSnapshot?.requiredChecklist)
    ? (input.checklistSnapshot?.requiredChecklist as Array<{ field: string; ready: boolean }>)
    : [];
  const missingCriticalFieldCount = requiredChecklist.filter((item) => !item.ready).length;

  return {
    copyGroupCount: Object.keys(groups).length,
    promptCount: criticalPrompts.length + reviewPrompts.length,
    criticalFieldCount: requiredChecklist.length,
    missingCriticalFieldCount,
    readyToUseBoolean: input.currentApprovedArtifact && missingCriticalFieldCount === 0,
    summary:
      input.currentApprovedArtifact && missingCriticalFieldCount === 0
        ? "Worksheet is packaged cleanly enough for active manual listing work."
        : "Worksheet still needs operator attention before it is friction-free to use."
  };
}

export function buildQuickCopySummarySnapshot(input: {
  exportShapeSnapshot?: Record<string, unknown> | null;
  copyExportSnapshot?: Record<string, unknown> | null;
  preset?: {
    quickCopyOrderingSnapshot?: Record<string, unknown> | null;
    shortSummaryFormatSnapshot?: Record<string, unknown> | null;
  } | null;
}) {
  const exportShape = input.exportShapeSnapshot ?? {};
  const ordering =
    ((input.preset?.quickCopyOrderingSnapshot ?? null) as Record<string, unknown> | null) ??
    ({ fields: ["productLabel", "dimensionsSummary", "materialSummary", "pricingSummary", "warningNotes"] } as Record<string, unknown>);
  const copyFirstFields = Array.isArray(ordering.fields) ? (ordering.fields as string[]) : [];
  const groups = (input.copyExportSnapshot?.groups ?? {}) as Record<string, { label?: string; value?: unknown }>;

  return {
    copyFirstFields,
    priorityCopyBlocks: [
      {
        key: "identity",
        label: "Copy these first",
        value: {
          productLabel: exportShape.productLabel ?? null,
          internalSku: exportShape.internalSku ?? null,
          dimensionsSummary: exportShape.dimensionsSummary ?? null
        }
      },
      {
        key: "pricing",
        label: "Pricing",
        value: {
          pricingSummary: exportShape.pricingSummary ?? null
        }
      },
      {
        key: "warnings",
        label: "Warnings and notes",
        value: {
          warnings: exportShape.warningsSummary ?? [],
          overrideSummary: exportShape.overrideSummary ?? null
        }
      }
    ],
    quickCopySummary:
      (input.copyExportSnapshot?.quickCopySummary as string | undefined) ??
      [
        exportShape.productLabel ?? "Unnamed product",
        exportShape.dimensionsSummary ?? "No dimensions",
        exportShape.pricingSummary ?? "No pricing summary"
      ].join(" | "),
    copyGroupCount: Object.keys(groups).length
  };
}

export function buildFinalReviewPromptSnapshot(input: {
  approvalState: string;
  currentApprovedArtifact: boolean;
  overrideSnapshot?: Record<string, unknown> | null;
  warningSnapshot?: WarningItem[] | null;
  checklistSnapshot?: Record<string, unknown> | null;
  exportShapeSnapshot?: Record<string, unknown> | null;
  preset?: {
    finalReviewPromptTemplateSnapshot?: Record<string, unknown> | null;
  } | null;
}) {
  const warnings = input.warningSnapshot ?? [];
  const requiredMissing = Array.isArray(input.checklistSnapshot?.requiredMissingFields)
    ? (input.checklistSnapshot?.requiredMissingFields as string[])
    : [];

  const criticalReviewPrompts = [
    ...(input.currentApprovedArtifact ? [] : ["Confirm this package is still the current approved artifact before copying anything."]),
    ...(requiredMissing.length ? [`Resolve required fields before final manual entry: ${requiredMissing.join(", ")}.`] : []),
    ...(Boolean(input.overrideSnapshot?.overrideApproved)
      ? ["A price-floor override is attached. Confirm the override reason has been acknowledged."]
      : [])
  ];
  const warningSensitivePrompts = Array.isArray(
    input.preset?.finalReviewPromptTemplateSnapshot?.warningSensitivePrompts
  )
    ? (input.preset?.finalReviewPromptTemplateSnapshot?.warningSensitivePrompts as string[])
    : [
        "Verify packaging and shipping values still match the chosen launch scenario.",
        "Re-check warning-sensitive fields before final Amazon entry."
      ];
  const completionReviewPrompts = Array.isArray(
    input.preset?.finalReviewPromptTemplateSnapshot?.completionReviewPrompts
  )
    ? (input.preset?.finalReviewPromptTemplateSnapshot?.completionReviewPrompts as string[])
    : [
        "Confirm the launch price selected is the one intended for this package.",
        "Treat this worksheet as final only after the last warning review pass."
      ];

  return {
    criticalReviewPrompts,
    warningSensitivePrompts: [
      ...warningSensitivePrompts,
      ...(warnings.some((warning) => warning.severity === "BLOCKING")
        ? ["Blocking warning remains present. Do not proceed until it has been intentionally resolved or acknowledged."]
        : [])
    ],
    completionReviewPrompts,
    summary:
      input.approvalState === "APPROVED" || input.approvalState === "APPROVED_WITH_OVERRIDE"
        ? "Final review prompts are ready for the last manual listing check."
        : "Final review prompts are still highlighting what must be confirmed before manual listing work."
  };
}

export function buildArtifactHandoffSummarySnapshot(input: {
  packageId: string;
  packageName?: string | null;
  approvalState: string;
  currentApprovedArtifact: boolean;
  exportContractVersion?: string | null;
  worksheetVersion?: string | null;
  operatorWorksheetVersion?: string | null;
  quickCopyVersion?: string | null;
  approvedAt?: string | Date | null;
  overrideSnapshot?: Record<string, unknown> | null;
}) {
  return {
    artifactIdentity: {
      packageId: input.packageId,
      packageName: input.packageName ?? null
    },
    artifactUseNowBoolean: input.currentApprovedArtifact,
    artifactVersionSummary: {
      exportContractVersion: input.exportContractVersion ?? null,
      worksheetVersion: input.worksheetVersion ?? null,
      operatorWorksheetVersion: input.operatorWorksheetVersion ?? null,
      quickCopyVersion: input.quickCopyVersion ?? null
    },
    artifactStatusSummary: {
      approvalState: input.approvalState,
      approvedAt:
        input.approvedAt instanceof Date
          ? input.approvedAt.toISOString()
          : (input.approvedAt as string | null | undefined) ?? null,
      hasOverride: Boolean(input.overrideSnapshot?.overrideApproved)
    },
    summary: input.currentApprovedArtifact
      ? "This is the package to use now for manual listing prep."
      : "This package is not the active handoff artifact."
  };
}

export function buildShortPlainTextSummary(input: {
  exportShapeSnapshot?: Record<string, unknown> | null;
  approvalState: string;
  currentApprovedArtifact: boolean;
  readyForListingPrepSummary?: Record<string, unknown> | null;
  preset?: {
    shortSummaryFormatSnapshot?: Record<string, unknown> | null;
  } | null;
}) {
  const exportShape = input.exportShapeSnapshot ?? {};
  const parts = [
    exportShape.productLabel ?? "Unnamed product",
    exportShape.dimensionsSummary ?? "No dimensions",
    exportShape.pricingSummary ?? "No pricing summary",
    input.currentApprovedArtifact ? "Use now" : "Historical",
    String(input.readyForListingPrepSummary?.readyForListingPrepStatus ?? input.approvalState)
  ];

  return {
    text: parts.join(" | "),
    formatLabel:
      (input.preset?.shortSummaryFormatSnapshot as Record<string, unknown> | null)?.label ?? "default-short-summary"
  };
}

export function buildCompletionCueSnapshot(input: {
  approvalState: string;
  currentApprovedArtifact: boolean;
  overrideSnapshot?: Record<string, unknown> | null;
  checklistSnapshot?: Record<string, unknown> | null;
  warningSnapshot?: WarningItem[] | null;
  preset?: {
    completionCueTemplateSnapshot?: Record<string, unknown> | null;
  } | null;
}) {
  const requiredMissing = Array.isArray(input.checklistSnapshot?.requiredMissingFields)
    ? (input.checklistSnapshot.requiredMissingFields as string[])
    : [];
  const weakFields = Array.isArray(input.checklistSnapshot?.optionalIncompleteFields)
    ? (input.checklistSnapshot.optionalIncompleteFields as string[])
    : [];
  const blockingWarnings = (input.warningSnapshot ?? []).filter((warning) => warning.severity === "BLOCKING");
  const template = (input.preset?.completionCueTemplateSnapshot ?? null) as Record<string, unknown> | null;

  const readyNowBoolean =
    input.currentApprovedArtifact &&
    input.approvalState === "APPROVED" &&
    requiredMissing.length === 0 &&
    blockingWarnings.length === 0;
  const readyWithOverrideBoolean =
    input.currentApprovedArtifact &&
    input.approvalState === "APPROVED_WITH_OVERRIDE" &&
    requiredMissing.length === 0;
  const blockedBoolean =
    input.approvalState === "BLOCKED" || (!readyNowBoolean && !readyWithOverrideBoolean && blockingWarnings.length > 0);
  const needsReviewBoolean = !readyNowBoolean && !readyWithOverrideBoolean && !blockedBoolean;

  const lastChecks = [
    ...(input.currentApprovedArtifact ? [] : ["Confirm this package is still the current approved artifact before manual entry."]),
    ...(requiredMissing.length ? [`Resolve required fields: ${requiredMissing.join(", ")}.`] : []),
    ...(weakFields.length ? [`Review weaker optional fields: ${weakFields.join(", ")}.`] : []),
    ...(blockingWarnings.length ? [blockingWarnings[0]?.message ?? "Blocking warning still needs attention."] : []),
    ...(Boolean(input.overrideSnapshot?.overrideApproved)
      ? ["This package is usable because an override was approved. Re-check the override reason before entry."]
      : []),
    ...(Array.isArray(template?.lastChecks) ? (template?.lastChecks as string[]) : [])
  ];

  return {
    readyNowBoolean,
    readyWithOverrideBoolean,
    needsReviewBoolean,
    blockedBoolean,
    cueLabel: readyNowBoolean
      ? "READY_NOW"
      : readyWithOverrideBoolean
        ? "READY_WITH_OVERRIDE"
        : blockedBoolean
          ? "BLOCKED"
          : "NEEDS_REVIEW",
    lastChecks,
    summary: readyNowBoolean
      ? "Ready to enter now. Use this approved artifact and follow the final checks."
      : readyWithOverrideBoolean
        ? "Ready to enter with override awareness. Double-check the override and final warning-sensitive values."
        : blockedBoolean
          ? "Do not use yet. Blocking review conditions still remain."
          : "Needs review before final manual listing entry."
  };
}

export function buildInternalShareSummarySnapshot(input: {
  packageId: string;
  packageName?: string | null;
  approvalState: string;
  currentApprovedArtifact: boolean;
  currentApprovedArtifactSummary?: Record<string, unknown> | null;
  quickCopySummarySnapshot?: Record<string, unknown> | null;
  finalReviewPromptSnapshot?: Record<string, unknown> | null;
  artifactHandoffSummarySnapshot?: Record<string, unknown> | null;
  shortPlainTextSummarySnapshot?: Record<string, unknown> | null;
  warningSnapshot?: WarningItem[] | null;
  preset?: {
    shareSummaryFormatSnapshot?: Record<string, unknown> | null;
  } | null;
}) {
  const template = (input.preset?.shareSummaryFormatSnapshot ?? null) as Record<string, unknown> | null;
  const warnings = (input.warningSnapshot ?? []).map((warning) => warning.message);
  const shareBlockSections = [
    {
      key: "use-now",
      label: "What this package is for",
      value:
        input.currentApprovedArtifact
          ? "Use this artifact now for manual Amazon listing prep."
          : "Reference only. This is not the current approved artifact."
    },
    {
      key: "copy-first",
      label: "Copy first",
      value: input.quickCopySummarySnapshot?.quickCopySummary ?? null
    },
    {
      key: "watch",
      label: "What to watch",
      value: warnings[0] ?? input.finalReviewPromptSnapshot?.summary ?? "Review the final prompts and warnings before entry."
    }
  ];

  return {
    artifactUseNowSummary:
      input.currentApprovedArtifactSummary?.summary ??
      (input.currentApprovedArtifact
        ? "This is the current approved artifact to use now."
        : "This package is not the artifact to use now."),
    shareBlockSections,
    shortShareText:
      input.shortPlainTextSummarySnapshot?.text ??
      `${input.packageName ?? "Listing prep package"} | ${input.approvalState} | ${input.currentApprovedArtifact ? "Use now" : "Historical"}`,
    whatThisIsFor:
      (template?.whatThisIsFor as string | undefined) ??
      "Internal handoff summary for manual Amazon listing prep.",
    whatToWatch:
      warnings[0] ??
      (template?.whatToWatch as string | undefined) ??
      "Review warnings, overrides, and final prompts before manual entry.",
    summary:
      input.currentApprovedArtifact
        ? "Internal handoff summary is ready to share with the operator using the approved artifact."
        : "Internal handoff summary is available, but this package is not the current artifact."
  };
}

export function buildShortShareTextSnapshot(input: {
  packageName?: string | null;
  approvalState: string;
  currentApprovedArtifact: boolean;
  quickCopySummarySnapshot?: Record<string, unknown> | null;
  completionCueSnapshot?: Record<string, unknown> | null;
  preset?: {
    shareSummaryFormatSnapshot?: Record<string, unknown> | null;
  } | null;
}) {
  const template = (input.preset?.shareSummaryFormatSnapshot ?? null) as Record<string, unknown> | null;
  const text = [
    input.packageName ?? "Listing prep package",
    input.currentApprovedArtifact ? "Use now" : "Historical",
    input.approvalState,
    input.completionCueSnapshot?.cueLabel ?? "REVIEW",
    input.quickCopySummarySnapshot?.quickCopySummary ?? null
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    text,
    formatLabel: (template?.formatLabel as string | undefined) ?? "internal-share-v1"
  };
}

export function buildLastChangeSummarySnapshot(input: {
  approvalHistorySnapshot?: Record<string, unknown> | null;
  overrideHistorySnapshot?: Record<string, unknown> | null;
  channelPresetSelectionSummary?: Record<string, unknown> | null;
}) {
  const approvalHistory = Array.isArray(input.approvalHistorySnapshot?.history)
    ? (input.approvalHistorySnapshot?.history as Array<Record<string, unknown>>)
    : [];
  const lastApproval = approvalHistory[approvalHistory.length - 1] ?? null;
  const latestOverride =
    (input.overrideHistorySnapshot?.latestOverride as Record<string, unknown> | null) ?? null;
  const presetSummary = input.channelPresetSelectionSummary ?? null;

  return {
    lastApprovalAction: lastApproval?.action ?? null,
    lastApprovalAt: lastApproval?.createdAt ?? null,
    lastPresetChange:
      typeof presetSummary?.summary === "string" ? String(presetSummary.summary) : null,
    lastOverrideSummary:
      typeof latestOverride?.summary === "string" ? String(latestOverride.summary) : null,
    summary:
      typeof lastApproval?.action === "string"
        ? `Last meaningful change: ${String(lastApproval.action)}`
        : typeof presetSummary?.summary === "string"
          ? `Last meaningful change: ${String(presetSummary.summary)}`
          : "No meaningful change summary is available yet."
  };
}

export function buildFinalRunbookSnapshot(input: {
  packageId: string;
  packageName?: string | null;
  approvalState: string;
  currentApprovedArtifactSummary?: Record<string, unknown> | null;
  quickCopySummarySnapshot?: Record<string, unknown> | null;
  finalReviewPromptSnapshot?: Record<string, unknown> | null;
  completionCueSnapshot?: Record<string, unknown> | null;
  warningSnapshot?: WarningItem[] | null;
  overrideSnapshot?: Record<string, unknown> | null;
  internalShareSummarySnapshot?: Record<string, unknown> | null;
  lastChangeSummarySnapshot?: Record<string, unknown> | null;
  preset?: {
    finalReviewOrderingSnapshot?: Record<string, unknown> | null;
  } | null;
}) {
  const ordering =
    ((input.preset?.finalReviewOrderingSnapshot ?? null) as Record<string, unknown> | null)?.sections;

  const runbookSectionOrder = Array.isArray(ordering)
    ? (ordering as string[])
    : ["copy-first", "final-review", "completion-cue", "warnings", "internal-share"];

  return {
    runbookVersion: "manual-runbook-v1",
    runbookSectionOrder,
    headerSummary: {
      packageId: input.packageId,
      packageName: input.packageName ?? null,
      approvalState: input.approvalState,
      artifactSummary: input.currentApprovedArtifactSummary?.summary ?? null
    },
    sections: {
      copyFirst: input.quickCopySummarySnapshot ?? null,
      finalReview: input.finalReviewPromptSnapshot ?? null,
      completionCue: input.completionCueSnapshot ?? null,
      warnings: {
        warnings: input.warningSnapshot ?? [],
        overrideSummary: input.overrideSnapshot ?? null
      },
      internalShare: input.internalShareSummarySnapshot ?? null,
      lastChange: input.lastChangeSummarySnapshot ?? null
    },
    runbookSummary:
      input.completionCueSnapshot?.summary ??
      input.internalShareSummarySnapshot?.summary ??
      "Final manual-listing runbook is ready."
  };
}

export function buildLastStepChecklistSnapshot(input: {
  approvalState: string;
  currentApprovedArtifact: boolean;
  overrideSnapshot?: Record<string, unknown> | null;
  checklistSnapshot?: Record<string, unknown> | null;
  warningSnapshot?: WarningItem[] | null;
  preset?: {
    finalCheckOrderingSnapshot?: Record<string, unknown> | null;
    pricingCriticalPromptSnapshot?: Record<string, unknown> | null;
  } | null;
}) {
  const requiredMissing = Array.isArray(input.checklistSnapshot?.requiredMissingFields)
    ? (input.checklistSnapshot.requiredMissingFields as string[])
    : [];
  const optionalIncomplete = Array.isArray(input.checklistSnapshot?.optionalIncompleteFields)
    ? (input.checklistSnapshot.optionalIncompleteFields as string[])
    : [];
  const warnings = input.warningSnapshot ?? [];
  const blockingWarnings = warnings.filter((warning) => warning.severity === "BLOCKING");
  const pricingCriticalChecks = Array.isArray(input.preset?.pricingCriticalPromptSnapshot?.checks)
    ? (input.preset?.pricingCriticalPromptSnapshot?.checks as string[])
    : [
        "Confirm the approved launch price is the exact value you will enter.",
        "Confirm minimum and safer-margin prices are still visible for last-minute validation."
      ];

  const finalOrder = Array.isArray(input.preset?.finalCheckOrderingSnapshot?.groups)
    ? (input.preset?.finalCheckOrderingSnapshot?.groups as string[])
    : ["copy-first", "pricing-critical", "warnings", "final-confirmation"];

  const lastChecks = [
    ...(input.currentApprovedArtifact
      ? ["Use the current approved artifact only."]
      : ["This is not the current approved artifact. Stop and confirm the active package before entry."]),
    ...(Boolean(input.overrideSnapshot?.overrideApproved)
      ? ["This package is approved with an override. Re-read the override reason before final entry."]
      : []),
    ...(requiredMissing.length ? [`Resolve required fields first: ${requiredMissing.join(", ")}.`] : []),
    ...(optionalIncomplete.length ? [`Review optional weak fields: ${optionalIncomplete.join(", ")}.`] : []),
    ...pricingCriticalChecks
  ];

  return {
    finalCheckOrdering: finalOrder,
    lastChecks,
    blockingChecks: [
      ...blockingWarnings.map((warning) => warning.message),
      ...(requiredMissing.length ? [`Required fields still missing: ${requiredMissing.join(", ")}.`] : [])
    ],
    reviewChecks: [
      ...(optionalIncomplete.length ? [`Optional fields still need review: ${optionalIncomplete.join(", ")}.`] : []),
      ...warnings.filter((warning) => warning.severity !== "BLOCKING").map((warning) => warning.message)
    ],
    pricingCriticalChecks,
    summary:
      blockingWarnings.length > 0 || requiredMissing.length > 0
        ? "Last-step checklist still has blocking items."
        : input.currentApprovedArtifact
          ? "Last-step checklist is ready for the final manual listing pass."
          : "Last-step checklist is available, but this is not the current package to use."
  };
}

export function buildReadyNowSummarySnapshot(input: {
  approvalState: string;
  currentApprovedArtifact: boolean;
  overrideSnapshot?: Record<string, unknown> | null;
  lastStepChecklistSnapshot?: Record<string, unknown> | null;
  completionCueSnapshot?: Record<string, unknown> | null;
}) {
  const blockingChecks = Array.isArray(input.lastStepChecklistSnapshot?.blockingChecks)
    ? (input.lastStepChecklistSnapshot?.blockingChecks as string[])
    : [];
  const reviewChecks = Array.isArray(input.lastStepChecklistSnapshot?.reviewChecks)
    ? (input.lastStepChecklistSnapshot?.reviewChecks as string[])
    : [];
  const readyNowBoolean =
    input.currentApprovedArtifact &&
    input.approvalState === "APPROVED" &&
    blockingChecks.length === 0;
  const readyWithOverrideBoolean =
    input.currentApprovedArtifact &&
    input.approvalState === "APPROVED_WITH_OVERRIDE" &&
    blockingChecks.length === 0;
  const blockedBoolean = input.approvalState === "BLOCKED" || blockingChecks.length > 0;
  const needsReviewBoolean = !readyNowBoolean && !readyWithOverrideBoolean && !blockedBoolean;

  return {
    readyNowBoolean,
    readyWithOverrideBoolean,
    needsReviewBoolean,
    blockedBoolean,
    stateLabel: readyNowBoolean
      ? "READY_NOW"
      : readyWithOverrideBoolean
        ? "READY_WITH_OVERRIDE"
        : blockedBoolean
          ? "BLOCKED"
          : "NEEDS_REVIEW",
    why:
      input.completionCueSnapshot?.summary ??
      (readyNowBoolean
        ? "All last-step checks are clear for manual listing entry."
        : readyWithOverrideBoolean
          ? "The package is usable, but the override must stay visible during entry."
          : blockedBoolean
            ? "Blocking checks still prevent this package from being used."
            : "Review checks still remain before this package should be used."),
    whatToDoNext:
      readyNowBoolean || readyWithOverrideBoolean
        ? "Copy the required values, then work through the last-step checklist."
        : blockedBoolean
          ? "Resolve blocking checks before manual listing entry."
          : "Review the remaining weak fields and warnings before entry.",
    blockingChecks,
    reviewChecks
  };
}

export function buildShareReadySummarySnapshot(input: {
  packageName?: string | null;
  currentApprovedArtifact: boolean;
  quickCopySummarySnapshot?: Record<string, unknown> | null;
  artifactHandoffSummarySnapshot?: Record<string, unknown> | null;
  internalShareSummarySnapshot?: Record<string, unknown> | null;
  preset?: {
    sharePackagingFormatSnapshot?: Record<string, unknown> | null;
  } | null;
}) {
  const packagingFormat = (input.preset?.sharePackagingFormatSnapshot ?? null) as Record<string, unknown> | null;
  return {
    shortShareText:
      input.internalShareSummarySnapshot?.shortShareText ??
      `${input.packageName ?? "Listing prep package"} | ${input.currentApprovedArtifact ? "Use now" : "Reference only"}`,
    internalShareBlocks:
      input.internalShareSummarySnapshot?.shareBlockSections ?? [],
    whatToUseNowSummary:
      input.artifactHandoffSummarySnapshot?.summary ??
      (input.currentApprovedArtifact
        ? "Use this package now for manual listing prep."
        : "Do not use this package as the current artifact."),
    shareFormatLabel: packagingFormat?.label ?? "share-ready-v1",
    summary:
      input.currentApprovedArtifact
        ? "Share-ready summary is clean enough for internal handoff."
        : "Share-ready summary is available, but this package is not the one to use now."
  };
}

export function buildExecutionPackageSnapshot(input: {
  packageId: string;
  packageName?: string | null;
  approvalState: string;
  currentApprovedArtifact: boolean;
  quickCopySummarySnapshot?: Record<string, unknown> | null;
  shareReadySummarySnapshot?: Record<string, unknown> | null;
  lastStepChecklistSnapshot?: Record<string, unknown> | null;
  readyNowSummarySnapshot?: Record<string, unknown> | null;
  warningSnapshot?: WarningItem[] | null;
  overrideSnapshot?: Record<string, unknown> | null;
}) {
  return {
    executionPackageVersion: "execution-package-v1",
    header: {
      packageId: input.packageId,
      packageName: input.packageName ?? null,
      approvalState: input.approvalState,
      currentApprovedArtifact: input.currentApprovedArtifact
    },
    copyFirst: input.quickCopySummarySnapshot ?? null,
    shareReady: input.shareReadySummarySnapshot ?? null,
    lastStep: input.lastStepChecklistSnapshot ?? null,
    readyNow: input.readyNowSummarySnapshot ?? null,
    warningOverride: {
      warnings: input.warningSnapshot ?? [],
      overrideSummary: input.overrideSnapshot ?? null
    },
    executionPackageSummary:
      input.readyNowSummarySnapshot?.why ??
      (input.currentApprovedArtifact
        ? "Execution package is ready for the operator."
        : "Execution package exists, but it is not the current artifact.")
  };
}

export function buildCopyShareErgonomicsSummary(input: {
  quickCopySummarySnapshot?: Record<string, unknown> | null;
  shareReadySummarySnapshot?: Record<string, unknown> | null;
  lastStepChecklistSnapshot?: Record<string, unknown> | null;
  readyNowSummarySnapshot?: Record<string, unknown> | null;
}) {
  const priorityCopyBlocks = Array.isArray(input.quickCopySummarySnapshot?.priorityCopyBlocks)
    ? (input.quickCopySummarySnapshot?.priorityCopyBlocks as unknown[])
    : [];
  const promptCount =
    (Array.isArray(input.lastStepChecklistSnapshot?.lastChecks)
      ? (input.lastStepChecklistSnapshot?.lastChecks as unknown[]).length
      : 0) +
    (Array.isArray(input.lastStepChecklistSnapshot?.reviewChecks)
      ? (input.lastStepChecklistSnapshot?.reviewChecks as unknown[]).length
      : 0);
  const criticalFieldCount = Array.isArray(input.lastStepChecklistSnapshot?.pricingCriticalChecks)
    ? (input.lastStepChecklistSnapshot?.pricingCriticalChecks as unknown[]).length
    : 0;
  const missingCriticalFieldCount = Array.isArray(input.lastStepChecklistSnapshot?.blockingChecks)
    ? (input.lastStepChecklistSnapshot?.blockingChecks as unknown[]).length
    : 0;

  return {
    copyGroupCount: priorityCopyBlocks.length,
    promptCount,
    criticalFieldCount,
    missingCriticalFieldCount,
    readyToUseBoolean: Boolean(input.readyNowSummarySnapshot?.readyNowBoolean || input.readyNowSummarySnapshot?.readyWithOverrideBoolean),
    shareReadySummary: input.shareReadySummarySnapshot?.summary ?? null,
    summary:
      input.readyNowSummarySnapshot?.readyNowBoolean || input.readyNowSummarySnapshot?.readyWithOverrideBoolean
        ? "Copy/share packaging is streamlined enough for live operator use."
        : "Copy/share packaging still needs review before it is friction-free."
  };
}

export function buildEntryCompleteCueSnapshot(input: {
  approvalState: string;
  currentApprovedArtifact: boolean;
  overrideSnapshot?: Record<string, unknown> | null;
  checklistSnapshot?: Record<string, unknown> | null;
  warningSnapshot?: WarningItem[] | null;
  readyNowSummarySnapshot?: Record<string, unknown> | null;
  preset?: {
    entryCompletionCueTemplateSnapshot?: Record<string, unknown> | null;
  } | null;
  entryCompletionConfirmed?: boolean;
}) {
  const requiredMissing = Array.isArray(input.checklistSnapshot?.requiredMissingFields)
    ? (input.checklistSnapshot?.requiredMissingFields as string[])
    : [];
  const blockingWarnings = (input.warningSnapshot ?? []).filter((warning) => warning.severity === "BLOCKING");
  const warningReview = (input.warningSnapshot ?? [])
    .filter((warning) => warning.severity !== "BLOCKING")
    .map((warning) => warning.message);
  const templateChecks = Array.isArray(input.preset?.entryCompletionCueTemplateSnapshot?.lastChecks)
    ? (input.preset?.entryCompletionCueTemplateSnapshot?.lastChecks as string[])
    : [];
  const entryCriticalChecks = [
    ...(input.currentApprovedArtifact
      ? ["Use the current approved artifact for manual entry."]
      : ["This is not the current approved artifact. Confirm the active package first."]),
    ...(Boolean(input.overrideSnapshot?.overrideApproved)
      ? ["Override-approved package in use. Re-read the override note before entry completes."]
      : []),
    ...templateChecks
  ];
  const entryRemainingChecks = [
    ...(requiredMissing.length ? requiredMissing.map((field) => `Resolve required field: ${field}.`) : []),
    ...warningReview
  ];
  const entryCompletionStatus =
    input.entryCompletionConfirmed
      ? Boolean(input.overrideSnapshot?.overrideApproved)
        ? "ENTRY_COMPLETE_WITH_OVERRIDE"
        : "ENTRY_COMPLETE"
      : blockingWarnings.length > 0 || requiredMissing.length > 0
      ? "ENTRY_BLOCKED"
      : input.readyNowSummarySnapshot?.readyNowBoolean || input.readyNowSummarySnapshot?.readyWithOverrideBoolean
        ? "ENTRY_READY"
        : input.currentApprovedArtifact
          ? "ENTRY_IN_PROGRESS"
          : "ENTRY_BLOCKED";

  return {
    entryCompletionStatus,
    entryReadyBoolean: entryCompletionStatus === "ENTRY_READY",
    entryInProgressBoolean: entryCompletionStatus === "ENTRY_IN_PROGRESS",
    entryCompleteBoolean:
      entryCompletionStatus === "ENTRY_COMPLETE" ||
      entryCompletionStatus === "ENTRY_COMPLETE_WITH_OVERRIDE",
    entryBlockedBoolean: entryCompletionStatus === "ENTRY_BLOCKED",
    entryCriticalChecks,
    entryRemainingChecks,
    summary:
      entryCompletionStatus === "ENTRY_COMPLETE_WITH_OVERRIDE"
        ? "Manual entry is complete and override awareness was retained at closeout."
        : entryCompletionStatus === "ENTRY_COMPLETE"
          ? "Manual entry is complete and the artifact has a retained closeout summary."
          : entryCompletionStatus === "ENTRY_READY"
            ? "Manual entry can begin once the final checks are acknowledged."
            : entryCompletionStatus === "ENTRY_IN_PROGRESS"
              ? "Manual entry is close, but a few review items still remain."
              : "Manual entry should not begin until blocking issues are cleared."
  };
}

export function buildEntryCompletionSummarySnapshot(input: {
  entryCompleteCueSnapshot?: Record<string, unknown> | null;
  lastStepChecklistSnapshot?: Record<string, unknown> | null;
  preset?: {
    entryCriticalOrderingSnapshot?: Record<string, unknown> | null;
  } | null;
}) {
  const requiredEntryChecks = Array.isArray(input.entryCompleteCueSnapshot?.entryCriticalChecks)
    ? (input.entryCompleteCueSnapshot?.entryCriticalChecks as string[])
    : [];
  const remainingChecks = Array.isArray(input.entryCompleteCueSnapshot?.entryRemainingChecks)
    ? (input.entryCompleteCueSnapshot?.entryRemainingChecks as string[])
    : [];
  const blockedChecks = Array.isArray(input.lastStepChecklistSnapshot?.blockingChecks)
    ? (input.lastStepChecklistSnapshot?.blockingChecks as string[])
    : [];
  const finalNotes = Array.isArray(input.preset?.entryCriticalOrderingSnapshot?.notes)
    ? (input.preset?.entryCriticalOrderingSnapshot?.notes as string[])
    : [];

  return {
    requiredEntryChecks,
    remainingChecks,
    blockedChecks,
    finalOrdering:
      (Array.isArray(input.preset?.entryCriticalOrderingSnapshot?.groups)
        ? (input.preset?.entryCriticalOrderingSnapshot?.groups as string[])
        : ["copy-first", "share-ready", "final-review", "entry-complete"]) ?? [],
    lastStepCompletionNotes: finalNotes,
    summary:
      input.entryCompleteCueSnapshot?.entryCompletionStatus === "ENTRY_COMPLETE" ||
      input.entryCompleteCueSnapshot?.entryCompletionStatus === "ENTRY_COMPLETE_WITH_OVERRIDE"
        ? "Entry completion has been confirmed."
        : blockedChecks.length > 0
        ? "Entry completion still has blocked checks."
        : remainingChecks.length > 0
          ? "Entry completion is in progress."
          : "Entry completion summary is clear."
  };
}

export function buildShareCopyPackagingSummary(input: {
  quickCopySummarySnapshot?: Record<string, unknown> | null;
  shareReadySummarySnapshot?: Record<string, unknown> | null;
  finalReviewPromptSnapshot?: Record<string, unknown> | null;
  currentApprovedArtifactSummary?: Record<string, unknown> | null;
  preset?: {
    handoffPacketFormatSnapshot?: Record<string, unknown> | null;
  } | null;
}) {
  const copyFirstBlocks = Array.isArray(input.quickCopySummarySnapshot?.priorityCopyBlocks)
    ? (input.quickCopySummarySnapshot?.priorityCopyBlocks as unknown[])
    : [];
  const shareFirstBlocks = Array.isArray(input.shareReadySummarySnapshot?.internalShareBlocks)
    ? (input.shareReadySummarySnapshot?.internalShareBlocks as unknown[])
    : [];
  return {
    copyFirstBlocks,
    shareFirstBlocks,
    shortShareText:
      input.shareReadySummarySnapshot?.shortShareText ??
      input.currentApprovedArtifactSummary?.summary ??
      null,
    useNowPacketSummary:
      input.currentApprovedArtifactSummary?.summary ??
      input.shareReadySummarySnapshot?.whatToUseNowSummary ??
      "Review the current approved artifact summary before sharing.",
    finalReviewSummary:
      input.finalReviewPromptSnapshot?.summary ??
      "Review final prompts before manual listing entry.",
    handoffFormatLabel: input.preset?.handoffPacketFormatSnapshot?.label ?? "handoff-packet-v1",
    summary:
      copyFirstBlocks.length > 0
        ? "Copy/share packaging is ready for internal handoff."
        : "Copy/share packaging still needs review."
  };
}

export function buildFinalHandoffPacketSnapshot(input: {
  packageId: string;
  packageName?: string | null;
  approvalState: string;
  currentApprovedArtifactSummary?: Record<string, unknown> | null;
  quickCopySummarySnapshot?: Record<string, unknown> | null;
  shareReadySummarySnapshot?: Record<string, unknown> | null;
  finalReviewPromptSnapshot?: Record<string, unknown> | null;
  entryCompleteCueSnapshot?: Record<string, unknown> | null;
  entryCompletionSummarySnapshot?: Record<string, unknown> | null;
  warningSnapshot?: WarningItem[] | null;
  overrideSnapshot?: Record<string, unknown> | null;
  preset?: {
    handoffPacketFormatSnapshot?: Record<string, unknown> | null;
  } | null;
}) {
  return {
    handoffPacketVersion: "handoff-packet-v1",
    header: {
      packageId: input.packageId,
      packageName: input.packageName ?? null,
      approvalState: input.approvalState,
      currentArtifact: input.currentApprovedArtifactSummary ?? null,
      formatLabel: input.preset?.handoffPacketFormatSnapshot?.label ?? "handoff-packet-v1"
    },
    copyFirst: input.quickCopySummarySnapshot ?? null,
    shareFirst: input.shareReadySummarySnapshot ?? null,
    finalReview: input.finalReviewPromptSnapshot ?? null,
    entryComplete: input.entryCompleteCueSnapshot ?? null,
    entryCompletion: input.entryCompletionSummarySnapshot ?? null,
    warningOverride: {
      warnings: input.warningSnapshot ?? [],
      overrideSummary: input.overrideSnapshot ?? null
    },
    handoffPacketSummary:
      input.entryCompleteCueSnapshot?.summary ??
      input.currentApprovedArtifactSummary?.summary ??
      "Final handoff packet is available for internal manual listing use."
  };
}

export function buildEntryCompletionState(input: {
  approvalState: string;
  currentApprovedArtifact: boolean;
  overrideSnapshot?: Record<string, unknown> | null;
  warningSnapshot?: WarningItem[] | null;
  readyNowSummarySnapshot?: Record<string, unknown> | null;
  entryCompletionConfirmed?: boolean;
}) {
  const blockingWarnings = (input.warningSnapshot ?? []).filter((warning) => warning.severity === "BLOCKING");
  if (input.entryCompletionConfirmed) {
    return Boolean(input.overrideSnapshot?.overrideApproved)
      ? "ENTRY_COMPLETE_WITH_OVERRIDE"
      : "ENTRY_COMPLETE";
  }
  if (!input.currentApprovedArtifact || input.approvalState === "BLOCKED" || blockingWarnings.length > 0) {
    return "ENTRY_BLOCKED";
  }
  if (
    Boolean(input.readyNowSummarySnapshot?.readyNowBoolean) ||
    Boolean(input.readyNowSummarySnapshot?.readyWithOverrideBoolean)
  ) {
    return "ENTRY_READY";
  }
  return "ENTRY_IN_PROGRESS";
}

export function buildCloseoutSummarySnapshot(input: {
  packageId: string;
  packageName?: string | null;
  approvalState: string;
  entryCompletionState: string;
  entryCompletedAt?: string | Date | null;
  entryCompletedByMembershipId?: string | null;
  entryCompletionNote?: string | null;
  warningSnapshot?: WarningItem[] | null;
  overrideSnapshot?: Record<string, unknown> | null;
  shareCopyPackagingSummary?: Record<string, unknown> | null;
  shortShareTextSnapshot?: Record<string, unknown> | null;
  preset?: {
    closeoutSummaryFormatSnapshot?: Record<string, unknown> | null;
  } | null;
  versions?: Record<string, unknown> | null;
}) {
  const warningMessages = (input.warningSnapshot ?? []).map((warning) => warning.message);
  const completedAt =
    input.entryCompletedAt instanceof Date
      ? input.entryCompletedAt.toISOString()
      : (input.entryCompletedAt as string | null | undefined) ?? null;
  return {
    closeoutVersion: "closeout-v1",
    packageIdentity: {
      packageId: input.packageId,
      packageName: input.packageName ?? null
    },
    approvalState: input.approvalState,
    entryCompletionState: input.entryCompletionState,
    entryCompletedAt: completedAt,
    entryCompletedByMembershipId: input.entryCompletedByMembershipId ?? null,
    entryCompletionNote: input.entryCompletionNote ?? null,
    whatWasUsedSummary:
      input.packageName
        ? `${input.packageName} was used for manual listing entry.`
        : "This listing-prep package was used for manual listing entry.",
    warningsAtCloseout: warningMessages,
    overrideAtCloseout: input.overrideSnapshot ?? null,
    artifactVersionSummary: input.versions ?? {},
    shareSummary: input.shareCopyPackagingSummary ?? null,
    shortShareText:
      input.shortShareTextSnapshot?.text ?? input.shortShareTextSnapshot?.summary ?? null,
    channelCloseoutNotes:
      input.preset?.closeoutSummaryFormatSnapshot?.notes ?? [],
    summary:
      input.entryCompletionState === "ENTRY_COMPLETE_WITH_OVERRIDE"
        ? "Manual listing entry was completed with override awareness retained at closeout."
        : input.entryCompletionState === "ENTRY_COMPLETE"
          ? "Manual listing entry was completed and closeout summary is retained."
          : "Closeout summary is prepared, but entry completion has not been confirmed yet."
  };
}

export function buildCompletedArtifactSummarySnapshot(input: {
  currentApprovedArtifact: boolean;
  approvalState: string;
  entryCompletionState: string;
  entryCompletedAt?: string | Date | null;
  overrideSnapshot?: Record<string, unknown> | null;
  versions?: Record<string, unknown> | null;
}) {
  const completedAt =
    input.entryCompletedAt instanceof Date
      ? input.entryCompletedAt.toISOString()
      : (input.entryCompletedAt as string | null | undefined) ?? null;
  return {
    completedArtifactState:
      input.entryCompletionState === "ENTRY_COMPLETE_WITH_OVERRIDE" || input.entryCompletionState === "ENTRY_COMPLETE"
        ? "COMPLETED"
        : input.entryCompletionState === "ENTRY_BLOCKED"
          ? "BLOCKED"
          : "ACTIVE",
    isStillCurrent: input.currentApprovedArtifact,
    wasCompletedWithOverride: Boolean(input.overrideSnapshot?.overrideApproved),
    completedAt,
    approvalState: input.approvalState,
    artifactVersionSummary: input.versions ?? {},
    summary:
      input.entryCompletionState === "ENTRY_COMPLETE_WITH_OVERRIDE"
        ? input.currentApprovedArtifact
          ? "Current artifact completed with override awareness."
          : "Historical artifact completed with override awareness."
        : input.entryCompletionState === "ENTRY_COMPLETE"
          ? input.currentApprovedArtifact
            ? "Current artifact completed cleanly."
            : "Historical artifact completed cleanly."
          : input.currentApprovedArtifact
            ? "Artifact is still the current package in use."
            : "Artifact is historical and not the current package."
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
