import { calculateShelfCost, compareScenarioResults } from "./calculator.js";
import { resolveCostEngineAssumptions } from "./assumptions.js";
import {
  buildLaunchCandidatePackage,
  buildLaunchCandidateHandoff,
  buildScenarioRiskSummary,
  evaluateListingReadiness,
  evaluateScenarioGuardrails
} from "./guardrails.js";
import {
  applyChannelMappingPreset,
  buildApprovalHistorySnapshot,
  buildApprovalSummarySnapshot,
  buildChannelHandoffSummary,
  buildCopyExportSnapshot,
  buildCurrentApprovedArtifactSummary,
  buildCompletionCueSnapshot,
  buildFinalReviewPromptSnapshot,
  buildFinalRunbookSnapshot,
  buildArtifactHandoffSummarySnapshot,
  buildInternalShareSummarySnapshot,
  buildLaunchContextSnapshot,
  buildLastChangeSummarySnapshot,
  buildManualAmazonExportSnapshot,
  buildManualListingWorksheet,
  buildOperatorFieldChecklist,
  buildOperatorPromptSnapshot,
  buildOperatorWorksheetPackage,
  buildPlainTextWorksheet,
  buildPresetSelectionSummary,
  buildQuickCopySummarySnapshot,
  buildShortShareTextSnapshot,
  buildShortPlainTextSummary,
  applyMarketplaceMappingTemplate,
  buildMarketplaceFieldValidationResult,
  buildOverrideHistorySnapshot,
  buildStableListingPrepExportShape,
  buildStructuredWorksheetExport,
  buildExportMetadataBlock,
  buildPriceFloorOverrideSnapshot,
  buildWorksheetErgonomicsSummary,
  buildWorksheetSummarySnapshot,
  calculateApprovalState,
  calculateListingPrepPackageStatus,
  calculateReadyForListingPrep,
  selectBestDefaultChannelPreset
} from "./listingPrep.js";
import { decimalToNumber } from "./normalization.js";
import {
  createAmazonFeePresetRecord,
  createCalculationComparisonSetRecord,
  createCalculationScenarioRecord,
  createComparisonSetScenarioRecord,
  createCostProfileRecord,
  createEdgeBandCostRuleRecord,
  createLaunchGuardrailProfileRecord,
  createLaunchTemplateRecord,
  createChannelMappingPresetRecord,
  clearCurrentApprovedArtifactsForScope,
  createListingPrepPackageRecord,
  createMarketplaceMappingTemplateRecord,
  createMaterialCostRuleRecord,
  createPackagingCostRuleRecord,
  createShelfCostCalculationRecord,
  createShippingCostRuleRecord,
  createShippingZoneRuleRecord,
  getAmazonFeePresetRecord,
  getCalculationComparisonSetRecord,
  getCostProfileRecord,
  getLaunchGuardrailProfileRecord,
  getLaunchTemplateRecord,
  getChannelMappingPresetRecord,
  getListingPrepPackageRecord,
  getMarketplaceMappingTemplateRecord,
  getShelfCostCalculationRecord,
  getShippingZoneRuleRecord,
  listAmazonFeePresetsForOrganization,
  listCalculationComparisonSetsForOrganization,
  listCostProfilesForOrganization,
  listLaunchGuardrailProfilesForOrganization,
  listLaunchTemplatesForOrganization,
  listChannelMappingPresetsForOrganization,
  listListingPrepPackagesForOrganization,
  listMarketplaceMappingTemplatesForOrganization,
  listShelfCostCalculationsForOrganization,
  listShippingZoneRulesForOrganization,
  updateAmazonFeePresetRecord,
  updateCalculationComparisonSetRecord,
  updateCalculationScenarioRecord,
  updateCostProfileRecord,
  updateEdgeBandCostRuleRecord,
  updateLaunchGuardrailProfileRecord,
  updateLaunchTemplateRecord,
  updateChannelMappingPresetRecord,
  updateListingPrepPackageRecord,
  updateMarketplaceMappingTemplateRecord,
  updateMaterialCostRuleRecord,
  updatePackagingCostRuleRecord,
  updateShippingCostRuleRecord,
  updateShippingZoneRuleRecord
} from "./repository.js";
import { rankComparisonScenarios } from "./ranking.js";
import type { LaunchStrategy } from "./contracts.js";

type AnyRecord = Record<string, unknown>;
type GuardrailedScenario = {
  id: string;
  name: string;
  launchStrategy: LaunchStrategy | null;
  assumptionsSnapshot: Record<string, unknown>;
  result: ReturnType<typeof calculateShelfCost>;
  changedAssumptions: {
    packagingCode: string | null;
    shippingCode: string | null;
    amazonFeePresetId: string | null;
    shippingZoneRuleId: string | null;
    targetMarginPct: number | null;
    growthMarginPct: number | null;
    launchStrategy: LaunchStrategy | null;
  };
  rankingScore: number | null;
  rankingSummary: AnyRecord | null;
  isRecommendedLaunchScenario: boolean;
  deltas: AnyRecord;
  guardrailProfileId?: string | null;
  guardrailProfileName?: string | null;
  riskScore?: number | null;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | null;
  guardrailSnapshot?: AnyRecord | null;
  warningSnapshot?: AnyRecord[] | null;
  riskSummary?: string | null;
  handoffSnapshot?: AnyRecord | null;
  isLaunchApprovedCandidate?: boolean;
};

type GuardrailedComparison = {
  name: string | null;
  notes: string | null;
  baseSpec: AnyRecord;
  baselineScenarioId: string;
  ranking: {
    scenarios: Array<{
      scenarioId: string;
      rankingScore: number;
      rankingSummary: AnyRecord;
    }>;
    recommendation: {
      recommendedScenarioId: string;
      recommendedLaunchPriceCents: number;
      recommendedFloorPriceCents: number;
      recommendedSaferMarginPriceCents: number;
      bestLaunchScenarioLabel: string;
      safestMarginScenarioLabel: string;
      mostAggressiveScenarioLabel: string;
      recommendationSummary: string;
      tradeoffSummary: AnyRecord;
    } | null;
  };
  scenarios: GuardrailedScenario[];
};

function mapRuleDates<T extends { createdAt: Date; updatedAt: Date }>(record: T) {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function mapAmazonFeePreset(record: any) {
  return {
    ...mapRuleDates(record),
    orgId: record.organizationId,
    costProfileId: record.costProfileId ?? null,
    referralFeePct: decimalToNumber(record.referralFeePct) ?? 0,
    advertisingAllowancePct: decimalToNumber(record.advertisingAllowancePct),
    returnReservePct: decimalToNumber(record.returnReservePct),
    damageReservePct: decimalToNumber(record.damageReservePct),
    miscMarketplacePct: decimalToNumber(record.miscMarketplacePct)
  };
}

function mapShippingZoneRule(record: any) {
  return {
    ...mapRuleDates(record),
    orgId: record.organizationId,
    costProfileId: record.costProfileId ?? null,
    bufferPct: decimalToNumber(record.bufferPct)
  };
}

function mapLaunchTemplate(record: any) {
  return {
    ...mapRuleDates(record),
    orgId: record.organizationId,
    costProfileId: record.costProfileId,
    defaultAmazonFeePresetId: record.defaultAmazonFeePresetId ?? null,
    defaultAmazonFeePresetName: record.defaultAmazonFeePreset?.name ?? null,
    defaultShippingZoneRuleId: record.defaultShippingZoneRuleId ?? null,
    defaultShippingZoneRuleName: record.defaultShippingZoneRule?.name ?? null,
    defaultPackagingRuleId: record.defaultPackagingRuleId ?? null,
    defaultPackagingRuleName: record.defaultPackagingRule?.packagingName ?? null,
    defaultShippingRuleId: record.defaultShippingRuleId ?? null,
    defaultShippingRuleName: record.defaultShippingRule?.shippingName ?? null,
    launchStrategy: record.launchStrategy,
    notes: record.notes ?? null,
    assumptionsSnapshot: record.assumptionsSnapshot ?? null
  };
}

function mapLaunchGuardrailProfile(record: any) {
  return {
    ...mapRuleDates(record),
    orgId: record.organizationId,
    costProfileId: record.costProfileId ?? null,
    minimumMarginPct: decimalToNumber(record.minimumMarginPct) ?? 0,
    minimumBufferAboveBreakEvenPct: decimalToNumber(record.minimumBufferAboveBreakEvenPct),
    maximumFeeBurdenPct: decimalToNumber(record.maximumFeeBurdenPct),
    maximumShippingBurdenPct: decimalToNumber(record.maximumShippingBurdenPct),
    maximumReserveBurdenPct: decimalToNumber(record.maximumReserveBurdenPct),
    maximumAllowedTargetToFloorGapPct: decimalToNumber(record.maximumAllowedTargetToFloorGapPct),
    notes: record.notes ?? null,
    metadata: record.metadata ?? null
  };
}

function mapMarketplaceMappingTemplate(record: any) {
  return {
    ...mapRuleDates(record),
    orgId: record.organizationId,
    costProfileId: record.costProfileId ?? null,
    productLabelFormat: record.productLabelFormat ?? null,
    skuFormat: record.skuFormat ?? null,
    includeWarningNotes: Boolean(record.includeWarningNotes),
    includeOverrideNotes: Boolean(record.includeOverrideNotes),
    dimensionsFormat: record.dimensionsFormat ?? null,
    materialFormat: record.materialFormat ?? null,
    packagingFormat: record.packagingFormat ?? null,
    pricingFormat: record.pricingFormat ?? null,
    notes: record.notes ?? null,
    templateSnapshot: record.templateSnapshot ?? null
  };
}

function mapChannelMappingPreset(record: any) {
  return {
    ...mapRuleDates(record),
    orgId: record.organizationId,
    costProfileId: record.costProfileId ?? null,
    channelCode: record.channelCode,
    productLabelFormat: record.productLabelFormat ?? null,
    skuFormat: record.skuFormat ?? null,
    includeWarningNotes: Boolean(record.includeWarningNotes),
    includeOverrideNotes: Boolean(record.includeOverrideNotes),
    dimensionsFormat: record.dimensionsFormat ?? null,
    materialFormat: record.materialFormat ?? null,
    packagingFormat: record.packagingFormat ?? null,
    pricingFormat: record.pricingFormat ?? null,
    fieldOrderingSnapshot: record.fieldOrderingSnapshot ?? null,
    defaultForChannel: Boolean(record.defaultForChannel),
    defaultLaunchStrategies: record.defaultLaunchStrategies ?? null,
    launchContextSnapshot: record.launchContextSnapshot ?? null,
    priority: record.priority ?? null,
    autoApplyEnabled: Boolean(record.autoApplyEnabled),
    worksheetFieldOrderingSnapshot: record.worksheetFieldOrderingSnapshot ?? null,
    worksheetPromptSnapshot: record.worksheetPromptSnapshot ?? null,
    requiredFieldChecklistSnapshot: record.requiredFieldChecklistSnapshot ?? null,
    optionalFieldChecklistSnapshot: record.optionalFieldChecklistSnapshot ?? null,
    operatorPromptTemplateSnapshot: record.operatorPromptTemplateSnapshot ?? null,
    copyGroupOrderingSnapshot: record.copyGroupOrderingSnapshot ?? null,
    worksheetSectionLabelSnapshot: record.worksheetSectionLabelSnapshot ?? null,
    finalReviewPromptTemplateSnapshot: record.finalReviewPromptTemplateSnapshot ?? null,
    quickCopyOrderingSnapshot: record.quickCopyOrderingSnapshot ?? null,
    shortSummaryFormatSnapshot: record.shortSummaryFormatSnapshot ?? null,
    finalReviewOrderingSnapshot: record.finalReviewOrderingSnapshot ?? null,
    completionCueTemplateSnapshot: record.completionCueTemplateSnapshot ?? null,
    shareSummaryFormatSnapshot: record.shareSummaryFormatSnapshot ?? null,
    notes: record.notes ?? null,
    presetSnapshot: record.presetSnapshot ?? null
  };
}

function mapCostProfile(profile: any) {
  return {
    id: profile.id,
    orgId: profile.organizationId,
    name: profile.name,
    status: profile.status,
    isDefault: profile.isDefault,
    currency: profile.currency,
    defaultMaterialWastePct: decimalToNumber(profile.defaultMaterialWastePct) ?? 0,
    defaultEdgeBandWastePct: decimalToNumber(profile.defaultEdgeBandWastePct) ?? 0,
    defaultLaborRateCentsPerHour: profile.defaultLaborRateCentsPerHour,
    defaultMachineRateCentsPerHour: profile.defaultMachineRateCentsPerHour,
    defaultOverheadRateCentsPerHour: profile.defaultOverheadRateCentsPerHour,
    defaultPackagingAllowanceCents: profile.defaultPackagingAllowanceCents,
    defaultShippingAllowanceCents: profile.defaultShippingAllowanceCents,
    defaultPackingLaborRateCentsPerHour: profile.defaultPackingLaborRateCentsPerHour,
    defaultPackingMinutes: decimalToNumber(profile.defaultPackingMinutes),
    defaultMarketplaceFeePct: decimalToNumber(profile.defaultMarketplaceFeePct),
    defaultReturnReservePct: decimalToNumber(profile.defaultReturnReservePct),
    defaultDamageReservePct: decimalToNumber(profile.defaultDamageReservePct),
    defaultShippingBufferPct: decimalToNumber(profile.defaultShippingBufferPct),
    defaultShippingBufferCents: profile.defaultShippingBufferCents,
    defaultPackagingOverheadCents: profile.defaultPackagingOverheadCents,
    defaultRecommendedMinMarginPct: decimalToNumber(
      profile.defaultRecommendedMinMarginPct
    ),
    defaultRecommendedTargetMarginPct: decimalToNumber(
      profile.defaultRecommendedTargetMarginPct
    ),
    targetMarginPct: decimalToNumber(profile.targetMarginPct),
    growthMarginPct: decimalToNumber(profile.growthMarginPct),
    notes: profile.notes ?? null,
    metadata: profile.metadata ?? null,
    materialRules: (profile.materialCostRules ?? []).map((rule: any) => ({
      ...mapRuleDates(rule),
      orgId: rule.organizationId,
      costProfileId: rule.costProfileId,
      sheetLengthIn: decimalToNumber(rule.sheetLengthIn) ?? 0,
      sheetWidthIn: decimalToNumber(rule.sheetWidthIn) ?? 0,
      usableYieldPct: decimalToNumber(rule.usableYieldPct),
      wastePct: decimalToNumber(rule.wastePct)
    })),
    edgeBandRules: (profile.edgeBandCostRules ?? []).map((rule: any) => ({
      ...mapRuleDates(rule),
      orgId: rule.organizationId,
      costProfileId: rule.costProfileId,
      wastePct: decimalToNumber(rule.wastePct),
      setupAllowanceLinearFt: decimalToNumber(rule.setupAllowanceLinearFt)
    })),
    packagingRules: (profile.packagingCostRules ?? []).map((rule: any) => ({
      ...mapRuleDates(rule),
      orgId: rule.organizationId,
      costProfileId: rule.costProfileId,
      foamCostCents: rule.foamCostCents,
      cornerProtectorCostCents: rule.cornerProtectorCostCents,
      packingMinutes: decimalToNumber(rule.packingMinutes),
      packingLaborOverrideCents: rule.packingLaborOverrideCents,
      packagingOverheadCents: rule.packagingOverheadCents,
      sortOrder: rule.sortOrder
    })),
    shippingRules: (profile.shippingCostRules ?? []).map((rule: any) => ({
      ...mapRuleDates(rule),
      orgId: rule.organizationId,
      costProfileId: rule.costProfileId,
      dimensionalDivisor: decimalToNumber(rule.dimensionalDivisor),
      dimensionalRateCents: rule.dimensionalRateCents,
      shippingBufferPct: decimalToNumber(rule.shippingBufferPct),
      shippingBufferCents: rule.shippingBufferCents,
      marketplaceHandlingCents: rule.marketplaceHandlingCents,
      sortOrder: rule.sortOrder
    })),
    amazonFeePresets: (profile.amazonFeePresets ?? []).map(mapAmazonFeePreset),
    shippingZoneRules: (profile.shippingZoneRules ?? []).map(mapShippingZoneRule),
    launchTemplates: (profile.launchTemplates ?? []).map(mapLaunchTemplate),
    launchGuardrailProfiles: (profile.launchGuardrailProfiles ?? []).map(mapLaunchGuardrailProfile),
    marketplaceMappingTemplates: (profile.marketplaceMappingTemplates ?? []).map(
      mapMarketplaceMappingTemplate
    ),
    channelMappingPresets: (profile.channelMappingPresets ?? []).map(mapChannelMappingPreset),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  };
}

function normalizeUpdateData(input: AnyRecord) {
  const data: AnyRecord = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      data[key] = value;
    }
  }
  return data;
}

function buildListingArtifactsForScenario(input: {
  scenarioRecord: any;
  launchTemplateName?: string | null;
  overrideReason?: string | null;
  overrideApproved?: boolean;
  approvedByMembershipId?: string | null;
  existingOverrideHistory?: Array<Record<string, unknown>> | null;
  mappingTemplate?: any | null;
  channelPreset?: any | null;
  comparisonSetId?: string | null;
  packageId?: string | null;
  exportVersion?: string | null;
  exportContractVersion?: string | null;
  explicitApproval?: boolean;
  currentApprovedArtifact?: boolean;
  presetSelectionSummary?: Record<string, unknown> | null;
  existingApprovalHistory?: Array<Record<string, unknown>> | null;
  worksheetVersion?: string | null;
}) {
  const mappedScenario = {
    ...mapScenario(input.scenarioRecord),
    costProfileId: input.scenarioRecord.costProfileId,
    result: input.scenarioRecord.resultSnapshot
  } as any;
  const listingReadiness = evaluateListingReadiness({
    scenario: mappedScenario
  });
  const handoffSummary =
    input.scenarioRecord.handoffSnapshot ??
    buildLaunchCandidateHandoff({
      scenario: mappedScenario,
      launchTemplateName: input.launchTemplateName ?? null,
      riskSummary: {
        riskScore: decimalToNumber(input.scenarioRecord.riskScore) ?? 0,
        riskLevel: input.scenarioRecord.riskLevel ?? "LOW",
        warnings: Array.isArray(input.scenarioRecord.warningSnapshot)
          ? input.scenarioRecord.warningSnapshot
          : [],
        summary:
          input.scenarioRecord.riskLevel === "HIGH"
            ? "Selected launch candidate is still guardrail-risky."
            : "Selected launch candidate clears the current guardrail profile."
      }
    });
  const exportSnapshot = buildLaunchCandidatePackage({
    scenario: mappedScenario,
    listingReadiness,
    launchTemplateName: input.launchTemplateName ?? null,
    handoffSummary
  });
  const validationSnapshot = buildMarketplaceFieldValidationResult({
    listingReadinessStatus: listingReadiness.listingReadinessStatus,
    marketplaceFields: listingReadiness.marketplaceFields,
    strongerAlerts: listingReadiness.strongerAlerts,
    overrideApproved: input.overrideApproved ?? false
  });
  const overrideSnapshot = buildPriceFloorOverrideSnapshot({
    strongerAlerts: listingReadiness.strongerAlerts,
    reason: input.overrideReason ?? null,
    approved: input.overrideApproved ?? false,
    approvedByMembershipId: input.approvedByMembershipId ?? null
  });
  const packageStatus = calculateListingPrepPackageStatus({
    listingReadinessStatus: listingReadiness.listingReadinessStatus,
    validationStatus: validationSnapshot.validationStatus,
    overrideSnapshot
  });
  const mappedMarketplaceFields = applyMarketplaceMappingTemplate({
    mappingTemplate: input.mappingTemplate
      ? {
          id: input.mappingTemplate.id,
          name: input.mappingTemplate.name,
          productLabelFormat: input.mappingTemplate.productLabelFormat ?? null,
          skuFormat: input.mappingTemplate.skuFormat ?? null,
          includeWarningNotes: input.mappingTemplate.includeWarningNotes ?? true,
          includeOverrideNotes: input.mappingTemplate.includeOverrideNotes ?? true,
          dimensionsFormat: input.mappingTemplate.dimensionsFormat ?? null,
          materialFormat: input.mappingTemplate.materialFormat ?? null,
          packagingFormat: input.mappingTemplate.packagingFormat ?? null,
          pricingFormat: input.mappingTemplate.pricingFormat ?? null,
          notes: input.mappingTemplate.notes ?? null,
          templateSnapshot: input.mappingTemplate.templateSnapshot ?? null
        }
      : null,
    marketplaceFields: listingReadiness.marketplaceFields,
    warningSnapshot: listingReadiness.strongerAlerts.warnings,
    overrideSnapshot
  });
  const channelMappedMarketplaceFields: Record<string, unknown> = applyChannelMappingPreset({
    preset: input.channelPreset
      ? {
          id: input.channelPreset.id,
          name: input.channelPreset.name,
          channelCode: input.channelPreset.channelCode,
          productLabelFormat: input.channelPreset.productLabelFormat ?? null,
          skuFormat: input.channelPreset.skuFormat ?? null,
          includeWarningNotes: input.channelPreset.includeWarningNotes ?? true,
          includeOverrideNotes: input.channelPreset.includeOverrideNotes ?? true,
          dimensionsFormat: input.channelPreset.dimensionsFormat ?? null,
          materialFormat: input.channelPreset.materialFormat ?? null,
          packagingFormat: input.channelPreset.packagingFormat ?? null,
          pricingFormat: input.channelPreset.pricingFormat ?? null,
          fieldOrderingSnapshot: input.channelPreset.fieldOrderingSnapshot ?? null,
          operatorPromptTemplateSnapshot:
            input.channelPreset.operatorPromptTemplateSnapshot ?? null,
          copyGroupOrderingSnapshot:
            input.channelPreset.copyGroupOrderingSnapshot ?? null,
          worksheetSectionLabelSnapshot:
            input.channelPreset.worksheetSectionLabelSnapshot ?? null,
          notes: input.channelPreset.notes ?? null
        }
      : null,
    marketplaceFields: mappedMarketplaceFields,
    warningSnapshot: listingReadiness.strongerAlerts.warnings,
    overrideSnapshot
  });
  const overrideHistorySnapshot = buildOverrideHistorySnapshot({
    existingHistory: input.existingOverrideHistory ?? null,
    latestOverride: overrideSnapshot,
    approvedAt: overrideSnapshot.overrideApproved ? new Date() : null,
    approvedByMembershipId: input.approvedByMembershipId ?? null
  });
  const exportVersion = input.exportVersion ?? "listing-prep-v1";
  const readyForListingPrepSummary = calculateReadyForListingPrep({
    listingReadinessStatus: listingReadiness.listingReadinessStatus,
    validationSnapshot,
    packageStatus,
    strongerAlerts: listingReadiness.strongerAlerts,
    overrideSnapshot,
    exportShapeSnapshot: {
      productLabel: channelMappedMarketplaceFields.productLabel,
      sku: channelMappedMarketplaceFields.sku
    },
    mappingTemplate: input.mappingTemplate
      ? { id: input.mappingTemplate.id, name: input.mappingTemplate.name }
      : null
  });
  const exportShapeSnapshot = buildStableListingPrepExportShape({
    packageId: input.packageId ?? null,
    comparisonSetId: input.comparisonSetId ?? null,
    scenarioId: input.scenarioRecord.id,
    scenarioName: input.scenarioRecord.name,
    listingReadinessStatus: listingReadiness.listingReadinessStatus,
    packageStatus: packageStatus.packageStatus,
    mappedMarketplaceFields: channelMappedMarketplaceFields,
    exportSnapshot,
    warningSnapshot: listingReadiness.strongerAlerts.warnings,
    overrideSnapshot,
    overrideHistorySnapshot,
    readyForListingPrepSummary,
    mappingTemplate: input.mappingTemplate
      ? { id: input.mappingTemplate.id, name: input.mappingTemplate.name }
      : null,
    exportVersion
  });
  const approval = calculateApprovalState({
    readyForListingPrepSummary,
    overrideSnapshot,
    manualAmazonExportSnapshot: exportShapeSnapshot,
    explicitApproval: input.explicitApproval ?? false
  });
  const approvalSummarySnapshot = buildApprovalSummarySnapshot({
    approvalState: approval.approvalState,
    readyForListingPrepSummary,
    overrideSnapshot,
    approvedByMembershipId: input.approvedByMembershipId ?? null
  });
  const approvalHistorySnapshot = buildApprovalHistorySnapshot({
    existingHistory: input.existingApprovalHistory ?? null,
    nextAction:
      approval.approvalState === "BLOCKED"
        ? "BLOCKED"
        : approval.approvalState === "READY_FOR_REVIEW"
          ? "MARKED_REVIEW"
          : approval.approvalState === "APPROVED_WITH_OVERRIDE"
            ? "APPROVED_WITH_OVERRIDE"
            : approval.approvalState === "APPROVED"
              ? "APPROVED"
              : null,
    actorMembershipId: input.approvedByMembershipId ?? null,
    reason:
      approval.approvalState === "READY_FOR_REVIEW"
        ? "Package requires review before approval."
        : approval.approvalState === "BLOCKED"
          ? "Package is blocked by listing readiness or price-floor conditions."
          : null,
    details: {
      approvalState: approval.approvalState,
      readyForListingPrepStatus: readyForListingPrepSummary.readyForListingPrepStatus
    }
  });
  const exportContractVersion = input.exportContractVersion ?? "manual-amazon-v1";
  const manualAmazonExportSnapshot = buildManualAmazonExportSnapshot({
    packageId: input.packageId ?? "pending-package",
    comparisonSetId: input.comparisonSetId ?? null,
    scenarioId: input.scenarioRecord.id,
    approvalState: approval.approvalState,
    exportContractVersion,
    exportShapeSnapshot,
    readyForListingPrepSummary,
    overrideSnapshot,
    channelPreset: input.channelPreset
      ? {
          id: input.channelPreset.id,
          name: input.channelPreset.name,
          channelCode: input.channelPreset.channelCode
        }
      : null
  });
  const manualListingWorksheetSnapshot = buildManualListingWorksheet({
    worksheetVersion: input.worksheetVersion ?? "manual-listing-v1",
    packageId: input.packageId ?? "pending-package",
    packageApprovalState: approval.approvalState,
    currentApprovedArtifact: Boolean(input.currentApprovedArtifact),
    selectedScenarioId: input.scenarioRecord.id,
    selectedScenarioName: input.scenarioRecord.name,
    exportShapeSnapshot,
    approvalSummarySnapshot,
    readyForListingPrepSummary,
    overrideSummary: overrideSnapshot,
    presetSelectionSummary: input.presetSelectionSummary ?? null
  });
  const operatorChecklistSnapshot = buildOperatorFieldChecklist({
    validationSnapshot,
    readyForListingPrepSummary,
    preset: input.channelPreset
      ? {
          requiredFieldChecklistSnapshot:
            input.channelPreset.requiredFieldChecklistSnapshot ?? null,
          optionalFieldChecklistSnapshot:
            input.channelPreset.optionalFieldChecklistSnapshot ?? null,
          worksheetPromptSnapshot: input.channelPreset.worksheetPromptSnapshot ?? null
        }
      : null
  });
  const channelHandoffSummarySnapshot = buildChannelHandoffSummary({
    preset: input.channelPreset
      ? {
          id: input.channelPreset.id,
          name: input.channelPreset.name,
          channelCode: input.channelPreset.channelCode,
          worksheetFieldOrderingSnapshot:
            input.channelPreset.worksheetFieldOrderingSnapshot ?? null,
          worksheetPromptSnapshot: input.channelPreset.worksheetPromptSnapshot ?? null,
          requiredFieldChecklistSnapshot:
            input.channelPreset.requiredFieldChecklistSnapshot ?? null,
          optionalFieldChecklistSnapshot:
            input.channelPreset.optionalFieldChecklistSnapshot ?? null,
          notes: input.channelPreset.notes ?? null
        }
      : null,
    selectionSummary: input.presetSelectionSummary ?? null
  });
  const operatorWorksheetVersion = "operator-listing-v1";
  const currentApprovedArtifactSummary = buildCurrentApprovedArtifactSummary({
    packageId: input.packageId ?? "pending-package",
    name: `${input.scenarioRecord.name} listing prep`,
    approvalState: approval.approvalState,
    currentApprovedArtifact: Boolean(input.currentApprovedArtifact),
    exportVersion,
    exportContractVersion,
    worksheetVersion: input.worksheetVersion ?? "manual-listing-v1",
    operatorWorksheetVersion,
    overrideSnapshot,
    approvedAt: null
  });
  const operatorWorksheetSnapshot = buildOperatorWorksheetPackage({
    operatorWorksheetVersion,
    packageId: input.packageId ?? "pending-package",
    packageName: `${input.scenarioRecord.name} listing prep`,
    packageApprovalState: approval.approvalState,
    currentApprovedArtifact: Boolean(input.currentApprovedArtifact),
    selectedScenarioId: input.scenarioRecord.id,
    selectedScenarioName: input.scenarioRecord.name,
    exportShapeSnapshot,
    manualListingWorksheetSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    channelHandoffSummary: channelHandoffSummarySnapshot,
    currentApprovedArtifactSummary,
    approvedAt: null
  });
  const operatorPromptSnapshot = buildOperatorPromptSnapshot({
    approvalState: approval.approvalState,
    currentApprovedArtifact: Boolean(input.currentApprovedArtifact),
    warningSnapshot: listingReadiness.strongerAlerts.warnings,
    overrideSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    preset: input.channelPreset
      ? {
          operatorPromptTemplateSnapshot:
            input.channelPreset.operatorPromptTemplateSnapshot ?? null
        }
      : null
  });
  const copyExportSnapshot = buildCopyExportSnapshot({
    packageId: input.packageId ?? "pending-package",
    exportShapeSnapshot,
    operatorWorksheetSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    promptSnapshot: operatorPromptSnapshot,
    preset: input.channelPreset
      ? {
          copyGroupOrderingSnapshot:
            input.channelPreset.copyGroupOrderingSnapshot ?? null,
          worksheetSectionLabelSnapshot:
            input.channelPreset.worksheetSectionLabelSnapshot ?? null
        }
      : null
  });
  const plainTextWorksheetSnapshot = buildPlainTextWorksheet({
    operatorWorksheetSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    promptSnapshot: operatorPromptSnapshot,
    currentApprovedArtifactSummary
  });
  const structuredWorksheetExportSnapshot = buildStructuredWorksheetExport({
    operatorWorksheetSnapshot,
    copyExportSnapshot,
    promptSnapshot: operatorPromptSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    currentApprovedArtifactSummary
  });
  const worksheetErgonomicsSummary = buildWorksheetErgonomicsSummary({
    checklistSnapshot: operatorChecklistSnapshot,
    promptSnapshot: operatorPromptSnapshot,
    copyExportSnapshot,
    currentApprovedArtifact: Boolean(input.currentApprovedArtifact)
  });
  const quickCopyVersion = "quick-copy-v1";
  const quickCopySummarySnapshot = buildQuickCopySummarySnapshot({
    exportShapeSnapshot,
    copyExportSnapshot,
    preset: input.channelPreset
      ? {
          quickCopyOrderingSnapshot:
            input.channelPreset.quickCopyOrderingSnapshot ?? null,
          shortSummaryFormatSnapshot:
            input.channelPreset.shortSummaryFormatSnapshot ?? null
        }
      : null
  });
  const finalReviewPromptSnapshot = buildFinalReviewPromptSnapshot({
    approvalState: approval.approvalState,
    currentApprovedArtifact: Boolean(input.currentApprovedArtifact),
    overrideSnapshot,
    warningSnapshot: listingReadiness.strongerAlerts.warnings,
    checklistSnapshot: operatorChecklistSnapshot,
    exportShapeSnapshot,
    preset: input.channelPreset
      ? {
          finalReviewPromptTemplateSnapshot:
            input.channelPreset.finalReviewPromptTemplateSnapshot ?? null
        }
      : null
  });
  const artifactHandoffSummarySnapshot = buildArtifactHandoffSummarySnapshot({
    packageId: input.packageId ?? "pending-package",
    packageName: `${input.scenarioRecord.name} listing prep`,
    approvalState: approval.approvalState,
    currentApprovedArtifact: Boolean(input.currentApprovedArtifact),
    exportContractVersion,
    worksheetVersion: input.worksheetVersion ?? "manual-listing-v1",
    operatorWorksheetVersion,
    quickCopyVersion,
    overrideSnapshot
  });
  const shortPlainTextSummarySnapshot = buildShortPlainTextSummary({
    exportShapeSnapshot,
    approvalState: approval.approvalState,
    currentApprovedArtifact: Boolean(input.currentApprovedArtifact),
    readyForListingPrepSummary,
    preset: input.channelPreset
      ? {
          shortSummaryFormatSnapshot:
            input.channelPreset.shortSummaryFormatSnapshot ?? null
        }
      : null
  });
  const completionCueSnapshot = buildCompletionCueSnapshot({
    approvalState: approval.approvalState,
    currentApprovedArtifact: Boolean(input.currentApprovedArtifact),
    overrideSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    warningSnapshot: listingReadiness.strongerAlerts.warnings,
    preset: input.channelPreset
      ? {
          completionCueTemplateSnapshot:
            input.channelPreset.completionCueTemplateSnapshot ?? null
        }
      : null
  });
  const internalShareSummarySnapshot = buildInternalShareSummarySnapshot({
    packageId: input.packageId ?? "pending-package",
    packageName: `${input.scenarioRecord.name} listing prep`,
    approvalState: approval.approvalState,
    currentApprovedArtifact: Boolean(input.currentApprovedArtifact),
    currentApprovedArtifactSummary,
    quickCopySummarySnapshot,
    finalReviewPromptSnapshot,
    artifactHandoffSummarySnapshot,
    shortPlainTextSummarySnapshot,
    warningSnapshot: listingReadiness.strongerAlerts.warnings,
    preset: input.channelPreset
      ? {
          shareSummaryFormatSnapshot:
            input.channelPreset.shareSummaryFormatSnapshot ?? null
        }
      : null
  });
  const shortShareTextSnapshot = buildShortShareTextSnapshot({
    packageName: `${input.scenarioRecord.name} listing prep`,
    approvalState: approval.approvalState,
    currentApprovedArtifact: Boolean(input.currentApprovedArtifact),
    quickCopySummarySnapshot,
    completionCueSnapshot,
    preset: input.channelPreset
      ? {
          shareSummaryFormatSnapshot:
            input.channelPreset.shareSummaryFormatSnapshot ?? null
        }
      : null
  });
  const lastChangeSummarySnapshot = buildLastChangeSummarySnapshot({
    approvalHistorySnapshot,
    overrideHistorySnapshot,
    channelPresetSelectionSummary: input.presetSelectionSummary ?? null
  });
  const runbookVersion = "manual-runbook-v1";
  const finalRunbookSnapshot = buildFinalRunbookSnapshot({
    packageId: input.packageId ?? "pending-package",
    packageName: `${input.scenarioRecord.name} listing prep`,
    approvalState: approval.approvalState,
    currentApprovedArtifactSummary,
    quickCopySummarySnapshot,
    finalReviewPromptSnapshot,
    completionCueSnapshot,
    warningSnapshot: listingReadiness.strongerAlerts.warnings,
    overrideSnapshot,
    internalShareSummarySnapshot,
    lastChangeSummarySnapshot,
    preset: input.channelPreset
      ? {
          finalReviewOrderingSnapshot:
            input.channelPreset.finalReviewOrderingSnapshot ?? null
        }
      : null
  });
  const worksheetSummarySnapshot = buildWorksheetSummarySnapshot({
    worksheet: operatorWorksheetSnapshot,
    presetSelectionSummary: input.presetSelectionSummary ?? null
  });

  return {
    listingReadinessStatus: listingReadiness.listingReadinessStatus,
    listingReadinessSnapshot: {
      summary: listingReadiness.listingReadinessSummary,
      launchReadyBoolean: listingReadiness.launchReadyBoolean,
      missingFieldFlags: listingReadiness.missingFieldFlags
    },
    marketplaceFieldSnapshot: channelMappedMarketplaceFields,
    strongerAlertSnapshot: listingReadiness.strongerAlerts,
    exportSnapshot,
    handoffSummary,
    validationSnapshot,
    overrideSnapshot,
    packageStatus,
    exportVersion,
    exportMetadata: buildExportMetadataBlock({
      exportVersion,
      packageId: input.packageId ?? null,
      mappingTemplate: input.mappingTemplate
        ? { id: input.mappingTemplate.id, name: input.mappingTemplate.name }
        : null
    }),
    exportShapeSnapshot,
    overrideHistorySnapshot,
    readyForListingPrep: readyForListingPrepSummary.readyForListingPrep,
    readyForListingPrepSummary,
    approvalState: approval.approvalState,
    approvalSummarySnapshot,
    approvalHistorySnapshot,
    exportContractVersion,
    manualAmazonExportSnapshot,
    manualListingWorksheetSnapshot,
    worksheetVersion: input.worksheetVersion ?? "manual-listing-v1",
    worksheetSummarySnapshot,
    operatorWorksheetSnapshot,
    operatorWorksheetVersion,
    operatorChecklistSnapshot,
    channelHandoffSummarySnapshot,
    currentApprovedArtifactSummary,
    operatorPromptSnapshot,
    copyExportSnapshot,
    plainTextWorksheetSnapshot,
    structuredWorksheetExportSnapshot,
    worksheetErgonomicsSummary,
    quickCopySummarySnapshot,
    finalReviewPromptSnapshot,
    artifactHandoffSummarySnapshot,
    shortPlainTextSummarySnapshot,
    quickCopyVersion,
    finalRunbookSnapshot,
    completionCueSnapshot,
    internalShareSummarySnapshot,
    shortShareTextSnapshot,
    runbookVersion,
    lastChangeSummarySnapshot,
    channelPresetSelectionSummary: input.presetSelectionSummary ?? null
  };
}

function mapCalculation(record: any) {
  return {
    id: record.id,
    orgId: record.organizationId,
    costProfileId: record.costProfileId,
    costProfileName: record.costProfile?.name ?? null,
    amazonFeePresetId: record.amazonFeePresetId ?? null,
    amazonFeePresetName: record.amazonFeePreset?.name ?? null,
    shippingZoneRuleId: record.shippingZoneRuleId ?? null,
    shippingZoneRuleName: record.shippingZoneRule?.name ?? null,
    name: record.name ?? null,
    sku: record.sku ?? null,
    quantity: record.quantity,
    lengthIn: decimalToNumber(record.lengthIn) ?? 0,
    depthIn: decimalToNumber(record.depthIn) ?? 0,
    thicknessIn: decimalToNumber(record.thicknessIn),
    materialCode: record.materialCode,
    edgeBandCode: record.edgeBandCode ?? null,
    edgeBandPattern: record.edgeBandPattern,
    packagingCode: record.packagingCode ?? null,
    shippingCode: record.shippingCode ?? null,
    laborMinutes: decimalToNumber(record.laborMinutes) ?? 0,
    machineMinutes: decimalToNumber(record.machineMinutes) ?? 0,
    overheadMinutes: decimalToNumber(record.overheadMinutes),
    packingMinutes: decimalToNumber(record.packingMinutes),
    materialCostCents: record.materialCostCents,
    edgeBandCostCents: record.edgeBandCostCents,
    laborCostCents: record.laborCostCents,
    machineCostCents: record.machineCostCents,
    packagingCostCents: record.packagingCostCents,
    packingLaborCostCents: record.packingLaborCostCents,
    shippingCostCents: record.shippingCostCents,
    shippingBufferCostCents: record.shippingBufferCostCents,
    overheadCostCents: record.overheadCostCents,
    marketplaceFeeCostCents: record.marketplaceFeeCostCents,
    referralFeeCostCents: record.referralFeeCostCents ?? 0,
    closingFeeCostCents: record.closingFeeCostCents ?? 0,
    fulfillmentFeeCostCents: record.fulfillmentFeeCostCents ?? 0,
    storageAllowanceCostCents: record.storageAllowanceCostCents ?? 0,
    advertisingAllowanceCostCents: record.advertisingAllowanceCostCents ?? 0,
    returnReserveCostCents: record.returnReserveCostCents,
    damageReserveCostCents: record.damageReserveCostCents,
    miscMarketplaceCostCents: record.miscMarketplaceCostCents ?? 0,
    subtotalCostCents: record.subtotalCostCents,
    breakEvenPriceCents: record.breakEvenPriceCents,
    recommendedMinSellPriceCents: record.recommendedMinSellPriceCents,
    recommendedTargetSellPriceCents: record.recommendedTargetSellPriceCents,
    targetMarginPct: decimalToNumber(record.targetMarginPct),
    growthMarginPct: decimalToNumber(record.growthMarginPct),
    recommendedInternalPriceCents: record.recommendedInternalPriceCents,
    recommendedSellPriceCents: record.recommendedSellPriceCents,
    assumptionsSnapshot: record.assumptionsSnapshot,
    packagingSnapshot: record.packagingSnapshot,
    shippingSnapshot: record.shippingSnapshot,
    pricingSnapshot: record.pricingSnapshot,
    amazonFeeSnapshot: record.amazonFeeSnapshot,
    shippingZoneSnapshot: record.shippingZoneSnapshot,
    resultSnapshot: record.resultSnapshot,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function mapScenario(record: any) {
  return {
    id: record.id,
    orgId: record.organizationId,
    name: record.name,
    costProfileId: record.costProfileId,
    amazonFeePresetId: record.amazonFeePresetId ?? null,
    amazonFeePresetName: record.amazonFeePreset?.name ?? null,
    shippingZoneRuleId: record.shippingZoneRuleId ?? null,
    shippingZoneRuleName: record.shippingZoneRule?.name ?? null,
    packagingRuleId: record.packagingRuleId ?? null,
    packagingRuleName: record.packagingRule?.packagingName ?? null,
    shippingRuleId: record.shippingRuleId ?? null,
    shippingRuleName: record.shippingRule?.shippingName ?? null,
    shelfCostCalculationId: record.shelfCostCalculationId ?? null,
    launchStrategy: record.launchStrategy ?? null,
    guardrailProfileId: record.guardrailProfileId ?? null,
    guardrailProfileName: record.guardrailProfile?.name ?? null,
    rankingScore: decimalToNumber(record.rankingScore),
    rankingSummary: record.rankingSummary ?? null,
    riskScore: decimalToNumber(record.riskScore),
    riskLevel: record.riskLevel ?? null,
    listingReadinessStatus: record.listingReadinessStatus ?? null,
    guardrailSnapshot: record.guardrailSnapshot ?? null,
    warningSnapshot: record.warningSnapshot ?? null,
    handoffSnapshot: record.handoffSnapshot ?? null,
    listingReadinessSnapshot: record.listingReadinessSnapshot ?? null,
    marketplaceFieldSnapshot: record.marketplaceFieldSnapshot ?? null,
    strongerAlertSnapshot: record.strongerAlertSnapshot ?? null,
    exportSnapshot: record.exportSnapshot ?? null,
    isRecommendedLaunchScenario: Boolean(record.isRecommendedLaunchScenario),
    isLaunchApprovedCandidate: Boolean(record.isLaunchApprovedCandidate),
    listingPrepPackageId: record.listingPrepPackageId ?? null,
    priceFloorOverrideRequested: Boolean(record.priceFloorOverrideRequested),
    priceFloorOverrideApproved: Boolean(record.priceFloorOverrideApproved),
    priceFloorOverrideSnapshot: record.priceFloorOverrideSnapshot ?? null,
    latestOverrideSummarySnapshot: record.latestOverrideSummarySnapshot ?? null,
    latestApprovalSummarySnapshot: record.latestApprovalSummarySnapshot ?? null,
    latestPresetSelectionSummarySnapshot: record.latestPresetSelectionSummarySnapshot ?? null,
    latestWorksheetSummarySnapshot: record.latestWorksheetSummarySnapshot ?? null,
    latestOperatorPromptSummarySnapshot: record.latestOperatorPromptSummarySnapshot ?? null,
    latestQuickCopySummarySnapshot: record.latestQuickCopySummarySnapshot ?? null,
    latestRunbookSummarySnapshot: record.latestRunbookSummarySnapshot ?? null,
    assumptionsSnapshot: record.assumptionsSnapshot,
    resultSnapshot: record.resultSnapshot,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function mapComparisonSet(record: any) {
  return {
    id: record.id,
    orgId: record.organizationId,
    name: record.name,
    notes: record.notes ?? null,
    baseShelfSpecSnapshot: record.baseShelfSpecSnapshot,
    recommendedScenarioId: record.recommendedScenarioId ?? null,
    recommendedScenarioName: record.recommendedScenario?.name ?? null,
    selectedLaunchScenarioId: record.selectedLaunchScenarioId ?? null,
    selectedLaunchScenarioName: record.selectedLaunchScenario?.name ?? null,
    rankingSnapshot: record.rankingSnapshot ?? null,
    comparisonSummary: record.comparisonSummary ?? null,
    selectedLaunchSummary: record.selectedLaunchSummary ?? null,
    riskSummary: record.riskSummary ?? null,
    selectedLaunchExportSnapshot: record.selectedLaunchExportSnapshot ?? null,
    selectedLaunchReadinessStatus: record.selectedLaunchReadinessStatus ?? null,
    selectedLaunchWarningSnapshot: record.selectedLaunchWarningSnapshot ?? null,
    selectedListingPrepPackageId: record.selectedListingPrepPackageId ?? null,
    selectedListingPrepPackageName: record.selectedListingPrepPackage?.name ?? null,
    listingPrepSummarySnapshot: record.listingPrepSummarySnapshot ?? null,
    selectedListingPrepReadySnapshot: record.selectedListingPrepReadySnapshot ?? null,
    selectedListingPrepExportVersion: record.selectedListingPrepExportVersion ?? null,
    selectedListingPrepApprovalSnapshot: record.selectedListingPrepApprovalSnapshot ?? null,
    selectedListingPrepExportContractVersion:
      record.selectedListingPrepExportContractVersion ?? null,
    selectedWorksheetVersion: record.selectedWorksheetVersion ?? null,
    selectedWorksheetSummarySnapshot: record.selectedWorksheetSummarySnapshot ?? null,
    selectedOperatorWorksheetVersion: record.selectedOperatorWorksheetVersion ?? null,
    selectedOperatorWorksheetSummarySnapshot:
      record.selectedOperatorWorksheetSummarySnapshot ?? null,
    selectedWorksheetErgonomicsSummary:
      record.selectedWorksheetErgonomicsSummary ?? null,
    selectedQuickCopySummarySnapshot:
      record.selectedQuickCopySummarySnapshot ?? null,
    selectedFinalReviewPromptSnapshot:
      record.selectedFinalReviewPromptSnapshot ?? null,
    selectedRunbookVersion: record.selectedRunbookVersion ?? null,
    selectedRunbookSummarySnapshot: record.selectedRunbookSummarySnapshot ?? null,
    scenarios: (record.scenarios ?? []).map((entry: any) => ({
      id: entry.id,
      sortOrder: entry.sortOrder ?? null,
      createdAt: entry.createdAt.toISOString(),
      scenario: mapScenario(entry.calculationScenario)
    })),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function mapListingPrepPackage(record: any) {
  return {
    id: record.id,
    orgId: record.organizationId,
    comparisonSetId: record.comparisonSetId ?? null,
    calculationScenarioId: record.calculationScenarioId,
    name: record.name,
    status: record.status,
    listingReadinessStatus: record.listingReadinessStatus,
    exportSnapshot: record.exportSnapshot,
    marketplaceFieldSnapshot: record.marketplaceFieldSnapshot,
    validationSnapshot: record.validationSnapshot,
    warningSnapshot: record.warningSnapshot ?? null,
    overrideSnapshot: record.overrideSnapshot ?? null,
    marketplaceMappingTemplateId: record.marketplaceMappingTemplateId ?? null,
    marketplaceMappingTemplateName: record.marketplaceMappingTemplate?.name ?? null,
    channelMappingPresetId: record.channelMappingPresetId ?? null,
    channelMappingPresetName: record.channelMappingPreset?.name ?? null,
    approvalState: record.approvalState ?? "DRAFT",
    approvalSummarySnapshot: record.approvalSummarySnapshot ?? null,
    exportVersion: record.exportVersion ?? null,
    exportContractVersion: record.exportContractVersion ?? null,
    exportShapeSnapshot: record.exportShapeSnapshot ?? null,
    overrideHistorySnapshot: record.overrideHistorySnapshot ?? null,
    readyForListingPrep: Boolean(record.readyForListingPrep),
    readyForListingPrepSummary: record.readyForListingPrepSummary ?? null,
    manualAmazonExportSnapshot: record.manualAmazonExportSnapshot ?? null,
    approvalHistorySnapshot: record.approvalHistorySnapshot ?? null,
    autoAppliedChannelPreset: Boolean(record.autoAppliedChannelPreset),
    channelPresetSelectionSummary: record.channelPresetSelectionSummary ?? null,
    manualListingWorksheetSnapshot: record.manualListingWorksheetSnapshot ?? null,
    worksheetVersion: record.worksheetVersion ?? null,
    worksheetSummarySnapshot: record.worksheetSummarySnapshot ?? null,
    operatorWorksheetSnapshot: record.operatorWorksheetSnapshot ?? null,
    operatorWorksheetVersion: record.operatorWorksheetVersion ?? null,
    operatorChecklistSnapshot: record.operatorChecklistSnapshot ?? null,
    channelHandoffSummarySnapshot: record.channelHandoffSummarySnapshot ?? null,
    currentApprovedArtifactSummary: record.currentApprovedArtifactSummary ?? null,
    operatorPromptSnapshot: record.operatorPromptSnapshot ?? null,
    copyExportSnapshot: record.copyExportSnapshot ?? null,
    plainTextWorksheetSnapshot: record.plainTextWorksheetSnapshot ?? null,
    structuredWorksheetExportSnapshot: record.structuredWorksheetExportSnapshot ?? null,
    worksheetErgonomicsSummary: record.worksheetErgonomicsSummary ?? null,
    quickCopySummarySnapshot: record.quickCopySummarySnapshot ?? null,
    finalReviewPromptSnapshot: record.finalReviewPromptSnapshot ?? null,
    artifactHandoffSummarySnapshot: record.artifactHandoffSummarySnapshot ?? null,
    shortPlainTextSummarySnapshot: record.shortPlainTextSummarySnapshot ?? null,
    quickCopyVersion: record.quickCopyVersion ?? null,
    finalRunbookSnapshot: record.finalRunbookSnapshot ?? null,
    completionCueSnapshot: record.completionCueSnapshot ?? null,
    internalShareSummarySnapshot: record.internalShareSummarySnapshot ?? null,
    shortShareTextSnapshot: record.shortShareTextSnapshot ?? null,
    runbookVersion: record.runbookVersion ?? null,
    lastChangeSummarySnapshot: record.lastChangeSummarySnapshot ?? null,
    currentApprovedArtifact: Boolean(record.currentApprovedArtifact),
    notes: record.notes ?? null,
    approvedAt: record.approvedAt?.toISOString() ?? null,
    approvedByMembershipId: record.approvedByMembershipId ?? null,
    scenarioName: record.calculationScenario?.name ?? null,
    comparisonSetName: record.comparisonSet?.name ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function getScenarioRiskSummaryText(snapshot: unknown) {
  const guardrailSnapshot = snapshot as Record<string, unknown> | null;
  if (guardrailSnapshot && typeof guardrailSnapshot.summary === "string") {
    return String(guardrailSnapshot.summary);
  }
  return null;
}

async function resolveChannelPresetForListingPackage(input: {
  organizationId: string;
  costProfileId: string;
  selectedPresetId?: string | null;
  scenarioRecord: any;
  readyForListingPrepStatus?: string | null;
  listingReadinessStatus?: string | null;
  feePresetLabel?: string | null;
  shippingZoneLabel?: string | null;
}) {
  const launchContext = buildLaunchContextSnapshot({
    channelCode: "AMAZON_MANUAL",
    launchStrategy: input.scenarioRecord.launchStrategy ?? null,
    listingReadinessStatus: input.listingReadinessStatus ?? null,
    readyForListingPrepStatus: input.readyForListingPrepStatus ?? null,
    overrideApproved: Boolean(input.scenarioRecord.priceFloorOverrideApproved),
    feePresetLabel: input.feePresetLabel ?? null,
    shippingZoneLabel: input.shippingZoneLabel ?? null
  });

  if (input.selectedPresetId) {
    const selectedPreset = await getChannelMappingPresetRecord({
      organizationId: input.organizationId,
      channelMappingPresetId: input.selectedPresetId
    });
    if (!selectedPreset) {
      throw new Error("Channel mapping preset not found.");
    }
    return {
      preset: selectedPreset,
      autoApplied: false,
      selectionSummary: buildPresetSelectionSummary({
        preset: selectedPreset,
        launchContext,
        autoApplied: false,
        manualReason: "Explicitly chosen for this listing-prep package."
      })
    };
  }

  const availablePresets = await listChannelMappingPresetsForOrganization({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId
  });
  const suggestedPreset = selectBestDefaultChannelPreset({
    presets: availablePresets,
    launchContext
  });

  return {
    preset: suggestedPreset,
    autoApplied: Boolean(suggestedPreset),
    selectionSummary: buildPresetSelectionSummary({
      preset: suggestedPreset,
      launchContext,
      autoApplied: Boolean(suggestedPreset)
    })
  };
}

export async function createCostProfile(input: {
  organizationId: string;
  name: string;
  status?: "ACTIVE" | "ARCHIVED";
  currency?: "USD";
  defaultMaterialWastePct?: number;
  defaultEdgeBandWastePct?: number;
  defaultLaborRateCentsPerHour?: number;
  defaultMachineRateCentsPerHour?: number;
  defaultOverheadRateCentsPerHour?: number | null;
  defaultPackagingAllowanceCents?: number | null;
  defaultShippingAllowanceCents?: number | null;
  defaultPackingLaborRateCentsPerHour?: number | null;
  defaultPackingMinutes?: number | null;
  defaultMarketplaceFeePct?: number | null;
  defaultReturnReservePct?: number | null;
  defaultDamageReservePct?: number | null;
  defaultShippingBufferPct?: number | null;
  defaultShippingBufferCents?: number | null;
  defaultPackagingOverheadCents?: number | null;
  defaultRecommendedMinMarginPct?: number | null;
  defaultRecommendedTargetMarginPct?: number | null;
  targetMarginPct?: number | null;
  growthMarginPct?: number | null;
  notes?: string | null;
  metadata?: unknown;
}) {
  const profile = await createCostProfileRecord(input);
  const hydrated = await getCostProfileRecord({
    organizationId: input.organizationId,
    costProfileId: profile.id
  });

  return { ok: true, profile: mapCostProfile(hydrated) };
}

export async function listCostProfiles(input: { organizationId: string }) {
  const profiles = await listCostProfilesForOrganization(input.organizationId);
  return {
    ok: true,
    profiles: profiles.map((profile: any) => ({
      id: profile.id,
      orgId: profile.organizationId,
      name: profile.name,
      status: profile.status,
      isDefault: profile.isDefault,
      currency: profile.currency,
      targetMarginPct: decimalToNumber(profile.targetMarginPct),
      growthMarginPct: decimalToNumber(profile.growthMarginPct),
      updatedAt: profile.updatedAt.toISOString()
    }))
  };
}

export async function getCostProfile(input: { organizationId: string; costProfileId: string }) {
  const profile = await getCostProfileRecord(input);
  if (!profile) {
    throw new Error("Cost profile not found.");
  }

  return { ok: true, profile: mapCostProfile(profile) };
}

export async function updateCostProfile(input: {
  organizationId: string;
  costProfileId: string;
} & AnyRecord) {
  const existing = await getCostProfileRecord(input);
  if (!existing) {
    throw new Error("Cost profile not found.");
  }

  await updateCostProfileRecord({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId,
    data: normalizeUpdateData({ ...input, organizationId: undefined, costProfileId: undefined })
  });

  const updated = await getCostProfileRecord(input);
  return { ok: true, profile: mapCostProfile(updated) };
}

export async function createMaterialCostRule(input: {
  organizationId: string;
  costProfileId: string;
  materialCode: string;
  materialName: string;
  thicknessLabel?: string | null;
  sheetLengthIn: number;
  sheetWidthIn: number;
  sheetCostCents: number;
  usableYieldPct?: number | null;
  wastePct?: number | null;
  active?: boolean;
}) {
  await createMaterialCostRuleRecord(input);
  return getCostProfile({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId
  });
}

export async function updateMaterialCostRule(input: {
  organizationId: string;
  materialRuleId: string;
} & AnyRecord) {
  await updateMaterialCostRuleRecord({
    organizationId: input.organizationId,
    materialRuleId: input.materialRuleId,
    data: normalizeUpdateData({ ...input, organizationId: undefined, materialRuleId: undefined })
  });
  return { ok: true };
}

export async function createEdgeBandCostRule(input: {
  organizationId: string;
  costProfileId: string;
  edgeBandCode: string;
  edgeBandName: string;
  costCentsPerLinearFoot: number;
  wastePct?: number | null;
  setupAllowanceLinearFt?: number | null;
  active?: boolean;
}) {
  await createEdgeBandCostRuleRecord(input);
  return getCostProfile({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId
  });
}

export async function updateEdgeBandCostRule(input: {
  organizationId: string;
  edgeBandRuleId: string;
} & AnyRecord) {
  await updateEdgeBandCostRuleRecord({
    organizationId: input.organizationId,
    edgeBandRuleId: input.edgeBandRuleId,
    data: normalizeUpdateData({ ...input, organizationId: undefined, edgeBandRuleId: undefined })
  });
  return { ok: true };
}

export async function createPackagingCostRule(input: {
  organizationId: string;
  costProfileId: string;
  packagingCode: string;
  packagingName: string;
  boxCostCents?: number | null;
  bubbleWrapCostCents?: number | null;
  tapeCostCents?: number | null;
  labelCostCents?: number | null;
  insertFlyerCostCents?: number | null;
  shrinkWrapCostCents?: number | null;
  foamCostCents?: number | null;
  cornerProtectorCostCents?: number | null;
  packingMinutes?: number | null;
  packingLaborOverrideCents?: number | null;
  packagingOverheadCents?: number | null;
  otherPackagingCostCents?: number | null;
  sortOrder?: number | null;
  active?: boolean;
}) {
  await createPackagingCostRuleRecord(input);
  return getCostProfile({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId
  });
}

export async function updatePackagingCostRule(input: {
  organizationId: string;
  packagingRuleId: string;
} & AnyRecord) {
  await updatePackagingCostRuleRecord({
    organizationId: input.organizationId,
    packagingRuleId: input.packagingRuleId,
    data: normalizeUpdateData({ ...input, organizationId: undefined, packagingRuleId: undefined })
  });
  return { ok: true };
}

export async function createShippingCostRule(input: {
  organizationId: string;
  costProfileId: string;
  shippingCode: string;
  shippingName: string;
  baseCostCents: number;
  costPerPoundCents?: number | null;
  costPerCubicInchCents?: number | null;
  dimensionalDivisor?: number | null;
  dimensionalRateCents?: number | null;
  shippingBufferPct?: number | null;
  shippingBufferCents?: number | null;
  marketplaceHandlingCents?: number | null;
  sortOrder?: number | null;
  flatOverride?: number | null;
  active?: boolean;
}) {
  await createShippingCostRuleRecord(input);
  return getCostProfile({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId
  });
}

export async function updateShippingCostRule(input: {
  organizationId: string;
  shippingRuleId: string;
} & AnyRecord) {
  await updateShippingCostRuleRecord({
    organizationId: input.organizationId,
    shippingRuleId: input.shippingRuleId,
    data: normalizeUpdateData({ ...input, organizationId: undefined, shippingRuleId: undefined })
  });
  return { ok: true };
}

export async function createAmazonFeePreset(input: {
  organizationId: string;
  costProfileId?: string | null;
  name: string;
  status?: "ACTIVE" | "ARCHIVED";
  referralFeePct: number;
  closingFeeCents?: number | null;
  fulfillmentFeeCents?: number | null;
  storageAllowanceCents?: number | null;
  advertisingAllowancePct?: number | null;
  advertisingAllowanceCents?: number | null;
  returnReservePct?: number | null;
  returnReserveCents?: number | null;
  damageReservePct?: number | null;
  damageReserveCents?: number | null;
  miscMarketplacePct?: number | null;
  miscMarketplaceCents?: number | null;
  notes?: string | null;
  metadata?: unknown;
}) {
  const costProfileId = input.costProfileId ?? null;
  if (costProfileId) {
    const profile = await getCostProfileRecord({ organizationId: input.organizationId, costProfileId });
    if (!profile) {
      throw new Error("Cost profile not found.");
    }
  }

  const preset = await createAmazonFeePresetRecord(input);
  const hydrated = await getAmazonFeePresetRecord({
    organizationId: input.organizationId,
    presetId: preset.id
  });
  return { ok: true, preset: mapAmazonFeePreset(hydrated) };
}

export async function listAmazonFeePresets(input: { organizationId: string; costProfileId?: string }) {
  const presets = await listAmazonFeePresetsForOrganization(input);
  return { ok: true, presets: presets.map(mapAmazonFeePreset) };
}

export async function getAmazonFeePreset(input: { organizationId: string; presetId: string }) {
  const preset = await getAmazonFeePresetRecord(input);
  if (!preset) {
    throw new Error("Amazon fee preset not found.");
  }
  return { ok: true, preset: mapAmazonFeePreset(preset) };
}

export async function updateAmazonFeePreset(input: {
  organizationId: string;
  presetId: string;
} & AnyRecord) {
  const existing = await getAmazonFeePresetRecord({
    organizationId: input.organizationId,
    presetId: input.presetId
  });
  if (!existing) {
    throw new Error("Amazon fee preset not found.");
  }

  await updateAmazonFeePresetRecord({
    organizationId: input.organizationId,
    presetId: input.presetId,
    data: normalizeUpdateData({ ...input, organizationId: undefined, presetId: undefined })
  });

  const updated = await getAmazonFeePresetRecord({
    organizationId: input.organizationId,
    presetId: input.presetId
  });
  return { ok: true, preset: mapAmazonFeePreset(updated) };
}

export async function createShippingZoneRule(input: {
  organizationId: string;
  costProfileId?: string | null;
  name: string;
  zoneCode: string;
  status?: "ACTIVE" | "ARCHIVED";
  baseCostCents: number;
  weightAdderCents?: number | null;
  dimensionalAdderCents?: number | null;
  bufferPct?: number | null;
  bufferCents?: number | null;
  marketplaceHandlingCents?: number | null;
  notes?: string | null;
  metadata?: unknown;
}) {
  const costProfileId = input.costProfileId ?? null;
  if (costProfileId) {
    const profile = await getCostProfileRecord({ organizationId: input.organizationId, costProfileId });
    if (!profile) {
      throw new Error("Cost profile not found.");
    }
  }

  const rule = await createShippingZoneRuleRecord(input);
  const hydrated = await getShippingZoneRuleRecord({
    organizationId: input.organizationId,
    zoneRuleId: rule.id
  });
  return { ok: true, shippingZoneRule: mapShippingZoneRule(hydrated) };
}

export async function listShippingZoneRules(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  const rules = await listShippingZoneRulesForOrganization(input);
  return { ok: true, shippingZoneRules: rules.map(mapShippingZoneRule) };
}

export async function getShippingZoneRule(input: { organizationId: string; zoneRuleId: string }) {
  const rule = await getShippingZoneRuleRecord(input);
  if (!rule) {
    throw new Error("Shipping zone rule not found.");
  }
  return { ok: true, shippingZoneRule: mapShippingZoneRule(rule) };
}

export async function updateShippingZoneRule(input: {
  organizationId: string;
  zoneRuleId: string;
} & AnyRecord) {
  const existing = await getShippingZoneRuleRecord({
    organizationId: input.organizationId,
    zoneRuleId: input.zoneRuleId
  });
  if (!existing) {
    throw new Error("Shipping zone rule not found.");
  }

  await updateShippingZoneRuleRecord({
    organizationId: input.organizationId,
    zoneRuleId: input.zoneRuleId,
    data: normalizeUpdateData({ ...input, organizationId: undefined, zoneRuleId: undefined })
  });

  const updated = await getShippingZoneRuleRecord({
    organizationId: input.organizationId,
    zoneRuleId: input.zoneRuleId
  });
  return { ok: true, shippingZoneRule: mapShippingZoneRule(updated) };
}

export async function createMarketplaceMappingTemplate(input: {
  organizationId: string;
  costProfileId?: string | null;
  name: string;
  status?: "ACTIVE" | "ARCHIVED";
  productLabelFormat?: string | null;
  skuFormat?: string | null;
  includeWarningNotes?: boolean;
  includeOverrideNotes?: boolean;
  dimensionsFormat?: string | null;
  materialFormat?: string | null;
  packagingFormat?: string | null;
  pricingFormat?: string | null;
  notes?: string | null;
  templateSnapshot?: unknown;
}) {
  const costProfileId = input.costProfileId ?? null;
  if (costProfileId) {
    const profile = await getCostProfileRecord({ organizationId: input.organizationId, costProfileId });
    if (!profile) {
      throw new Error("Cost profile not found.");
    }
  }

  const template = await createMarketplaceMappingTemplateRecord(input);
  const hydrated = await getMarketplaceMappingTemplateRecord({
    organizationId: input.organizationId,
    mappingTemplateId: template.id
  });
  return { ok: true, marketplaceMappingTemplate: mapMarketplaceMappingTemplate(hydrated) };
}

export async function listMarketplaceMappingTemplates(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  const templates = await listMarketplaceMappingTemplatesForOrganization(input);
  return { ok: true, marketplaceMappingTemplates: templates.map(mapMarketplaceMappingTemplate) };
}

export async function getMarketplaceMappingTemplate(input: {
  organizationId: string;
  mappingTemplateId: string;
}) {
  const template = await getMarketplaceMappingTemplateRecord(input);
  if (!template) {
    throw new Error("Marketplace mapping template not found.");
  }
  return { ok: true, marketplaceMappingTemplate: mapMarketplaceMappingTemplate(template) };
}

export async function updateMarketplaceMappingTemplate(input: {
  organizationId: string;
  mappingTemplateId: string;
} & AnyRecord) {
  const existing = await getMarketplaceMappingTemplateRecord({
    organizationId: input.organizationId,
    mappingTemplateId: input.mappingTemplateId
  });
  if (!existing) {
    throw new Error("Marketplace mapping template not found.");
  }

  await updateMarketplaceMappingTemplateRecord({
    organizationId: input.organizationId,
    mappingTemplateId: input.mappingTemplateId,
    data: normalizeUpdateData({
      ...input,
      organizationId: undefined,
      mappingTemplateId: undefined
    })
  });

  const updated = await getMarketplaceMappingTemplateRecord({
    organizationId: input.organizationId,
    mappingTemplateId: input.mappingTemplateId
  });
  return { ok: true, marketplaceMappingTemplate: mapMarketplaceMappingTemplate(updated) };
}

export async function createChannelMappingPreset(input: {
  organizationId: string;
  costProfileId?: string | null;
  name: string;
  channelCode?: "AMAZON_MANUAL";
  status?: "ACTIVE" | "ARCHIVED";
  productLabelFormat?: string | null;
  skuFormat?: string | null;
  includeWarningNotes?: boolean;
  includeOverrideNotes?: boolean;
  dimensionsFormat?: string | null;
  materialFormat?: string | null;
  packagingFormat?: string | null;
  pricingFormat?: string | null;
  fieldOrderingSnapshot?: unknown;
  defaultForChannel?: boolean;
  defaultLaunchStrategies?: unknown;
  launchContextSnapshot?: unknown;
  priority?: number | null;
  autoApplyEnabled?: boolean;
  worksheetFieldOrderingSnapshot?: unknown;
  worksheetPromptSnapshot?: unknown;
  requiredFieldChecklistSnapshot?: unknown;
  optionalFieldChecklistSnapshot?: unknown;
  operatorPromptTemplateSnapshot?: unknown;
  copyGroupOrderingSnapshot?: unknown;
  finalReviewPromptTemplateSnapshot?: unknown;
  quickCopyOrderingSnapshot?: unknown;
  shortSummaryFormatSnapshot?: unknown;
  worksheetSectionLabelSnapshot?: unknown;
  finalReviewOrderingSnapshot?: unknown;
  completionCueTemplateSnapshot?: unknown;
  shareSummaryFormatSnapshot?: unknown;
  notes?: string | null;
  presetSnapshot?: unknown;
}) {
  const costProfileId = input.costProfileId ?? null;
  if (costProfileId) {
    const profile = await getCostProfileRecord({ organizationId: input.organizationId, costProfileId });
    if (!profile) {
      throw new Error("Cost profile not found.");
    }
  }
  const preset = await createChannelMappingPresetRecord(input);
  const hydrated = await getChannelMappingPresetRecord({
    organizationId: input.organizationId,
    channelMappingPresetId: preset.id
  });
  return { ok: true, channelMappingPreset: mapChannelMappingPreset(hydrated) };
}

export async function listChannelMappingPresets(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  const presets = await listChannelMappingPresetsForOrganization(input);
  return { ok: true, channelMappingPresets: presets.map(mapChannelMappingPreset) };
}

export async function getChannelMappingPreset(input: {
  organizationId: string;
  channelMappingPresetId: string;
}) {
  const preset = await getChannelMappingPresetRecord(input);
  if (!preset) {
    throw new Error("Channel mapping preset not found.");
  }
  return { ok: true, channelMappingPreset: mapChannelMappingPreset(preset) };
}

export async function updateChannelMappingPreset(input: {
  organizationId: string;
  channelMappingPresetId: string;
} & AnyRecord) {
  const existing = await getChannelMappingPresetRecord({
    organizationId: input.organizationId,
    channelMappingPresetId: input.channelMappingPresetId
  });
  if (!existing) {
    throw new Error("Channel mapping preset not found.");
  }

  await updateChannelMappingPresetRecord({
    organizationId: input.organizationId,
    channelMappingPresetId: input.channelMappingPresetId,
    data: normalizeUpdateData({
      ...input,
      organizationId: undefined,
      channelMappingPresetId: undefined
    })
  });

  const updated = await getChannelMappingPresetRecord({
    organizationId: input.organizationId,
    channelMappingPresetId: input.channelMappingPresetId
  });
  return { ok: true, channelMappingPreset: mapChannelMappingPreset(updated) };
}

export async function createLaunchTemplate(input: {
  organizationId: string;
  costProfileId: string;
  name: string;
  status?: "ACTIVE" | "ARCHIVED";
  defaultAmazonFeePresetId?: string | null;
  defaultShippingZoneRuleId?: string | null;
  defaultPackagingRuleId?: string | null;
  defaultShippingRuleId?: string | null;
  launchStrategy: LaunchStrategy;
  notes?: string | null;
  assumptionsSnapshot?: unknown;
}) {
  const profile = await getCostProfileRecord({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId
  });
  if (!profile) {
    throw new Error("Cost profile not found.");
  }

  const template = await createLaunchTemplateRecord(input);
  const hydrated = await getLaunchTemplateRecord({
    organizationId: input.organizationId,
    templateId: template.id
  });
  return { ok: true, launchTemplate: mapLaunchTemplate(hydrated) };
}

export async function listLaunchTemplates(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  const templates = await listLaunchTemplatesForOrganization(input);
  return { ok: true, launchTemplates: templates.map(mapLaunchTemplate) };
}

export async function getLaunchTemplate(input: {
  organizationId: string;
  templateId: string;
}) {
  const template = await getLaunchTemplateRecord(input);
  if (!template) {
    throw new Error("Launch template not found.");
  }

  return { ok: true, launchTemplate: mapLaunchTemplate(template) };
}

export async function updateLaunchTemplate(input: {
  organizationId: string;
  templateId: string;
} & AnyRecord) {
  const existing = await getLaunchTemplateRecord({
    organizationId: input.organizationId,
    templateId: input.templateId
  });
  if (!existing) {
    throw new Error("Launch template not found.");
  }

  await updateLaunchTemplateRecord({
    organizationId: input.organizationId,
    templateId: input.templateId,
    data: normalizeUpdateData({ ...input, organizationId: undefined, templateId: undefined })
  });

  const updated = await getLaunchTemplateRecord({
    organizationId: input.organizationId,
    templateId: input.templateId
  });
  return { ok: true, launchTemplate: mapLaunchTemplate(updated) };
}

export async function createLaunchGuardrailProfile(input: {
  organizationId: string;
  costProfileId?: string | null;
  name: string;
  status?: "ACTIVE" | "ARCHIVED";
  minimumMarginPct: number;
  minimumBufferAboveBreakEvenPct?: number | null;
  maximumFeeBurdenPct?: number | null;
  maximumShippingBurdenPct?: number | null;
  maximumReserveBurdenPct?: number | null;
  maximumAllowedTargetToFloorGapPct?: number | null;
  notes?: string | null;
  metadata?: unknown;
}) {
  const record = await createLaunchGuardrailProfileRecord(input);
  const hydrated = await getLaunchGuardrailProfileRecord({
    organizationId: input.organizationId,
    guardrailProfileId: record.id
  });

  return { ok: true, launchGuardrailProfile: mapLaunchGuardrailProfile(hydrated) };
}

export async function listLaunchGuardrailProfiles(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  const records = await listLaunchGuardrailProfilesForOrganization(input);
  return { ok: true, launchGuardrailProfiles: records.map(mapLaunchGuardrailProfile) };
}

export async function getLaunchGuardrailProfile(input: {
  organizationId: string;
  guardrailProfileId: string;
}) {
  const record = await getLaunchGuardrailProfileRecord(input);
  if (!record) {
    throw new Error("Launch guardrail profile not found.");
  }

  return { ok: true, launchGuardrailProfile: mapLaunchGuardrailProfile(record) };
}

export async function updateLaunchGuardrailProfile(input: {
  organizationId: string;
  guardrailProfileId: string;
} & AnyRecord) {
  const existing = await getLaunchGuardrailProfileRecord({
    organizationId: input.organizationId,
    guardrailProfileId: input.guardrailProfileId
  });
  if (!existing) {
    throw new Error("Launch guardrail profile not found.");
  }

  await updateLaunchGuardrailProfileRecord({
    organizationId: input.organizationId,
    guardrailProfileId: input.guardrailProfileId,
    data: normalizeUpdateData({
      ...input,
      organizationId: undefined,
      guardrailProfileId: undefined
    })
  });

  const updated = await getLaunchGuardrailProfileRecord({
    organizationId: input.organizationId,
    guardrailProfileId: input.guardrailProfileId
  });
  return { ok: true, launchGuardrailProfile: mapLaunchGuardrailProfile(updated) };
}

function applyGuardrailsToComparison(params: {
  comparison: GuardrailedComparison;
  guardrailProfile: ReturnType<typeof mapLaunchGuardrailProfile>;
  selectedScenarioId?: string | null;
}) {
  const targetPrices = params.comparison.scenarios.map((scenario) => (
    scenario.result.breakdown.recommendedTargetSellPriceCents
  ));
  const comparisonContext = {
    lowestTargetSellPriceCents: Math.min(...targetPrices),
    highestTargetSellPriceCents: Math.max(...targetPrices),
    recommendedScenarioId: params.comparison.ranking?.recommendation?.recommendedScenarioId ?? null
  };

  const scenarios: GuardrailedScenario[] = params.comparison.scenarios.map((scenario: GuardrailedScenario) => {
    const evaluation = evaluateScenarioGuardrails({
      scenario: {
        id: scenario.id,
        name: scenario.name,
        launchStrategy: scenario.launchStrategy ?? null,
        assumptionsSnapshot: scenario.assumptionsSnapshot,
        result: scenario.result
      },
      guardrailProfile: params.guardrailProfile,
      comparisonContext
    });

    return {
      ...scenario,
      guardrailProfileId: params.guardrailProfile.id,
      guardrailProfileName: params.guardrailProfile.name,
      riskScore: evaluation.riskScore,
      riskLevel: evaluation.riskLevel,
      guardrailSnapshot: evaluation.guardrailSnapshot,
      warningSnapshot: evaluation.warnings,
      riskSummary: evaluation.summary,
      handoffSnapshot: null,
      isLaunchApprovedCandidate:
        evaluation.riskLevel !== "HIGH" &&
        (params.selectedScenarioId ? params.selectedScenarioId === scenario.id : scenario.isRecommendedLaunchScenario)
    };
  });

  const selectedScenarioId =
    params.selectedScenarioId ??
    scenarios.find((scenario) => scenario.isLaunchApprovedCandidate)?.id ??
    params.comparison.ranking?.recommendation?.recommendedScenarioId ??
    null;

  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null;
  const selectedHandoff = selectedScenario
    ? buildLaunchCandidateHandoff({
        scenario: {
          ...selectedScenario,
          costProfileId: String(params.comparison.baseSpec.costProfileId ?? ""),
          amazonFeePresetName: selectedScenario.result.amazonFees?.presetName ?? null,
          shippingZoneRuleName: selectedScenario.result.shipping.shippingZoneName ?? null,
          packagingRuleName: null,
          shippingRuleName: null
        },
        riskSummary: {
          riskScore: selectedScenario.riskScore ?? 0,
          riskLevel: selectedScenario.riskLevel ?? "LOW",
          warnings: (selectedScenario.warningSnapshot as any[]) ?? [],
          summary: selectedScenario.riskSummary ?? ""
        }
      })
    : null;

  const selectedScenarios: GuardrailedScenario[] = scenarios.map((scenario: GuardrailedScenario) =>
    scenario.id === selectedScenarioId
      ? { ...scenario, handoffSnapshot: selectedHandoff, isLaunchApprovedCandidate: true }
      : { ...scenario, isLaunchApprovedCandidate: false }
  );

  return {
    scenarios: selectedScenarios,
    selectedLaunchScenarioId: selectedScenarioId,
    selectedLaunchSummary: selectedHandoff,
    riskSummary: buildScenarioRiskSummary({
      scenarios: selectedScenarios.map((scenario: GuardrailedScenario) => ({
        id: scenario.id,
        name: scenario.name,
        riskScore: scenario.riskScore ?? null,
        riskLevel: scenario.riskLevel ?? null,
        warnings: ((scenario.warningSnapshot as any[]) ?? []).map((warning) => ({
          code: String(warning.code ?? ""),
          severity: warning.severity,
          message: String(warning.message ?? "")
        }))
      })),
      recommendedScenarioId: params.comparison.ranking?.recommendation?.recommendedScenarioId ?? null,
      selectedLaunchScenarioId: selectedScenarioId
    })
  };
}

type CostCalculationViewInput = {
  organizationId: string;
  costProfileId: string;
  name?: string | null;
  sku?: string | null;
  quantity: number;
  lengthIn: number;
  depthIn: number;
  thicknessIn?: number | null;
  weightLb?: number | null;
  materialCode: string;
  edgeBandCode?: string | null;
  edgeBandPattern: "NONE" | "LONG_EDGES" | "SHORT_EDGES" | "ALL_FOUR";
  packagingCode?: string | null;
  shippingCode?: string | null;
  amazonFeePresetId?: string | null;
  shippingZoneRuleId?: string | null;
  laborMinutes: number;
  machineMinutes: number;
  overheadMinutes?: number | null;
  packingMinutes?: number | null;
  targetMarginPct?: number | null;
  growthMarginPct?: number | null;
  marketplaceFeePct?: number | null;
  returnReservePct?: number | null;
  damageReservePct?: number | null;
  shippingBufferPct?: number | null;
  shippingBufferCents?: number | null;
};

export async function calculateShelfCostView(input: CostCalculationViewInput) {
  const assumptions = await resolveCostEngineAssumptions(input);
  const result = calculateShelfCost(input, assumptions);

  return {
    ok: true,
    calculation: {
      name: input.name ?? null,
      sku: input.sku ?? null,
      quantity: input.quantity,
      lengthIn: input.lengthIn,
      depthIn: input.depthIn,
      thicknessIn: input.thicknessIn ?? null,
      materialCode: input.materialCode,
      edgeBandCode: input.edgeBandCode ?? null,
      edgeBandPattern: input.edgeBandPattern,
      packagingCode: input.packagingCode ?? null,
      shippingCode: input.shippingCode ?? null,
      amazonFeePresetId: input.amazonFeePresetId ?? null,
      shippingZoneRuleId: input.shippingZoneRuleId ?? null,
      laborMinutes: input.laborMinutes,
      machineMinutes: input.machineMinutes,
      overheadMinutes: input.overheadMinutes ?? null,
      packingMinutes: input.packingMinutes ?? null,
      ...result.breakdown
    },
    assumptions: {
      profile: assumptions.profile,
      materialRule: assumptions.materialRule,
      edgeBandRule: assumptions.edgeBandRule,
      packagingRule: assumptions.packagingRule,
      shippingRule: assumptions.shippingRule,
      amazonFeePreset: assumptions.amazonFeePreset,
      shippingZoneRule: assumptions.shippingZoneRule
    },
    result
  };
}

export async function saveShelfCostCalculation(input: CostCalculationViewInput) {
  const payload = await calculateShelfCostView(input);
  const record = await createShelfCostCalculationRecord({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId,
    amazonFeePresetId: input.amazonFeePresetId ?? null,
    shippingZoneRuleId: input.shippingZoneRuleId ?? null,
    name: input.name,
    sku: input.sku,
    quantity: input.quantity,
    lengthIn: input.lengthIn,
    depthIn: input.depthIn,
    thicknessIn: input.thicknessIn,
    materialCode: input.materialCode,
    edgeBandCode: input.edgeBandCode,
    edgeBandPattern: input.edgeBandPattern,
    packagingCode: input.packagingCode,
    shippingCode: input.shippingCode,
    laborMinutes: input.laborMinutes,
    machineMinutes: input.machineMinutes,
    overheadMinutes: input.overheadMinutes,
    packingMinutes: payload.calculation.packingMinutes,
    materialCostCents: payload.calculation.materialCostCents,
    edgeBandCostCents: payload.calculation.edgeBandCostCents,
    laborCostCents: payload.calculation.laborCostCents,
    machineCostCents: payload.calculation.machineCostCents,
    packagingCostCents: payload.calculation.packagingCostCents,
    packingLaborCostCents: payload.calculation.packingLaborCostCents,
    shippingCostCents: payload.calculation.shippingCostCents,
    shippingBufferCostCents: payload.calculation.shippingBufferCostCents,
    overheadCostCents: payload.calculation.overheadCostCents,
    marketplaceFeeCostCents: payload.calculation.marketplaceFeeCostCents,
    referralFeeCostCents: payload.calculation.referralFeeCostCents,
    closingFeeCostCents: payload.calculation.closingFeeCostCents,
    fulfillmentFeeCostCents: payload.calculation.fulfillmentFeeCostCents,
    storageAllowanceCostCents: payload.calculation.storageAllowanceCostCents,
    advertisingAllowanceCostCents: payload.calculation.advertisingAllowanceCostCents,
    returnReserveCostCents: payload.calculation.returnReserveCostCents,
    damageReserveCostCents: payload.calculation.damageReserveCostCents,
    miscMarketplaceCostCents: payload.calculation.miscMarketplaceCostCents,
    subtotalCostCents: payload.calculation.subtotalCostCents,
    breakEvenPriceCents: payload.calculation.breakEvenPriceCents,
    recommendedMinSellPriceCents: payload.calculation.recommendedMinSellPriceCents,
    recommendedTargetSellPriceCents: payload.calculation.recommendedTargetSellPriceCents,
    targetMarginPct: payload.result.pricing.targetMarginPct,
    growthMarginPct: payload.result.pricing.growthMarginPct,
    recommendedInternalPriceCents: payload.calculation.recommendedInternalPriceCents,
    recommendedSellPriceCents: payload.calculation.recommendedSellPriceCents,
    assumptionsSnapshot: payload.assumptions,
    packagingSnapshot: payload.result.packaging,
    shippingSnapshot: payload.result.shipping,
    pricingSnapshot: payload.result.pricing,
    amazonFeeSnapshot: payload.result.amazonFees,
    shippingZoneSnapshot: payload.result.shippingZone,
    resultSnapshot: payload.result
  });

  const hydrated = await getShelfCostCalculationRecord({
    organizationId: input.organizationId,
    calculationId: record.id
  });

  return { ok: true, calculation: mapCalculation(hydrated) };
}

export async function listShelfCostCalculations(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  const calculations = await listShelfCostCalculationsForOrganization(input);
  return { ok: true, calculations: calculations.map(mapCalculation) };
}

export async function getShelfCostCalculation(input: {
  organizationId: string;
  calculationId: string;
}) {
  const calculation = await getShelfCostCalculationRecord(input);
  if (!calculation) {
    throw new Error("Shelf cost calculation not found.");
  }

  return { ok: true, calculation: mapCalculation(calculation) };
}

type ScenarioInput = {
  name: string;
  launchStrategy?: LaunchStrategy | null;
  amazonFeePresetId?: string | null;
  shippingZoneRuleId?: string | null;
  packagingCode?: string | null;
  shippingCode?: string | null;
  targetMarginPct?: number | null;
  growthMarginPct?: number | null;
  marketplaceFeePct?: number | null;
  returnReservePct?: number | null;
  damageReservePct?: number | null;
  shippingBufferPct?: number | null;
  shippingBufferCents?: number | null;
};

export async function compareShelfCostScenarios(input: {
  organizationId: string;
  name?: string | null;
  notes?: string | null;
  baseSpec: CostCalculationViewInput;
  scenarios: ScenarioInput[];
  guardrailProfileId?: string | null;
  selectedScenarioId?: string | null;
}): Promise<{ ok: true; comparison: GuardrailedComparison & AnyRecord }> {
  if (!input.scenarios.length) {
    throw new Error("At least one scenario is required.");
  }

  const scenarioResults = [];
  for (const [index, scenario] of input.scenarios.entries()) {
    const mergedInput = {
      ...input.baseSpec,
      organizationId: input.organizationId,
      name: input.baseSpec.name ?? `Scenario ${index + 1}`,
      launchStrategy: scenario.launchStrategy ?? null,
      amazonFeePresetId:
        scenario.amazonFeePresetId !== undefined ? scenario.amazonFeePresetId : input.baseSpec.amazonFeePresetId,
      shippingZoneRuleId:
        scenario.shippingZoneRuleId !== undefined ? scenario.shippingZoneRuleId : input.baseSpec.shippingZoneRuleId,
      packagingCode:
        scenario.packagingCode !== undefined ? scenario.packagingCode : input.baseSpec.packagingCode,
      shippingCode:
        scenario.shippingCode !== undefined ? scenario.shippingCode : input.baseSpec.shippingCode,
      targetMarginPct:
        scenario.targetMarginPct !== undefined ? scenario.targetMarginPct : input.baseSpec.targetMarginPct,
      growthMarginPct:
        scenario.growthMarginPct !== undefined ? scenario.growthMarginPct : input.baseSpec.growthMarginPct,
      marketplaceFeePct:
        scenario.marketplaceFeePct !== undefined ? scenario.marketplaceFeePct : input.baseSpec.marketplaceFeePct,
      returnReservePct:
        scenario.returnReservePct !== undefined ? scenario.returnReservePct : input.baseSpec.returnReservePct,
      damageReservePct:
        scenario.damageReservePct !== undefined ? scenario.damageReservePct : input.baseSpec.damageReservePct,
      shippingBufferPct:
        scenario.shippingBufferPct !== undefined ? scenario.shippingBufferPct : input.baseSpec.shippingBufferPct,
      shippingBufferCents:
        scenario.shippingBufferCents !== undefined
          ? scenario.shippingBufferCents
          : input.baseSpec.shippingBufferCents
    };

    const payload = await calculateShelfCostView(mergedInput);
    const assumptionsSnapshot = payload.assumptions as Record<string, unknown>;
    scenarioResults.push({
      id: `scenario-${index + 1}`,
      name: scenario.name,
      calculation: payload.calculation,
      assumptionsSnapshot,
      result: payload.result,
      launchStrategy: mergedInput.launchStrategy ?? null,
      changedAssumptions: {
        packagingCode: mergedInput.packagingCode ?? null,
        shippingCode: mergedInput.shippingCode ?? null,
        amazonFeePresetId: mergedInput.amazonFeePresetId ?? null,
        shippingZoneRuleId: mergedInput.shippingZoneRuleId ?? null,
        targetMarginPct: mergedInput.targetMarginPct ?? null,
        growthMarginPct: mergedInput.growthMarginPct ?? null,
        launchStrategy: mergedInput.launchStrategy ?? null
      }
    });
  }

  const deltaComparison = compareScenarioResults(
    scenarioResults.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      result: scenario.result,
      assumptionsSnapshot: scenario.assumptionsSnapshot
    }))
  );
  const ranking = rankComparisonScenarios(
    scenarioResults.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      launchStrategy: scenario.launchStrategy,
      result: scenario.result
    }))
  );

  const comparison: GuardrailedComparison = {
    name: input.name ?? null,
    notes: input.notes ?? null,
    baseSpec: input.baseSpec,
    baselineScenarioId: deltaComparison.baselineScenarioId,
    ranking: {
      scenarios: ranking.ranked.map((entry) => ({
        scenarioId: entry.id,
        rankingScore: entry.rankingScore,
        rankingSummary: entry.rankingSummary
      })),
      recommendation: ranking.recommendation
    },
    scenarios: scenarioResults.map((scenario) => {
      const deltaEntry = deltaComparison.scenarios.find((entry) => entry.id === scenario.id);
      const rankingEntry = ranking.ranked.find((entry) => entry.id === scenario.id);
      return {
        ...scenario,
        rankingScore: rankingEntry?.rankingScore ?? null,
        rankingSummary: rankingEntry?.rankingSummary ?? null,
        isRecommendedLaunchScenario:
          ranking.recommendation?.recommendedScenarioId === scenario.id,
        deltas: deltaEntry?.deltas ?? {
          subtotalCostCents: 0,
          breakEvenPriceCents: 0,
          recommendedMinSellPriceCents: 0,
          recommendedTargetSellPriceCents: 0
        }
      };
    })
  };

  let guardrailProfile = null;
  let riskSummary = null;
  let selectedLaunchSummary = null;
  let selectedLaunchScenarioId = null;

  if (input.guardrailProfileId) {
    const record = await getLaunchGuardrailProfileRecord({
      organizationId: input.organizationId,
      guardrailProfileId: input.guardrailProfileId
    });
    if (!record) {
      throw new Error("Launch guardrail profile not found.");
    }

    guardrailProfile = mapLaunchGuardrailProfile(record);
    const evaluated: ReturnType<typeof applyGuardrailsToComparison> = applyGuardrailsToComparison({
      comparison,
      guardrailProfile,
      selectedScenarioId: input.selectedScenarioId ?? null
    });
    comparison.scenarios = evaluated.scenarios as typeof comparison.scenarios;
    riskSummary = evaluated.riskSummary;
    selectedLaunchSummary = evaluated.selectedLaunchSummary;
    selectedLaunchScenarioId = evaluated.selectedLaunchScenarioId;
  }

  return {
    ok: true,
    comparison: {
      ...comparison,
      guardrailProfile,
      selectedLaunchScenarioId,
      selectedLaunchSummary,
      riskSummary
    }
  };
}

export async function saveComparisonSet(input: {
  organizationId: string;
  name: string;
  notes?: string | null;
  baseSpec: CostCalculationViewInput;
  scenarios: ScenarioInput[];
  guardrailProfileId?: string | null;
  selectedScenarioId?: string | null;
}) {
  const comparison = await compareShelfCostScenarios(input);
  const scenarioRecords = [];

  for (const [index, scenario] of comparison.comparison.scenarios.entries()) {
    const scenarioRecord = await createCalculationScenarioRecord({
      organizationId: input.organizationId,
      name: scenario.name,
      costProfileId: input.baseSpec.costProfileId,
      amazonFeePresetId: scenario.changedAssumptions.amazonFeePresetId,
      shippingZoneRuleId: scenario.changedAssumptions.shippingZoneRuleId,
      packagingRuleId: null,
      shippingRuleId: null,
      shelfCostCalculationId: null,
      launchStrategy: scenario.launchStrategy ?? null,
      rankingScore: scenario.rankingScore ?? null,
      rankingSummary: scenario.rankingSummary ?? null,
      guardrailProfileId: scenario.guardrailProfileId ?? null,
      riskScore: scenario.riskScore ?? null,
      riskLevel: scenario.riskLevel ?? null,
      listingReadinessStatus: null,
      guardrailSnapshot: scenario.guardrailSnapshot ?? null,
      warningSnapshot: scenario.warningSnapshot ?? null,
      handoffSnapshot: scenario.handoffSnapshot ?? null,
      listingReadinessSnapshot: null,
      marketplaceFieldSnapshot: null,
      strongerAlertSnapshot: null,
      exportSnapshot: null,
      isRecommendedLaunchScenario: Boolean(scenario.isRecommendedLaunchScenario),
      isLaunchApprovedCandidate: Boolean(scenario.isLaunchApprovedCandidate),
      assumptionsSnapshot: scenario.assumptionsSnapshot,
      resultSnapshot: scenario.result
    });
    scenarioRecords.push(scenarioRecord);
  }

  const recommendedScenarioRecord = scenarioRecords.find((scenario) => scenario.isRecommendedLaunchScenario);
  const selectedLaunchScenarioRecord = scenarioRecords.find((scenario) => scenario.isLaunchApprovedCandidate);
  const selectedArtifacts = selectedLaunchScenarioRecord
    ? buildListingArtifactsForScenario({ scenarioRecord: selectedLaunchScenarioRecord })
    : null;

  if (selectedLaunchScenarioRecord && selectedArtifacts) {
    await updateCalculationScenarioRecord({
      organizationId: input.organizationId,
      scenarioId: selectedLaunchScenarioRecord.id,
      data: normalizeUpdateData({
        listingReadinessStatus: selectedArtifacts.listingReadinessStatus,
        listingReadinessSnapshot: selectedArtifacts.listingReadinessSnapshot,
        marketplaceFieldSnapshot: selectedArtifacts.marketplaceFieldSnapshot,
        strongerAlertSnapshot: selectedArtifacts.strongerAlertSnapshot,
        exportSnapshot: selectedArtifacts.exportSnapshot,
        handoffSnapshot: selectedArtifacts.handoffSummary,
        latestQuickCopySummarySnapshot: selectedArtifacts.quickCopySummarySnapshot
      })
    });
  }

  const set = await createCalculationComparisonSetRecord({
    organizationId: input.organizationId,
    name: input.name,
    notes: input.notes ?? null,
    baseShelfSpecSnapshot: comparison.comparison.baseSpec,
    recommendedScenarioId: recommendedScenarioRecord?.id ?? null,
    selectedLaunchScenarioId: selectedLaunchScenarioRecord?.id ?? null,
    rankingSnapshot: comparison.comparison.ranking,
    comparisonSummary: comparison.comparison.ranking?.recommendation ?? null,
    selectedLaunchSummary: selectedArtifacts?.handoffSummary ?? comparison.comparison.selectedLaunchSummary ?? null,
    riskSummary: comparison.comparison.riskSummary ?? null
    ,
    selectedLaunchExportSnapshot: selectedArtifacts?.exportSnapshot ?? null,
    selectedLaunchReadinessStatus: selectedArtifacts?.listingReadinessStatus ?? null,
    selectedLaunchWarningSnapshot: selectedArtifacts?.strongerAlertSnapshot?.warnings ?? null,
    selectedQuickCopySummarySnapshot: selectedArtifacts?.quickCopySummarySnapshot ?? null,
    selectedFinalReviewPromptSnapshot: selectedArtifacts?.finalReviewPromptSnapshot ?? null
  });

  for (const [index, scenarioRecord] of scenarioRecords.entries()) {
    await createComparisonSetScenarioRecord({
      organizationId: input.organizationId,
      comparisonSetId: set.id,
      calculationScenarioId: scenarioRecord.id,
      sortOrder: index
    });
  }

  const hydrated = await getCalculationComparisonSetRecord({
    organizationId: input.organizationId,
    comparisonSetId: set.id
  });
  return { ok: true, comparisonSet: mapComparisonSet(hydrated) };
}

export async function rankComparisonSet(input: {
  organizationId: string;
  comparisonSetId: string;
  guardrailProfileId?: string | null;
  selectedScenarioId?: string | null;
}) {
  const comparisonSet = await getCalculationComparisonSetRecord(input);
  if (!comparisonSet) {
    throw new Error("Cost comparison set not found.");
  }

  const ranking = rankComparisonScenarios(
    (comparisonSet.scenarios ?? []).map((entry: any) => ({
      id: entry.calculationScenario.id,
      name: entry.calculationScenario.name,
      launchStrategy: entry.calculationScenario.launchStrategy ?? null,
      result: entry.calculationScenario.resultSnapshot
    }))
  );

  const recommendedScenarioId = ranking.recommendation?.recommendedScenarioId ?? null;
  let selectedLaunchScenarioId: string | null = input.selectedScenarioId ?? null;
  let selectedLaunchSummary: AnyRecord | null = null;
  let riskSummary: AnyRecord | null = null;
  let selectedLaunchExportSnapshot: AnyRecord | null = null;
  let selectedLaunchReadinessStatus: "READY" | "NEEDS_REVIEW" | "BLOCKED" | null = null;
  let selectedLaunchWarningSnapshot: AnyRecord[] | null = null;
  let guardrailProfile = null;

  if (input.guardrailProfileId) {
    const record = await getLaunchGuardrailProfileRecord({
      organizationId: input.organizationId,
      guardrailProfileId: input.guardrailProfileId
    });
    if (!record) {
      throw new Error("Launch guardrail profile not found.");
    }
    guardrailProfile = mapLaunchGuardrailProfile(record);
  }

  for (const entry of comparisonSet.scenarios ?? []) {
    const scenario = entry.calculationScenario;
    const rankingEntry = ranking.ranked.find((item) => item.id === scenario.id);
    const guardrailEvaluation = guardrailProfile
      ? evaluateScenarioGuardrails({
          scenario: {
            id: scenario.id,
            name: scenario.name,
            launchStrategy: scenario.launchStrategy ?? null,
            assumptionsSnapshot: scenario.assumptionsSnapshot,
            result: scenario.resultSnapshot
          },
          guardrailProfile,
          comparisonContext: {
            lowestTargetSellPriceCents: Math.min(
              ...ranking.ranked.map((item) => item.result.breakdown.recommendedTargetSellPriceCents)
            ),
            highestTargetSellPriceCents: Math.max(
              ...ranking.ranked.map((item) => item.result.breakdown.recommendedTargetSellPriceCents)
            ),
            recommendedScenarioId
          }
        })
      : null;

    await updateCalculationScenarioRecord({
      organizationId: input.organizationId,
      scenarioId: scenario.id,
      data: normalizeUpdateData({
        rankingScore: rankingEntry?.rankingScore ?? null,
        rankingSummary: rankingEntry?.rankingSummary ?? null,
        isRecommendedLaunchScenario: scenario.id === recommendedScenarioId,
        guardrailProfileId: guardrailProfile?.id ?? null,
        riskScore: guardrailEvaluation?.riskScore ?? null,
        riskLevel: guardrailEvaluation?.riskLevel ?? null,
        guardrailSnapshot: guardrailEvaluation?.guardrailSnapshot ?? null,
        warningSnapshot: guardrailEvaluation?.warnings ?? null,
        isLaunchApprovedCandidate: false
      })
    });
  }

  if (!selectedLaunchScenarioId) {
    const safestRankedScenario = ranking.ranked.find((item) => item.id === recommendedScenarioId) ?? ranking.ranked[0];
    selectedLaunchScenarioId = safestRankedScenario?.id ?? null;
  }

  const refreshedAfterScenarioUpdate = await getCalculationComparisonSetRecord(input);
  const selectedScenarioRecord =
    (refreshedAfterScenarioUpdate?.scenarios ?? []).find(
      (entry: any) => entry.calculationScenario.id === selectedLaunchScenarioId
    )?.calculationScenario ?? null;

  if (selectedScenarioRecord) {
    const selectedArtifacts = buildListingArtifactsForScenario({
      scenarioRecord: selectedScenarioRecord
    });
    selectedLaunchSummary = selectedArtifacts.handoffSummary;
    selectedLaunchExportSnapshot = selectedArtifacts.exportSnapshot;
    selectedLaunchReadinessStatus = selectedArtifacts.listingReadinessStatus;
    selectedLaunchWarningSnapshot = Array.isArray(selectedArtifacts.strongerAlertSnapshot?.warnings)
      ? selectedArtifacts.strongerAlertSnapshot.warnings
      : [];
    await updateCalculationScenarioRecord({
      organizationId: input.organizationId,
      scenarioId: selectedScenarioRecord.id,
      data: {
        isLaunchApprovedCandidate: true,
        handoffSnapshot: selectedLaunchSummary,
        listingReadinessStatus: selectedLaunchReadinessStatus,
        listingReadinessSnapshot: selectedArtifacts.listingReadinessSnapshot,
        marketplaceFieldSnapshot: selectedArtifacts.marketplaceFieldSnapshot,
        strongerAlertSnapshot: selectedArtifacts.strongerAlertSnapshot,
        exportSnapshot: selectedLaunchExportSnapshot,
        latestQuickCopySummarySnapshot: selectedArtifacts.quickCopySummarySnapshot
      }
    });
  }

  if (refreshedAfterScenarioUpdate) {
    riskSummary = buildScenarioRiskSummary({
      scenarios: (refreshedAfterScenarioUpdate.scenarios ?? []).map((entry: any) => ({
        id: entry.calculationScenario.id,
        name: entry.calculationScenario.name,
        riskScore: decimalToNumber(entry.calculationScenario.riskScore),
        riskLevel: entry.calculationScenario.riskLevel ?? null,
        warnings: Array.isArray(entry.calculationScenario.warningSnapshot)
          ? entry.calculationScenario.warningSnapshot
          : []
      })),
      recommendedScenarioId,
      selectedLaunchScenarioId
    });
  }

  await updateCalculationComparisonSetRecord({
    organizationId: input.organizationId,
    comparisonSetId: input.comparisonSetId,
    data: {
      recommendedScenarioId: recommendedScenarioId ?? undefined,
      selectedLaunchScenarioId: selectedLaunchScenarioId ?? undefined,
      rankingSnapshot: ranking,
      comparisonSummary: ranking.recommendation ?? undefined,
      selectedLaunchSummary: selectedLaunchSummary ?? undefined,
      riskSummary: riskSummary ?? undefined,
      selectedLaunchExportSnapshot: selectedLaunchExportSnapshot ?? undefined,
      selectedLaunchReadinessStatus: selectedLaunchReadinessStatus ?? undefined,
      selectedLaunchWarningSnapshot: selectedLaunchWarningSnapshot ?? undefined,
      selectedQuickCopySummarySnapshot: selectedScenarioRecord
        ? (selectedScenarioRecord.latestQuickCopySummarySnapshot ??
          buildListingArtifactsForScenario({ scenarioRecord: selectedScenarioRecord }).quickCopySummarySnapshot)
        : undefined,
      selectedFinalReviewPromptSnapshot: selectedScenarioRecord
        ? buildListingArtifactsForScenario({ scenarioRecord: selectedScenarioRecord }).finalReviewPromptSnapshot
        : undefined
    }
  });

  const hydrated = await getCalculationComparisonSetRecord(input);
  return { ok: true, comparisonSet: mapComparisonSet(hydrated) };
}

export async function getComparisonSetRecommendation(input: {
  organizationId: string;
  comparisonSetId: string;
}) {
  const comparisonSet = await getCalculationComparisonSetRecord(input);
  if (!comparisonSet) {
    throw new Error("Cost comparison set not found.");
  }

  return {
    ok: true,
    recommendation: {
      ...(comparisonSet.comparisonSummary ??
        comparisonSet.rankingSnapshot?.recommendation ??
        {}),
      selectedLaunchScenarioId: comparisonSet.selectedLaunchScenarioId ?? null,
      selectedLaunchSummary: comparisonSet.selectedLaunchSummary ?? null,
      riskSummary: comparisonSet.riskSummary ?? null,
      selectedLaunchReadinessStatus: comparisonSet.selectedLaunchReadinessStatus ?? null,
      selectedLaunchWarningSnapshot: comparisonSet.selectedLaunchWarningSnapshot ?? null,
      selectedLaunchExportSnapshot: comparisonSet.selectedLaunchExportSnapshot ?? null
    }
  };
}

export async function listComparisonSets(input: { organizationId: string }) {
  const sets = await listCalculationComparisonSetsForOrganization(input.organizationId);
  return {
    ok: true,
    comparisonSets: sets.map((record: any) => ({
      id: record.id,
      orgId: record.organizationId,
      name: record.name,
      notes: record.notes ?? null,
      scenarioCount: record.scenarios.length,
      recommendedScenarioId: record.recommendedScenarioId ?? null,
      recommendedScenarioName: record.recommendedScenario?.name ?? null,
      selectedLaunchScenarioId: record.selectedLaunchScenarioId ?? null,
      selectedLaunchScenarioName: record.selectedLaunchScenario?.name ?? null,
      comparisonSummary: record.comparisonSummary ?? null,
      riskSummary: record.riskSummary ?? null,
      selectedLaunchReadinessStatus: record.selectedLaunchReadinessStatus ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    }))
  };
}

export async function getComparisonSet(input: {
  organizationId: string;
  comparisonSetId: string;
}) {
  const set = await getCalculationComparisonSetRecord(input);
  if (!set) {
    throw new Error("Cost comparison set not found.");
  }

  return { ok: true, comparisonSet: mapComparisonSet(set) };
}

export async function evaluateComparisonSetGuardrails(input: {
  organizationId: string;
  comparisonSetId: string;
  guardrailProfileId: string;
  selectedScenarioId?: string | null;
}) {
  return rankComparisonSet(input);
}

export async function selectLaunchScenario(input: {
  organizationId: string;
  comparisonSetId: string;
  scenarioId: string;
  guardrailProfileId?: string | null;
}) {
  return rankComparisonSet({
    organizationId: input.organizationId,
    comparisonSetId: input.comparisonSetId,
    selectedScenarioId: input.scenarioId,
    guardrailProfileId: input.guardrailProfileId ?? null
  });
}

export async function getComparisonSetHandoffSummary(input: {
  organizationId: string;
  comparisonSetId: string;
}) {
  const set = await getCalculationComparisonSetRecord(input);
  if (!set) {
    throw new Error("Cost comparison set not found.");
  }

  return {
    ok: true,
    handoffSummary: set.selectedLaunchSummary ?? null,
    selectedLaunchScenarioId: set.selectedLaunchScenarioId ?? null,
    riskSummary: set.riskSummary ?? null,
    selectedLaunchReadinessStatus: set.selectedLaunchReadinessStatus ?? null,
    selectedLaunchWarningSnapshot: set.selectedLaunchWarningSnapshot ?? null,
    exportSummary: set.selectedLaunchExportSnapshot ?? null,
    listingPrepSummary: set.listingPrepSummarySnapshot ?? null,
    selectedListingPrepPackageId: set.selectedListingPrepPackageId ?? null,
    selectedListingPrepReadySnapshot: set.selectedListingPrepReadySnapshot ?? null,
    selectedListingPrepExportVersion: set.selectedListingPrepExportVersion ?? null,
    selectedListingPrepApprovalSnapshot: set.selectedListingPrepApprovalSnapshot ?? null,
    selectedListingPrepExportContractVersion:
      set.selectedListingPrepExportContractVersion ?? null,
    selectedWorksheetVersion: set.selectedWorksheetVersion ?? null,
    selectedWorksheetSummarySnapshot: set.selectedWorksheetSummarySnapshot ?? null,
    selectedOperatorWorksheetVersion: set.selectedOperatorWorksheetVersion ?? null,
    selectedOperatorWorksheetSummarySnapshot:
      set.selectedOperatorWorksheetSummarySnapshot ?? null,
    selectedWorksheetErgonomicsSummary:
      set.selectedWorksheetErgonomicsSummary ?? null
  };
}

export async function evaluateComparisonSetListingReadiness(input: {
  organizationId: string;
  comparisonSetId: string;
  selectedScenarioId?: string | null;
}) {
  const comparisonSet = await getCalculationComparisonSetRecord(input);
  if (!comparisonSet) {
    throw new Error("Cost comparison set not found.");
  }

  const selectedScenarioId =
    input.selectedScenarioId ??
    comparisonSet.selectedLaunchScenarioId ??
    comparisonSet.recommendedScenarioId ??
    null;
  if (!selectedScenarioId) {
    throw new Error("A selected launch scenario is required before evaluating listing readiness.");
  }

  const scenarioRecord =
    (comparisonSet.scenarios ?? []).find(
      (entry: any) => entry.calculationScenario.id === selectedScenarioId
    )?.calculationScenario ?? null;
  if (!scenarioRecord) {
    throw new Error("Selected launch scenario not found in this comparison set.");
  }

  const artifacts = buildListingArtifactsForScenario({ scenarioRecord });

  await updateCalculationScenarioRecord({
    organizationId: input.organizationId,
    scenarioId: scenarioRecord.id,
    data: normalizeUpdateData({
      isLaunchApprovedCandidate: true,
      handoffSnapshot: artifacts.handoffSummary,
      listingReadinessStatus: artifacts.listingReadinessStatus,
      listingReadinessSnapshot: artifacts.listingReadinessSnapshot,
      marketplaceFieldSnapshot: artifacts.marketplaceFieldSnapshot,
      strongerAlertSnapshot: artifacts.strongerAlertSnapshot,
      exportSnapshot: artifacts.exportSnapshot,
      latestQuickCopySummarySnapshot: artifacts.quickCopySummarySnapshot
    })
  });

  await updateCalculationComparisonSetRecord({
    organizationId: input.organizationId,
    comparisonSetId: input.comparisonSetId,
    data: normalizeUpdateData({
      selectedLaunchScenarioId: scenarioRecord.id,
      selectedLaunchSummary: artifacts.handoffSummary,
      selectedLaunchExportSnapshot: artifacts.exportSnapshot,
      selectedLaunchReadinessStatus: artifacts.listingReadinessStatus,
      selectedLaunchWarningSnapshot: artifacts.strongerAlertSnapshot?.warnings ?? null,
      selectedQuickCopySummarySnapshot: artifacts.quickCopySummarySnapshot,
      selectedFinalReviewPromptSnapshot: artifacts.finalReviewPromptSnapshot
    })
  });

  const hydrated = await getCalculationComparisonSetRecord(input);
  return { ok: true, comparisonSet: mapComparisonSet(hydrated) };
}

export async function getComparisonSetExportSummary(input: {
  organizationId: string;
  comparisonSetId: string;
}) {
  const set = await getCalculationComparisonSetRecord(input);
  if (!set) {
    throw new Error("Cost comparison set not found.");
  }

  return {
    ok: true,
    exportSummary: set.selectedLaunchExportSnapshot ?? null,
    selectedLaunchScenarioId: set.selectedLaunchScenarioId ?? null,
    selectedLaunchReadinessStatus: set.selectedLaunchReadinessStatus ?? null,
    selectedLaunchWarningSnapshot: set.selectedLaunchWarningSnapshot ?? null,
    listingPrepSummary: set.listingPrepSummarySnapshot ?? null,
    selectedListingPrepPackageId: set.selectedListingPrepPackageId ?? null,
    selectedListingPrepReadySnapshot: set.selectedListingPrepReadySnapshot ?? null,
    selectedListingPrepExportVersion: set.selectedListingPrepExportVersion ?? null,
    selectedListingPrepApprovalSnapshot: set.selectedListingPrepApprovalSnapshot ?? null,
    selectedListingPrepExportContractVersion:
      set.selectedListingPrepExportContractVersion ?? null,
    selectedWorksheetVersion: set.selectedWorksheetVersion ?? null,
    selectedWorksheetSummarySnapshot: set.selectedWorksheetSummarySnapshot ?? null,
    selectedOperatorWorksheetVersion: set.selectedOperatorWorksheetVersion ?? null,
    selectedOperatorWorksheetSummarySnapshot:
      set.selectedOperatorWorksheetSummarySnapshot ?? null,
    selectedRunbookVersion: set.selectedRunbookVersion ?? null,
    selectedRunbookSummarySnapshot: set.selectedRunbookSummarySnapshot ?? null
  };
}

export async function buildListingPrepPackage(input: {
  organizationId: string;
  comparisonSetId: string;
  selectedScenarioId?: string | null;
  marketplaceMappingTemplateId?: string | null;
  channelMappingPresetId?: string | null;
  notes?: string | null;
}) {
  const comparisonSet = await getCalculationComparisonSetRecord(input);
  if (!comparisonSet) {
    throw new Error("Cost comparison set not found.");
  }

  const scenarioId =
    input.selectedScenarioId ??
    comparisonSet.selectedLaunchScenarioId ??
    comparisonSet.recommendedScenarioId ??
    null;
  if (!scenarioId) {
    throw new Error("A selected launch scenario is required before building a listing-prep package.");
  }

  const scenarioRecord =
    (comparisonSet.scenarios ?? []).find((entry: any) => entry.calculationScenario.id === scenarioId)
      ?.calculationScenario ?? null;
  if (!scenarioRecord) {
    throw new Error("Selected launch scenario not found in this comparison set.");
  }

  const mappingTemplate =
    input.marketplaceMappingTemplateId
      ? await getMarketplaceMappingTemplateRecord({
          organizationId: input.organizationId,
          mappingTemplateId: input.marketplaceMappingTemplateId
        })
      : null;
  if (input.marketplaceMappingTemplateId && !mappingTemplate) {
    throw new Error("Marketplace mapping template not found.");
  }
  const presetResolution = await resolveChannelPresetForListingPackage({
    organizationId: input.organizationId,
    costProfileId: scenarioRecord.costProfileId,
    selectedPresetId: input.channelMappingPresetId ?? null,
    scenarioRecord,
    readyForListingPrepStatus: scenarioRecord.listingReadinessSnapshot?.readyForListingPrepStatus ?? null,
    listingReadinessStatus: scenarioRecord.listingReadinessStatus ?? null,
    feePresetLabel: scenarioRecord.exportSnapshot?.feePresetLabel ?? null,
    shippingZoneLabel: scenarioRecord.exportSnapshot?.shippingZoneLabel ?? null
  });
  const channelPreset = presetResolution.preset;

  const artifacts = buildListingArtifactsForScenario({
    scenarioRecord,
    overrideApproved: false,
    mappingTemplate,
    channelPreset,
    comparisonSetId: comparisonSet.id,
    exportVersion: "listing-prep-v1",
    exportContractVersion: "manual-amazon-v1",
    presetSelectionSummary: presetResolution.selectionSummary
  });
  const listingPrepPackage = await createListingPrepPackageRecord({
    organizationId: input.organizationId,
    comparisonSetId: comparisonSet.id,
    calculationScenarioId: scenarioRecord.id,
    name: `${scenarioRecord.name} listing prep`,
    status: artifacts.packageStatus.packageStatus,
    listingReadinessStatus: artifacts.listingReadinessStatus,
    exportSnapshot: artifacts.exportSnapshot,
    marketplaceFieldSnapshot: artifacts.marketplaceFieldSnapshot,
    validationSnapshot: artifacts.validationSnapshot,
    warningSnapshot: artifacts.strongerAlertSnapshot?.warnings ?? null,
    overrideSnapshot: artifacts.overrideSnapshot,
    marketplaceMappingTemplateId: mappingTemplate?.id ?? null,
    channelMappingPresetId: channelPreset?.id ?? null,
    approvalState: artifacts.approvalState as
      | "DRAFT"
      | "READY_FOR_REVIEW"
      | "READY"
      | "APPROVED"
      | "APPROVED_WITH_OVERRIDE"
      | "BLOCKED"
      | "ARCHIVED",
    approvalSummarySnapshot: artifacts.approvalSummarySnapshot,
    exportVersion: artifacts.exportVersion,
    exportContractVersion: artifacts.exportContractVersion,
    exportShapeSnapshot: artifacts.exportShapeSnapshot,
    overrideHistorySnapshot: artifacts.overrideHistorySnapshot,
    readyForListingPrep: artifacts.readyForListingPrep,
    readyForListingPrepSummary: artifacts.readyForListingPrepSummary,
    manualAmazonExportSnapshot: artifacts.manualAmazonExportSnapshot,
    approvalHistorySnapshot: artifacts.approvalHistorySnapshot,
    autoAppliedChannelPreset: presetResolution.autoApplied,
    channelPresetSelectionSummary: artifacts.channelPresetSelectionSummary,
    manualListingWorksheetSnapshot: artifacts.manualListingWorksheetSnapshot,
    worksheetVersion: artifacts.worksheetVersion,
    worksheetSummarySnapshot: artifacts.worksheetSummarySnapshot,
    operatorWorksheetSnapshot: artifacts.operatorWorksheetSnapshot,
    operatorWorksheetVersion: artifacts.operatorWorksheetVersion,
    operatorChecklistSnapshot: artifacts.operatorChecklistSnapshot,
    channelHandoffSummarySnapshot: artifacts.channelHandoffSummarySnapshot,
    currentApprovedArtifactSummary: artifacts.currentApprovedArtifactSummary,
    operatorPromptSnapshot: artifacts.operatorPromptSnapshot,
    copyExportSnapshot: artifacts.copyExportSnapshot,
    plainTextWorksheetSnapshot: artifacts.plainTextWorksheetSnapshot,
    structuredWorksheetExportSnapshot: artifacts.structuredWorksheetExportSnapshot,
    worksheetErgonomicsSummary: artifacts.worksheetErgonomicsSummary,
    quickCopySummarySnapshot: artifacts.quickCopySummarySnapshot,
    finalReviewPromptSnapshot: artifacts.finalReviewPromptSnapshot,
    artifactHandoffSummarySnapshot: artifacts.artifactHandoffSummarySnapshot,
    shortPlainTextSummarySnapshot: artifacts.shortPlainTextSummarySnapshot,
    quickCopyVersion: artifacts.quickCopyVersion,
    finalRunbookSnapshot: artifacts.finalRunbookSnapshot,
    completionCueSnapshot: artifacts.completionCueSnapshot,
    internalShareSummarySnapshot: artifacts.internalShareSummarySnapshot,
    shortShareTextSnapshot: artifacts.shortShareTextSnapshot,
    runbookVersion: artifacts.runbookVersion,
    lastChangeSummarySnapshot: artifacts.lastChangeSummarySnapshot,
    currentApprovedArtifact: false,
    notes: input.notes ?? null,
    approvedAt: null
  });

  await updateCalculationScenarioRecord({
    organizationId: input.organizationId,
    scenarioId: scenarioRecord.id,
    data: normalizeUpdateData({
      listingPrepPackageId: listingPrepPackage.id,
      priceFloorOverrideRequested: artifacts.overrideSnapshot.overrideRequested,
      priceFloorOverrideApproved: artifacts.overrideSnapshot.overrideApproved,
      priceFloorOverrideSnapshot: artifacts.overrideSnapshot,
      latestOverrideSummarySnapshot: artifacts.overrideHistorySnapshot?.latestOverride ?? null,
      latestApprovalSummarySnapshot: artifacts.approvalSummarySnapshot,
      latestPresetSelectionSummarySnapshot: artifacts.channelPresetSelectionSummary,
      latestWorksheetSummarySnapshot: artifacts.worksheetSummarySnapshot,
      latestQuickCopySummarySnapshot: artifacts.quickCopySummarySnapshot,
      latestRunbookSummarySnapshot: artifacts.finalRunbookSnapshot,
      latestOperatorPromptSummarySnapshot: {
        summary: artifacts.operatorPromptSnapshot?.summary ?? null,
        criticalPrompts: artifacts.operatorPromptSnapshot?.criticalPrompts ?? [],
        reviewPrompts: artifacts.operatorPromptSnapshot?.reviewPrompts ?? [],
        completionPrompts: artifacts.operatorPromptSnapshot?.completionPrompts ?? []
      }
    })
  });

  await updateCalculationComparisonSetRecord({
    organizationId: input.organizationId,
    comparisonSetId: comparisonSet.id,
    data: normalizeUpdateData({
      selectedListingPrepPackageId: listingPrepPackage.id,
      listingPrepSummarySnapshot: {
        listingPrepPackageId: listingPrepPackage.id,
        packageStatus: artifacts.packageStatus.packageStatus,
        packageReadinessLabel: artifacts.packageStatus.packageReadinessLabel,
        validationSummary: artifacts.validationSnapshot.validationSummary,
        overrideSummary: artifacts.overrideSnapshot.summary,
        readyForListingPrep: artifacts.readyForListingPrep,
        readyForListingPrepSummary: artifacts.readyForListingPrepSummary,
        mappingTemplateLabel: mappingTemplate?.name ?? null,
        channelPresetLabel: channelPreset?.name ?? null,
        approvalState: artifacts.approvalState,
        approvalSummary: artifacts.approvalSummarySnapshot,
        presetSelectionSummary: artifacts.channelPresetSelectionSummary,
        worksheetSummary: artifacts.worksheetSummarySnapshot,
        operatorWorksheetSummary: artifacts.operatorWorksheetSnapshot
      },
      selectedListingPrepReadySnapshot: artifacts.readyForListingPrepSummary,
      selectedListingPrepExportVersion: artifacts.exportVersion,
      selectedListingPrepApprovalSnapshot: artifacts.approvalSummarySnapshot,
      selectedListingPrepExportContractVersion: artifacts.exportContractVersion,
      selectedWorksheetVersion: artifacts.worksheetVersion,
      selectedWorksheetSummarySnapshot: artifacts.worksheetSummarySnapshot,
      selectedOperatorWorksheetVersion: artifacts.operatorWorksheetVersion,
      selectedOperatorWorksheetSummarySnapshot: artifacts.operatorWorksheetSnapshot,
      selectedWorksheetErgonomicsSummary: artifacts.worksheetErgonomicsSummary,
      selectedQuickCopySummarySnapshot: artifacts.quickCopySummarySnapshot,
      selectedFinalReviewPromptSnapshot: artifacts.finalReviewPromptSnapshot,
      selectedRunbookVersion: artifacts.runbookVersion,
      selectedRunbookSummarySnapshot: artifacts.finalRunbookSnapshot
    })
  });

  const hydrated = await getListingPrepPackageRecord({
    organizationId: input.organizationId,
    listingPrepPackageId: listingPrepPackage.id
  });

  return { ok: true, listingPrepPackage: mapListingPrepPackage(hydrated) };
}

export async function listListingPrepPackages(input: {
  organizationId: string;
  status?: "DRAFT" | "READY_FOR_REVIEW" | "READY" | "APPROVED" | "APPROVED_WITH_OVERRIDE" | "BLOCKED" | "ARCHIVED";
}) {
  const packages = await listListingPrepPackagesForOrganization(input);
  return {
    ok: true,
    listingPrepPackages: packages.map(mapListingPrepPackage)
  };
}

export async function getListingPrepPackage(input: {
  organizationId: string;
  listingPrepPackageId: string;
}) {
  const record = await getListingPrepPackageRecord(input);
  if (!record) {
    throw new Error("Listing prep package not found.");
  }
  return { ok: true, listingPrepPackage: mapListingPrepPackage(record) };
}

export async function refreshListingPrepPackage(input: {
  organizationId: string;
  listingPrepPackageId: string;
  notes?: string | null;
}) {
  const record = await getListingPrepPackageRecord(input);
  if (!record) {
    throw new Error("Listing prep package not found.");
  }

  const presetResolution = await resolveChannelPresetForListingPackage({
    organizationId: input.organizationId,
    costProfileId: record.calculationScenario.costProfileId,
    selectedPresetId: record.channelMappingPresetId ?? null,
    scenarioRecord: record.calculationScenario,
    readyForListingPrepStatus:
      typeof (record.readyForListingPrepSummary as Record<string, unknown> | null)?.readyForListingPrepStatus ===
      "string"
        ? String((record.readyForListingPrepSummary as Record<string, unknown>).readyForListingPrepStatus)
        : null,
    listingReadinessStatus: record.listingReadinessStatus ?? null,
    feePresetLabel:
      typeof (record.exportShapeSnapshot as Record<string, unknown> | null)?.feePresetLabel === "string"
        ? String((record.exportShapeSnapshot as Record<string, unknown>).feePresetLabel)
        : null,
    shippingZoneLabel:
      typeof (record.exportShapeSnapshot as Record<string, unknown> | null)?.shippingZoneLabel === "string"
        ? String((record.exportShapeSnapshot as Record<string, unknown>).shippingZoneLabel)
        : null
  });

  const artifacts = buildListingArtifactsForScenario({
    scenarioRecord: record.calculationScenario,
    overrideReason:
      typeof (record.overrideSnapshot as Record<string, unknown> | null)?.overrideReason === "string"
        ? String((record.overrideSnapshot as Record<string, unknown>).overrideReason)
        : null,
    overrideApproved: Boolean((record.overrideSnapshot as Record<string, unknown> | null)?.overrideApproved),
    approvedByMembershipId:
      typeof (record.overrideSnapshot as Record<string, unknown> | null)?.approvedByMembershipId === "string"
        ? String((record.overrideSnapshot as Record<string, unknown>).approvedByMembershipId)
        : null,
    existingOverrideHistory: Array.isArray((record.overrideHistorySnapshot as Record<string, unknown> | null)?.history)
      ? (((record.overrideHistorySnapshot as Record<string, unknown>).history as unknown[]) as Array<Record<string, unknown>>)
      : null,
    mappingTemplate: record.marketplaceMappingTemplate ?? null,
    channelPreset: presetResolution.preset,
    comparisonSetId: record.comparisonSetId ?? null,
    packageId: record.id,
    exportVersion: record.exportVersion ?? "listing-prep-v1",
    exportContractVersion: record.exportContractVersion ?? "manual-amazon-v1",
    presetSelectionSummary: presetResolution.selectionSummary,
    existingApprovalHistory: Array.isArray((record.approvalHistorySnapshot as Record<string, unknown> | null)?.history)
      ? (((record.approvalHistorySnapshot as Record<string, unknown>).history as unknown[]) as Array<Record<string, unknown>>)
      : null,
    worksheetVersion: record.worksheetVersion ?? "manual-listing-v1"
  });

  await updateListingPrepPackageRecord({
    organizationId: input.organizationId,
    listingPrepPackageId: record.id,
    data: normalizeUpdateData({
      status: artifacts.packageStatus.packageStatus,
      listingReadinessStatus: artifacts.listingReadinessStatus,
      exportSnapshot: artifacts.exportSnapshot,
      marketplaceFieldSnapshot: artifacts.marketplaceFieldSnapshot,
      validationSnapshot: artifacts.validationSnapshot,
      warningSnapshot: artifacts.strongerAlertSnapshot?.warnings ?? null,
      overrideSnapshot: artifacts.overrideSnapshot,
      approvalState: artifacts.approvalState,
      approvalSummarySnapshot: artifacts.approvalSummarySnapshot,
      exportVersion: artifacts.exportVersion,
      exportContractVersion: artifacts.exportContractVersion,
      exportShapeSnapshot: artifacts.exportShapeSnapshot,
      overrideHistorySnapshot: artifacts.overrideHistorySnapshot,
      readyForListingPrep: artifacts.readyForListingPrep,
      readyForListingPrepSummary: artifacts.readyForListingPrepSummary,
      manualAmazonExportSnapshot: artifacts.manualAmazonExportSnapshot,
      approvalHistorySnapshot: artifacts.approvalHistorySnapshot,
      autoAppliedChannelPreset: presetResolution.autoApplied,
      channelPresetSelectionSummary: artifacts.channelPresetSelectionSummary,
      manualListingWorksheetSnapshot: artifacts.manualListingWorksheetSnapshot,
      worksheetVersion: artifacts.worksheetVersion,
      worksheetSummarySnapshot: artifacts.worksheetSummarySnapshot,
      operatorWorksheetSnapshot: artifacts.operatorWorksheetSnapshot,
      operatorWorksheetVersion: artifacts.operatorWorksheetVersion,
      operatorChecklistSnapshot: artifacts.operatorChecklistSnapshot,
      channelHandoffSummarySnapshot: artifacts.channelHandoffSummarySnapshot,
      currentApprovedArtifactSummary: artifacts.currentApprovedArtifactSummary,
      operatorPromptSnapshot: artifacts.operatorPromptSnapshot,
      copyExportSnapshot: artifacts.copyExportSnapshot,
      plainTextWorksheetSnapshot: artifacts.plainTextWorksheetSnapshot,
      structuredWorksheetExportSnapshot: artifacts.structuredWorksheetExportSnapshot,
      worksheetErgonomicsSummary: artifacts.worksheetErgonomicsSummary,
      quickCopySummarySnapshot: artifacts.quickCopySummarySnapshot,
      finalReviewPromptSnapshot: artifacts.finalReviewPromptSnapshot,
      artifactHandoffSummarySnapshot: artifacts.artifactHandoffSummarySnapshot,
      shortPlainTextSummarySnapshot: artifacts.shortPlainTextSummarySnapshot,
      quickCopyVersion: artifacts.quickCopyVersion,
      channelMappingPresetId: presetResolution.preset?.id ?? null,
      currentApprovedArtifact: false,
      notes: input.notes ?? record.notes ?? null,
      approvedAt: record.approvedAt ?? null
    })
  });

  await updateCalculationScenarioRecord({
    organizationId: input.organizationId,
    scenarioId: record.calculationScenarioId,
    data: normalizeUpdateData({
      latestOverrideSummarySnapshot: artifacts.overrideHistorySnapshot?.latestOverride ?? null,
      latestApprovalSummarySnapshot: artifacts.approvalSummarySnapshot,
      latestPresetSelectionSummarySnapshot: artifacts.channelPresetSelectionSummary,
      latestWorksheetSummarySnapshot: artifacts.worksheetSummarySnapshot,
      latestQuickCopySummarySnapshot: artifacts.quickCopySummarySnapshot,
      latestOperatorPromptSummarySnapshot: {
        summary: artifacts.operatorPromptSnapshot?.summary ?? null,
        criticalPrompts: artifacts.operatorPromptSnapshot?.criticalPrompts ?? [],
        reviewPrompts: artifacts.operatorPromptSnapshot?.reviewPrompts ?? [],
        completionPrompts: artifacts.operatorPromptSnapshot?.completionPrompts ?? []
      },
      listingPrepPackageId: record.id
    })
  });

  if (record.comparisonSetId) {
    await updateCalculationComparisonSetRecord({
      organizationId: input.organizationId,
      comparisonSetId: record.comparisonSetId,
      data: normalizeUpdateData({
        selectedListingPrepPackageId: record.id,
        listingPrepSummarySnapshot: {
          listingPrepPackageId: record.id,
          packageStatus: artifacts.packageStatus.packageStatus,
          packageReadinessLabel: artifacts.packageStatus.packageReadinessLabel,
          validationSummary: artifacts.validationSnapshot.validationSummary,
          overrideSummary: artifacts.overrideSnapshot.summary,
          readyForListingPrep: artifacts.readyForListingPrep,
          readyForListingPrepSummary: artifacts.readyForListingPrepSummary,
          mappingTemplateLabel: record.marketplaceMappingTemplate?.name ?? null,
          channelPresetLabel: presetResolution.preset?.name ?? null,
          approvalState: artifacts.approvalState,
          approvalSummary: artifacts.approvalSummarySnapshot,
          presetSelectionSummary: artifacts.channelPresetSelectionSummary,
          worksheetSummary: artifacts.worksheetSummarySnapshot,
          operatorWorksheetSummary: artifacts.operatorWorksheetSnapshot
        },
        selectedListingPrepReadySnapshot: artifacts.readyForListingPrepSummary,
        selectedListingPrepExportVersion: artifacts.exportVersion,
        selectedListingPrepApprovalSnapshot: artifacts.approvalSummarySnapshot,
        selectedListingPrepExportContractVersion: artifacts.exportContractVersion,
        selectedWorksheetVersion: artifacts.worksheetVersion,
        selectedWorksheetSummarySnapshot: artifacts.worksheetSummarySnapshot,
        selectedOperatorWorksheetVersion: artifacts.operatorWorksheetVersion,
        selectedOperatorWorksheetSummarySnapshot: artifacts.operatorWorksheetSnapshot,
        selectedWorksheetErgonomicsSummary: artifacts.worksheetErgonomicsSummary,
        selectedQuickCopySummarySnapshot: artifacts.quickCopySummarySnapshot,
        selectedFinalReviewPromptSnapshot: artifacts.finalReviewPromptSnapshot
      })
    });
  }

  const refreshed = await getListingPrepPackageRecord(input);
  return { ok: true, listingPrepPackage: mapListingPrepPackage(refreshed) };
}

export async function evaluateMarketplaceFieldValidation(input: {
  organizationId: string;
  listingPrepPackageId: string;
  notes?: string | null;
}) {
  const record = await getListingPrepPackageRecord(input);
  if (!record) {
    throw new Error("Listing prep package not found.");
  }

  const strongerAlerts = {
    warnings: Array.isArray(record.warningSnapshot) ? record.warningSnapshot : []
  };
  const overrideSnapshot = (record.overrideSnapshot ?? {}) as Record<string, unknown>;
  const validationSnapshot = buildMarketplaceFieldValidationResult({
    listingReadinessStatus: record.listingReadinessStatus,
    marketplaceFields: (record.marketplaceFieldSnapshot ?? {}) as Record<string, unknown>,
    strongerAlerts,
    overrideApproved: Boolean(overrideSnapshot.overrideApproved)
  });
  const packageStatus = calculateListingPrepPackageStatus({
    listingReadinessStatus: record.listingReadinessStatus,
    validationStatus: validationSnapshot.validationStatus,
    overrideSnapshot: {
      overrideRequested: Boolean(overrideSnapshot.overrideRequested),
      overrideApproved: Boolean(overrideSnapshot.overrideApproved)
    }
  });
  const readyForListingPrepSummary = calculateReadyForListingPrep({
    listingReadinessStatus: record.listingReadinessStatus,
    validationSnapshot,
    packageStatus,
    strongerAlerts,
    overrideSnapshot: {
      overrideApproved: Boolean(overrideSnapshot.overrideApproved),
      summary: typeof overrideSnapshot.summary === "string" ? String(overrideSnapshot.summary) : null
    },
    exportShapeSnapshot: (record.exportShapeSnapshot ?? {}) as Record<string, unknown>,
    mappingTemplate: record.marketplaceMappingTemplate
      ? {
          id: record.marketplaceMappingTemplate.id,
          name: record.marketplaceMappingTemplate.name
        }
      : null
  });
  const approval = calculateApprovalState({
    readyForListingPrepSummary,
    overrideSnapshot,
    manualAmazonExportSnapshot: record.manualAmazonExportSnapshot as Record<string, unknown> | null,
    explicitApproval: false
  });
  const approvalSummarySnapshot = buildApprovalSummarySnapshot({
    approvalState: approval.approvalState,
    readyForListingPrepSummary,
    overrideSnapshot
  });
  const approvalHistorySnapshot = buildApprovalHistorySnapshot({
    existingHistory: Array.isArray((record.approvalHistorySnapshot as Record<string, unknown> | null)?.history)
      ? (((record.approvalHistorySnapshot as Record<string, unknown>).history as unknown[]) as Array<Record<string, unknown>>)
      : null,
    nextAction: approval.approvalState === "BLOCKED" ? "BLOCKED" : "MARKED_REVIEW",
    details: { approvalState: approval.approvalState }
  });
  const manualListingWorksheetSnapshot = buildManualListingWorksheet({
    worksheetVersion: record.worksheetVersion ?? "manual-listing-v1",
    packageId: record.id,
    packageApprovalState: approval.approvalState,
    currentApprovedArtifact: false,
    selectedScenarioId: record.calculationScenarioId,
    selectedScenarioName: record.calculationScenario?.name ?? null,
    exportShapeSnapshot: (record.exportShapeSnapshot ?? null) as Record<string, unknown> | null,
    approvalSummarySnapshot,
    readyForListingPrepSummary,
    overrideSummary: overrideSnapshot,
    presetSelectionSummary: (record.channelPresetSelectionSummary ?? null) as Record<string, unknown> | null
  });
  const operatorChecklistSnapshot = buildOperatorFieldChecklist({
    validationSnapshot,
    readyForListingPrepSummary,
    preset: record.channelMappingPreset
      ? {
          requiredFieldChecklistSnapshot:
            record.channelMappingPreset.requiredFieldChecklistSnapshot ?? null,
          optionalFieldChecklistSnapshot:
            record.channelMappingPreset.optionalFieldChecklistSnapshot ?? null,
          worksheetPromptSnapshot: record.channelMappingPreset.worksheetPromptSnapshot ?? null
        }
      : null
  });
  const channelHandoffSummarySnapshot = buildChannelHandoffSummary({
    preset: record.channelMappingPreset
      ? {
          id: record.channelMappingPreset.id,
          name: record.channelMappingPreset.name,
          channelCode: record.channelMappingPreset.channelCode,
          worksheetFieldOrderingSnapshot:
            record.channelMappingPreset.worksheetFieldOrderingSnapshot ?? null,
          worksheetPromptSnapshot: record.channelMappingPreset.worksheetPromptSnapshot ?? null,
          requiredFieldChecklistSnapshot:
            record.channelMappingPreset.requiredFieldChecklistSnapshot ?? null,
          optionalFieldChecklistSnapshot:
            record.channelMappingPreset.optionalFieldChecklistSnapshot ?? null,
          notes: record.channelMappingPreset.notes ?? null
        }
      : null,
    selectionSummary: (record.channelPresetSelectionSummary ?? null) as Record<string, unknown> | null
  });
  const currentApprovedArtifactSummary = buildCurrentApprovedArtifactSummary({
    packageId: record.id,
    name: record.name,
    approvalState: approval.approvalState,
    currentApprovedArtifact: false,
    exportVersion: record.exportVersion ?? "listing-prep-v1",
    exportContractVersion: record.exportContractVersion ?? "manual-amazon-v1",
    worksheetVersion: record.worksheetVersion ?? "manual-listing-v1",
    operatorWorksheetVersion: "operator-listing-v1",
    overrideSnapshot
  });
  const operatorWorksheetSnapshot = buildOperatorWorksheetPackage({
    operatorWorksheetVersion: "operator-listing-v1",
    packageId: record.id,
    packageName: record.name,
    packageApprovalState: approval.approvalState,
    currentApprovedArtifact: false,
    selectedScenarioId: record.calculationScenarioId,
    selectedScenarioName: record.calculationScenario?.name ?? null,
    exportShapeSnapshot: (record.exportShapeSnapshot ?? null) as Record<string, unknown> | null,
    manualListingWorksheetSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    channelHandoffSummary: channelHandoffSummarySnapshot,
    currentApprovedArtifactSummary
  });
  const operatorPromptSnapshot = buildOperatorPromptSnapshot({
    approvalState: approval.approvalState,
    currentApprovedArtifact: false,
    warningSnapshot: strongerAlerts.warnings as any,
    overrideSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    preset: record.channelMappingPreset
      ? {
          operatorPromptTemplateSnapshot:
            record.channelMappingPreset.operatorPromptTemplateSnapshot ?? null
        }
      : null
  });
  const copyExportSnapshot = buildCopyExportSnapshot({
    packageId: record.id,
    exportShapeSnapshot: (record.exportShapeSnapshot ?? null) as Record<string, unknown> | null,
    operatorWorksheetSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    promptSnapshot: operatorPromptSnapshot,
    preset: record.channelMappingPreset
      ? {
          copyGroupOrderingSnapshot:
            record.channelMappingPreset.copyGroupOrderingSnapshot ?? null,
          worksheetSectionLabelSnapshot:
            record.channelMappingPreset.worksheetSectionLabelSnapshot ?? null
        }
      : null
  });
  const plainTextWorksheetSnapshot = buildPlainTextWorksheet({
    operatorWorksheetSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    promptSnapshot: operatorPromptSnapshot,
    currentApprovedArtifactSummary
  });
  const structuredWorksheetExportSnapshot = buildStructuredWorksheetExport({
    operatorWorksheetSnapshot,
    copyExportSnapshot,
    promptSnapshot: operatorPromptSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    currentApprovedArtifactSummary
  });
  const worksheetErgonomicsSummary = buildWorksheetErgonomicsSummary({
    checklistSnapshot: operatorChecklistSnapshot,
    promptSnapshot: operatorPromptSnapshot,
    copyExportSnapshot,
    currentApprovedArtifact: false
  });
  const worksheetSummarySnapshot = buildWorksheetSummarySnapshot({
    worksheet: operatorWorksheetSnapshot,
    presetSelectionSummary: (record.channelPresetSelectionSummary ?? null) as Record<string, unknown> | null
  });
  const quickCopySummarySnapshot = buildQuickCopySummarySnapshot({
    copyExportSnapshot,
    exportShapeSnapshot: (record.exportShapeSnapshot ?? null) as Record<string, unknown> | null,
    preset: record.channelMappingPreset
      ? {
          quickCopyOrderingSnapshot:
            record.channelMappingPreset.quickCopyOrderingSnapshot ?? null
        }
      : null
  });
  const finalReviewPromptSnapshot = buildFinalReviewPromptSnapshot({
    approvalState: approval.approvalState,
    currentApprovedArtifact: false,
    warningSnapshot: strongerAlerts.warnings as any,
    overrideSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    preset: record.channelMappingPreset
      ? {
          finalReviewPromptTemplateSnapshot:
            record.channelMappingPreset.finalReviewPromptTemplateSnapshot ?? null
        }
      : null
  });
  const artifactHandoffSummarySnapshot = buildArtifactHandoffSummarySnapshot({
    packageId: record.id,
    packageName: record.name,
    approvalState: approval.approvalState,
    currentApprovedArtifact: false,
    exportContractVersion: record.exportContractVersion ?? "manual-amazon-v1",
    worksheetVersion: record.worksheetVersion ?? "manual-listing-v1",
    operatorWorksheetVersion: "operator-listing-v1",
    quickCopyVersion: record.quickCopyVersion ?? "quick-copy-v1"
  });
  const shortPlainTextSummarySnapshot = buildShortPlainTextSummary({
    exportShapeSnapshot: (record.exportShapeSnapshot ?? null) as Record<string, unknown> | null,
    approvalState: approval.approvalState,
    currentApprovedArtifact: false,
    readyForListingPrepSummary,
    preset: record.channelMappingPreset
      ? {
          shortSummaryFormatSnapshot:
            record.channelMappingPreset.shortSummaryFormatSnapshot ?? null
        }
      : null
  });
  const completionCueSnapshot = buildCompletionCueSnapshot({
    approvalState: approval.approvalState,
    currentApprovedArtifact: false,
    overrideSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    warningSnapshot: strongerAlerts.warnings as any,
    preset: record.channelMappingPreset
      ? {
          completionCueTemplateSnapshot:
            record.channelMappingPreset.completionCueTemplateSnapshot ?? null
        }
      : null
  });
  const internalShareSummarySnapshot = buildInternalShareSummarySnapshot({
    packageId: record.id,
    packageName: record.name,
    approvalState: approval.approvalState,
    currentApprovedArtifact: false,
    currentApprovedArtifactSummary,
    quickCopySummarySnapshot,
    finalReviewPromptSnapshot,
    artifactHandoffSummarySnapshot,
    shortPlainTextSummarySnapshot,
    warningSnapshot: strongerAlerts.warnings as any,
    preset: record.channelMappingPreset
      ? {
          shareSummaryFormatSnapshot:
            record.channelMappingPreset.shareSummaryFormatSnapshot ?? null
        }
      : null
  });
  const shortShareTextSnapshot = buildShortShareTextSnapshot({
    packageName: record.name,
    approvalState: approval.approvalState,
    currentApprovedArtifact: false,
    quickCopySummarySnapshot,
    completionCueSnapshot,
    preset: record.channelMappingPreset
      ? {
          shareSummaryFormatSnapshot:
            record.channelMappingPreset.shareSummaryFormatSnapshot ?? null
        }
      : null
  });
  const lastChangeSummarySnapshot = buildLastChangeSummarySnapshot({
    approvalHistorySnapshot,
    overrideHistorySnapshot: (record.overrideHistorySnapshot ?? null) as Record<string, unknown> | null,
    channelPresetSelectionSummary: (record.channelPresetSelectionSummary ?? null) as Record<string, unknown> | null
  });
  const runbookVersion = record.runbookVersion ?? "manual-runbook-v1";
  const finalRunbookSnapshot = buildFinalRunbookSnapshot({
    packageId: record.id,
    packageName: record.name,
    approvalState: approval.approvalState,
    currentApprovedArtifactSummary,
    quickCopySummarySnapshot,
    finalReviewPromptSnapshot,
    completionCueSnapshot,
    warningSnapshot: strongerAlerts.warnings as any,
    overrideSnapshot,
    internalShareSummarySnapshot,
    lastChangeSummarySnapshot,
    preset: record.channelMappingPreset
      ? {
          finalReviewOrderingSnapshot:
            record.channelMappingPreset.finalReviewOrderingSnapshot ?? null
        }
      : null
  });
  await updateListingPrepPackageRecord({
    organizationId: input.organizationId,
    listingPrepPackageId: input.listingPrepPackageId,
    data: normalizeUpdateData({
      validationSnapshot,
      status: packageStatus.packageStatus,
      approvalState: approval.approvalState,
      approvalSummarySnapshot,
      approvalHistorySnapshot,
      readyForListingPrep: readyForListingPrepSummary.readyForListingPrep,
      readyForListingPrepSummary,
      manualListingWorksheetSnapshot,
      worksheetSummarySnapshot,
      operatorWorksheetSnapshot,
      operatorWorksheetVersion: "operator-listing-v1",
      operatorChecklistSnapshot,
      channelHandoffSummarySnapshot,
      currentApprovedArtifactSummary,
      operatorPromptSnapshot,
      copyExportSnapshot,
      plainTextWorksheetSnapshot,
      structuredWorksheetExportSnapshot,
      worksheetErgonomicsSummary,
      quickCopySummarySnapshot,
      finalReviewPromptSnapshot,
      artifactHandoffSummarySnapshot,
      shortPlainTextSummarySnapshot,
      quickCopyVersion: record.quickCopyVersion ?? "quick-copy-v1",
      finalRunbookSnapshot,
      completionCueSnapshot,
      internalShareSummarySnapshot,
      shortShareTextSnapshot,
      runbookVersion,
      lastChangeSummarySnapshot,
      currentApprovedArtifact: false,
      notes: input.notes ?? record.notes ?? null,
      approvedAt: null
    })
  });

  if (record.comparisonSetId) {
    await updateCalculationComparisonSetRecord({
      organizationId: input.organizationId,
      comparisonSetId: record.comparisonSetId,
      data: normalizeUpdateData({
        listingPrepSummarySnapshot: {
          listingPrepPackageId: record.id,
          packageStatus: packageStatus.packageStatus,
          packageReadinessLabel: packageStatus.packageReadinessLabel,
          validationSummary: validationSnapshot.validationSummary,
          overrideSummary: overrideSnapshot.summary ?? null,
          readyForListingPrep: readyForListingPrepSummary.readyForListingPrep,
          readyForListingPrepSummary,
          mappingTemplateLabel: record.marketplaceMappingTemplate?.name ?? null,
          channelPresetLabel: record.channelMappingPreset?.name ?? null,
          approvalState: approval.approvalState,
          approvalSummary: approvalSummarySnapshot,
          worksheetSummary: worksheetSummarySnapshot,
          operatorWorksheetSummary: operatorWorksheetSnapshot
        },
        selectedListingPrepReadySnapshot: readyForListingPrepSummary,
        selectedListingPrepExportVersion: record.exportVersion ?? "listing-prep-v1",
        selectedListingPrepApprovalSnapshot: approvalSummarySnapshot,
        selectedListingPrepExportContractVersion: record.exportContractVersion ?? "manual-amazon-v1",
        selectedWorksheetVersion: record.worksheetVersion ?? "manual-listing-v1",
        selectedWorksheetSummarySnapshot: worksheetSummarySnapshot,
        selectedOperatorWorksheetVersion: "operator-listing-v1",
        selectedOperatorWorksheetSummarySnapshot: operatorWorksheetSnapshot,
        selectedWorksheetErgonomicsSummary: worksheetErgonomicsSummary,
        selectedQuickCopySummarySnapshot: quickCopySummarySnapshot,
        selectedFinalReviewPromptSnapshot: finalReviewPromptSnapshot,
        selectedRunbookVersion: runbookVersion,
        selectedRunbookSummarySnapshot: finalRunbookSnapshot
      })
    });
  }

  const refreshed = await getListingPrepPackageRecord(input);
  return { ok: true, listingPrepPackage: mapListingPrepPackage(refreshed) };
}

export async function requestPriceFloorOverride(input: {
  organizationId: string;
  listingPrepPackageId: string;
  reason: string;
  approve?: boolean;
  approvedByMembershipId?: string | null;
}) {
  const record = await getListingPrepPackageRecord(input);
  if (!record) {
    throw new Error("Listing prep package not found.");
  }

  const strongerAlerts = {
    warnings: Array.isArray(record.warningSnapshot) ? record.warningSnapshot : []
  };
  const overrideSnapshot = buildPriceFloorOverrideSnapshot({
    strongerAlerts,
    reason: input.reason,
    approved: input.approve ?? false,
    approvedByMembershipId: input.approvedByMembershipId ?? null
  });
  const validationSnapshot = buildMarketplaceFieldValidationResult({
    listingReadinessStatus: record.listingReadinessStatus,
    marketplaceFields: (record.marketplaceFieldSnapshot ?? {}) as Record<string, unknown>,
    strongerAlerts,
    overrideApproved: overrideSnapshot.overrideApproved
  });
  const packageStatus = calculateListingPrepPackageStatus({
    listingReadinessStatus: record.listingReadinessStatus,
    validationStatus: validationSnapshot.validationStatus,
    overrideSnapshot
  });
  const overrideHistorySnapshot = buildOverrideHistorySnapshot({
    existingHistory: Array.isArray((record.overrideHistorySnapshot as Record<string, unknown> | null)?.history)
      ? (((record.overrideHistorySnapshot as Record<string, unknown>).history as unknown[]) as Array<Record<string, unknown>>)
      : null,
    latestOverride: overrideSnapshot,
    approvedAt: overrideSnapshot.overrideApproved ? new Date() : null,
    approvedByMembershipId: input.approvedByMembershipId ?? null
  });
  const readyForListingPrepSummary = calculateReadyForListingPrep({
    listingReadinessStatus: record.listingReadinessStatus,
    validationSnapshot,
    packageStatus,
    strongerAlerts,
    overrideSnapshot,
    exportShapeSnapshot: (record.exportShapeSnapshot ?? {}) as Record<string, unknown>,
    mappingTemplate: record.marketplaceMappingTemplate
      ? {
          id: record.marketplaceMappingTemplate.id,
          name: record.marketplaceMappingTemplate.name
        }
      : null
  });
  const approval = calculateApprovalState({
    readyForListingPrepSummary,
    overrideSnapshot,
    manualAmazonExportSnapshot: record.manualAmazonExportSnapshot as Record<string, unknown> | null,
    explicitApproval: false
  });
  const approvalSummarySnapshot = buildApprovalSummarySnapshot({
    approvalState: approval.approvalState,
    readyForListingPrepSummary,
    overrideSnapshot,
    approvedByMembershipId: input.approvedByMembershipId ?? null
  });
  const approvalHistorySnapshot = buildApprovalHistorySnapshot({
    existingHistory: Array.isArray((record.approvalHistorySnapshot as Record<string, unknown> | null)?.history)
      ? (((record.approvalHistorySnapshot as Record<string, unknown>).history as unknown[]) as Array<Record<string, unknown>>)
      : null,
    nextAction: approval.approvalState === "BLOCKED" ? "BLOCKED" : "MARKED_REVIEW",
    actorMembershipId: input.approvedByMembershipId ?? null,
    reason: input.reason,
    details: { approvalState: approval.approvalState }
  });
  const manualListingWorksheetSnapshot = buildManualListingWorksheet({
    worksheetVersion: record.worksheetVersion ?? "manual-listing-v1",
    packageId: record.id,
    packageApprovalState: approval.approvalState,
    currentApprovedArtifact: false,
    selectedScenarioId: record.calculationScenarioId,
    selectedScenarioName: record.calculationScenario?.name ?? null,
    exportShapeSnapshot: (record.exportShapeSnapshot ?? null) as Record<string, unknown> | null,
    approvalSummarySnapshot,
    readyForListingPrepSummary,
    overrideSummary: overrideSnapshot,
    presetSelectionSummary: (record.channelPresetSelectionSummary ?? null) as Record<string, unknown> | null
  });
  const operatorChecklistSnapshot = buildOperatorFieldChecklist({
    validationSnapshot,
    readyForListingPrepSummary,
    preset: record.channelMappingPreset
      ? {
          requiredFieldChecklistSnapshot:
            record.channelMappingPreset.requiredFieldChecklistSnapshot ?? null,
          optionalFieldChecklistSnapshot:
            record.channelMappingPreset.optionalFieldChecklistSnapshot ?? null,
          worksheetPromptSnapshot: record.channelMappingPreset.worksheetPromptSnapshot ?? null
        }
      : null
  });
  const channelHandoffSummarySnapshot = buildChannelHandoffSummary({
    preset: record.channelMappingPreset
      ? {
          id: record.channelMappingPreset.id,
          name: record.channelMappingPreset.name,
          channelCode: record.channelMappingPreset.channelCode,
          worksheetFieldOrderingSnapshot:
            record.channelMappingPreset.worksheetFieldOrderingSnapshot ?? null,
          worksheetPromptSnapshot: record.channelMappingPreset.worksheetPromptSnapshot ?? null,
          requiredFieldChecklistSnapshot:
            record.channelMappingPreset.requiredFieldChecklistSnapshot ?? null,
          optionalFieldChecklistSnapshot:
            record.channelMappingPreset.optionalFieldChecklistSnapshot ?? null,
          notes: record.channelMappingPreset.notes ?? null
        }
      : null,
    selectionSummary: (record.channelPresetSelectionSummary ?? null) as Record<string, unknown> | null
  });
  const currentApprovedArtifactSummary = buildCurrentApprovedArtifactSummary({
    packageId: record.id,
    name: record.name,
    approvalState: approval.approvalState,
    currentApprovedArtifact: false,
    exportVersion: record.exportVersion ?? "listing-prep-v1",
    exportContractVersion: record.exportContractVersion ?? "manual-amazon-v1",
    worksheetVersion: record.worksheetVersion ?? "manual-listing-v1",
    operatorWorksheetVersion: "operator-listing-v1",
    overrideSnapshot
  });
  const operatorWorksheetSnapshot = buildOperatorWorksheetPackage({
    operatorWorksheetVersion: "operator-listing-v1",
    packageId: record.id,
    packageName: record.name,
    packageApprovalState: approval.approvalState,
    currentApprovedArtifact: false,
    selectedScenarioId: record.calculationScenarioId,
    selectedScenarioName: record.calculationScenario?.name ?? null,
    exportShapeSnapshot: (record.exportShapeSnapshot ?? null) as Record<string, unknown> | null,
    manualListingWorksheetSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    channelHandoffSummary: channelHandoffSummarySnapshot,
    currentApprovedArtifactSummary
  });
  const operatorPromptSnapshot = buildOperatorPromptSnapshot({
    approvalState: approval.approvalState,
    currentApprovedArtifact: false,
    warningSnapshot: strongerAlerts.warnings as any,
    overrideSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    preset: record.channelMappingPreset
      ? {
          operatorPromptTemplateSnapshot:
            record.channelMappingPreset.operatorPromptTemplateSnapshot ?? null
        }
      : null
  });
  const copyExportSnapshot = buildCopyExportSnapshot({
    packageId: record.id,
    exportShapeSnapshot: (record.exportShapeSnapshot ?? null) as Record<string, unknown> | null,
    operatorWorksheetSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    promptSnapshot: operatorPromptSnapshot,
    preset: record.channelMappingPreset
      ? {
          copyGroupOrderingSnapshot:
            record.channelMappingPreset.copyGroupOrderingSnapshot ?? null,
          worksheetSectionLabelSnapshot:
            record.channelMappingPreset.worksheetSectionLabelSnapshot ?? null
        }
      : null
  });
  const plainTextWorksheetSnapshot = buildPlainTextWorksheet({
    operatorWorksheetSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    promptSnapshot: operatorPromptSnapshot,
    currentApprovedArtifactSummary
  });
  const structuredWorksheetExportSnapshot = buildStructuredWorksheetExport({
    operatorWorksheetSnapshot,
    copyExportSnapshot,
    promptSnapshot: operatorPromptSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    currentApprovedArtifactSummary
  });
  const worksheetErgonomicsSummary = buildWorksheetErgonomicsSummary({
    checklistSnapshot: operatorChecklistSnapshot,
    promptSnapshot: operatorPromptSnapshot,
    copyExportSnapshot,
    currentApprovedArtifact: false
  });
  const worksheetSummarySnapshot = buildWorksheetSummarySnapshot({
    worksheet: operatorWorksheetSnapshot,
    presetSelectionSummary: (record.channelPresetSelectionSummary ?? null) as Record<string, unknown> | null
  });
  const quickCopySummarySnapshot = buildQuickCopySummarySnapshot({
    copyExportSnapshot,
    exportShapeSnapshot: (record.exportShapeSnapshot ?? null) as Record<string, unknown> | null,
    preset: record.channelMappingPreset
      ? {
          quickCopyOrderingSnapshot:
            record.channelMappingPreset.quickCopyOrderingSnapshot ?? null
        }
      : null
  });
  const finalReviewPromptSnapshot = buildFinalReviewPromptSnapshot({
    approvalState: approval.approvalState,
    currentApprovedArtifact: false,
    warningSnapshot: strongerAlerts.warnings as any,
    overrideSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    preset: record.channelMappingPreset
      ? {
          finalReviewPromptTemplateSnapshot:
            record.channelMappingPreset.finalReviewPromptTemplateSnapshot ?? null
        }
      : null
  });
  const artifactHandoffSummarySnapshot = buildArtifactHandoffSummarySnapshot({
    packageId: record.id,
    packageName: record.name,
    approvalState: approval.approvalState,
    currentApprovedArtifact: false,
    exportContractVersion: record.exportContractVersion ?? "manual-amazon-v1",
    worksheetVersion: record.worksheetVersion ?? "manual-listing-v1",
    operatorWorksheetVersion: "operator-listing-v1",
    quickCopyVersion: record.quickCopyVersion ?? "quick-copy-v1"
  });
  const shortPlainTextSummarySnapshot = buildShortPlainTextSummary({
    exportShapeSnapshot: (record.exportShapeSnapshot ?? null) as Record<string, unknown> | null,
    approvalState: approval.approvalState,
    currentApprovedArtifact: false,
    readyForListingPrepSummary,
    preset: record.channelMappingPreset
      ? {
          shortSummaryFormatSnapshot:
            record.channelMappingPreset.shortSummaryFormatSnapshot ?? null
        }
      : null
  });
  const completionCueSnapshot = buildCompletionCueSnapshot({
    approvalState: approval.approvalState,
    currentApprovedArtifact: false,
    overrideSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    warningSnapshot: strongerAlerts.warnings as any,
    preset: record.channelMappingPreset
      ? {
          completionCueTemplateSnapshot:
            record.channelMappingPreset.completionCueTemplateSnapshot ?? null
        }
      : null
  });
  const internalShareSummarySnapshot = buildInternalShareSummarySnapshot({
    packageId: record.id,
    packageName: record.name,
    approvalState: approval.approvalState,
    currentApprovedArtifact: false,
    currentApprovedArtifactSummary,
    quickCopySummarySnapshot,
    finalReviewPromptSnapshot,
    artifactHandoffSummarySnapshot,
    shortPlainTextSummarySnapshot,
    warningSnapshot: strongerAlerts.warnings as any,
    preset: record.channelMappingPreset
      ? {
          shareSummaryFormatSnapshot:
            record.channelMappingPreset.shareSummaryFormatSnapshot ?? null
        }
      : null
  });
  const shortShareTextSnapshot = buildShortShareTextSnapshot({
    packageName: record.name,
    approvalState: approval.approvalState,
    currentApprovedArtifact: false,
    quickCopySummarySnapshot,
    completionCueSnapshot,
    preset: record.channelMappingPreset
      ? {
          shareSummaryFormatSnapshot:
            record.channelMappingPreset.shareSummaryFormatSnapshot ?? null
        }
      : null
  });
  const lastChangeSummarySnapshot = buildLastChangeSummarySnapshot({
    approvalHistorySnapshot,
    overrideHistorySnapshot,
    channelPresetSelectionSummary: (record.channelPresetSelectionSummary ?? null) as Record<string, unknown> | null
  });
  const runbookVersion = record.runbookVersion ?? "manual-runbook-v1";
  const finalRunbookSnapshot = buildFinalRunbookSnapshot({
    packageId: record.id,
    packageName: record.name,
    approvalState: approval.approvalState,
    currentApprovedArtifactSummary,
    quickCopySummarySnapshot,
    finalReviewPromptSnapshot,
    completionCueSnapshot,
    warningSnapshot: strongerAlerts.warnings as any,
    overrideSnapshot,
    internalShareSummarySnapshot,
    lastChangeSummarySnapshot,
    preset: record.channelMappingPreset
      ? {
          finalReviewOrderingSnapshot:
            record.channelMappingPreset.finalReviewOrderingSnapshot ?? null
        }
      : null
  });

  await updateListingPrepPackageRecord({
    organizationId: input.organizationId,
    listingPrepPackageId: input.listingPrepPackageId,
    data: normalizeUpdateData({
      overrideSnapshot,
      validationSnapshot,
      status: packageStatus.packageStatus,
      overrideHistorySnapshot,
      approvalState: approval.approvalState,
      approvalSummarySnapshot,
      approvalHistorySnapshot,
      readyForListingPrep: readyForListingPrepSummary.readyForListingPrep,
      readyForListingPrepSummary,
      manualListingWorksheetSnapshot,
      worksheetSummarySnapshot,
      operatorWorksheetSnapshot,
      operatorWorksheetVersion: "operator-listing-v1",
      operatorChecklistSnapshot,
      channelHandoffSummarySnapshot,
      currentApprovedArtifactSummary,
      operatorPromptSnapshot,
      copyExportSnapshot,
      plainTextWorksheetSnapshot,
      structuredWorksheetExportSnapshot,
      worksheetErgonomicsSummary,
      quickCopySummarySnapshot,
      finalReviewPromptSnapshot,
      artifactHandoffSummarySnapshot,
      shortPlainTextSummarySnapshot,
      quickCopyVersion: record.quickCopyVersion ?? "quick-copy-v1",
      finalRunbookSnapshot,
      completionCueSnapshot,
      internalShareSummarySnapshot,
      shortShareTextSnapshot,
      runbookVersion,
      lastChangeSummarySnapshot,
      currentApprovedArtifact: false,
      approvedAt: null,
      approvedByMembershipId: input.approvedByMembershipId ?? null
    })
  });

  await updateCalculationScenarioRecord({
    organizationId: input.organizationId,
    scenarioId: record.calculationScenarioId,
    data: normalizeUpdateData({
      priceFloorOverrideRequested: overrideSnapshot.overrideRequested,
      priceFloorOverrideApproved: overrideSnapshot.overrideApproved,
      priceFloorOverrideSnapshot: overrideSnapshot,
      listingPrepPackageId: record.id,
      latestOverrideSummarySnapshot: overrideHistorySnapshot.latestOverride ?? null,
      latestApprovalSummarySnapshot: approvalSummarySnapshot,
      latestWorksheetSummarySnapshot: worksheetSummarySnapshot,
      latestQuickCopySummarySnapshot: quickCopySummarySnapshot,
      latestRunbookSummarySnapshot: finalRunbookSnapshot,
      latestOperatorPromptSummarySnapshot: {
        summary: operatorPromptSnapshot.summary ?? null,
        criticalPrompts: operatorPromptSnapshot.criticalPrompts ?? [],
        reviewPrompts: operatorPromptSnapshot.reviewPrompts ?? [],
        completionPrompts: operatorPromptSnapshot.completionPrompts ?? []
      }
    })
  });

  if (record.comparisonSetId) {
    await updateCalculationComparisonSetRecord({
      organizationId: input.organizationId,
      comparisonSetId: record.comparisonSetId,
      data: normalizeUpdateData({
        selectedListingPrepPackageId: record.id,
        listingPrepSummarySnapshot: {
          listingPrepPackageId: record.id,
          packageStatus: packageStatus.packageStatus,
          packageReadinessLabel: packageStatus.packageReadinessLabel,
          validationSummary: validationSnapshot.validationSummary,
          overrideSummary: overrideSnapshot.summary,
          readyForListingPrep: readyForListingPrepSummary.readyForListingPrep,
          readyForListingPrepSummary,
          mappingTemplateLabel: record.marketplaceMappingTemplate?.name ?? null,
          channelPresetLabel: record.channelMappingPreset?.name ?? null,
          approvalState: approval.approvalState,
          approvalSummary: approvalSummarySnapshot,
          worksheetSummary: worksheetSummarySnapshot,
          operatorWorksheetSummary: operatorWorksheetSnapshot
        },
        selectedListingPrepReadySnapshot: readyForListingPrepSummary,
        selectedListingPrepExportVersion: record.exportVersion ?? "listing-prep-v1",
        selectedListingPrepApprovalSnapshot: approvalSummarySnapshot,
        selectedListingPrepExportContractVersion: record.exportContractVersion ?? "manual-amazon-v1",
        selectedWorksheetVersion: record.worksheetVersion ?? "manual-listing-v1",
        selectedWorksheetSummarySnapshot: worksheetSummarySnapshot,
        selectedOperatorWorksheetVersion: "operator-listing-v1",
        selectedOperatorWorksheetSummarySnapshot: operatorWorksheetSnapshot,
        selectedWorksheetErgonomicsSummary: worksheetErgonomicsSummary,
        selectedQuickCopySummarySnapshot: quickCopySummarySnapshot,
        selectedFinalReviewPromptSnapshot: finalReviewPromptSnapshot,
        selectedRunbookVersion: runbookVersion,
        selectedRunbookSummarySnapshot: finalRunbookSnapshot
      })
    });
  }

  const refreshed = await getListingPrepPackageRecord(input);
  return { ok: true, listingPrepPackage: mapListingPrepPackage(refreshed) };
}

export async function applyChannelMappingPresetToPackage(input: {
  organizationId: string;
  listingPrepPackageId: string;
  channelMappingPresetId: string;
}) {
  const record = await getListingPrepPackageRecord(input);
  if (!record) {
    throw new Error("Listing prep package not found.");
  }
  const preset = await getChannelMappingPresetRecord({
    organizationId: input.organizationId,
    channelMappingPresetId: input.channelMappingPresetId
  });
  if (!preset) {
    throw new Error("Channel mapping preset not found.");
  }

  await updateListingPrepPackageRecord({
    organizationId: input.organizationId,
    listingPrepPackageId: input.listingPrepPackageId,
    data: normalizeUpdateData({
      channelMappingPresetId: preset.id,
      autoAppliedChannelPreset: false
    })
  });

  return refreshListingPrepPackage({
    organizationId: input.organizationId,
    listingPrepPackageId: input.listingPrepPackageId,
    notes: record.notes ?? null
  });
}

export async function applyDefaultChannelMappingPreset(input: {
  organizationId: string;
  listingPrepPackageId: string;
}) {
  const record = await getListingPrepPackageRecord(input);
  if (!record) {
    throw new Error("Listing prep package not found.");
  }

  const presetResolution = await resolveChannelPresetForListingPackage({
    organizationId: input.organizationId,
    costProfileId: record.calculationScenario.costProfileId,
    scenarioRecord: record.calculationScenario,
    readyForListingPrepStatus:
      typeof (record.readyForListingPrepSummary as Record<string, unknown> | null)?.readyForListingPrepStatus ===
      "string"
        ? String((record.readyForListingPrepSummary as Record<string, unknown>).readyForListingPrepStatus)
        : null,
    listingReadinessStatus: record.listingReadinessStatus ?? null,
    feePresetLabel:
      typeof (record.exportShapeSnapshot as Record<string, unknown> | null)?.feePresetLabel === "string"
        ? String((record.exportShapeSnapshot as Record<string, unknown>).feePresetLabel)
        : null,
    shippingZoneLabel:
      typeof (record.exportShapeSnapshot as Record<string, unknown> | null)?.shippingZoneLabel === "string"
        ? String((record.exportShapeSnapshot as Record<string, unknown>).shippingZoneLabel)
        : null
  });

  if (!presetResolution.preset) {
    throw new Error("No default channel mapping preset matched this launch context.");
  }

  await updateListingPrepPackageRecord({
    organizationId: input.organizationId,
    listingPrepPackageId: input.listingPrepPackageId,
    data: normalizeUpdateData({
      channelMappingPresetId: presetResolution.preset.id,
      autoAppliedChannelPreset: true
    })
  });

  return refreshListingPrepPackage({
    organizationId: input.organizationId,
    listingPrepPackageId: input.listingPrepPackageId,
    notes: record.notes ?? null
  });
}

export async function approveListingPrepPackage(input: {
  organizationId: string;
  listingPrepPackageId: string;
  approvedByMembershipId?: string | null;
}) {
  const record = await getListingPrepPackageRecord(input);
  if (!record) {
    throw new Error("Listing prep package not found.");
  }

  const approval = calculateApprovalState({
    readyForListingPrepSummary: (record.readyForListingPrepSummary ?? null) as Record<string, unknown> | null,
    overrideSnapshot: (record.overrideSnapshot ?? null) as Record<string, unknown> | null,
    manualAmazonExportSnapshot: (record.manualAmazonExportSnapshot ?? null) as Record<string, unknown> | null,
    explicitApproval: true
  });

  if (approval.approvalState === "BLOCKED" || approval.approvalState === "READY_FOR_REVIEW") {
    throw new Error("Listing prep package is not ready for approval.");
  }

  const approvedAt = new Date();
  const approvalSummarySnapshot = buildApprovalSummarySnapshot({
    approvalState: approval.approvalState,
    readyForListingPrepSummary: (record.readyForListingPrepSummary ?? null) as Record<string, unknown> | null,
    overrideSnapshot: (record.overrideSnapshot ?? null) as Record<string, unknown> | null,
    approvedAt,
    approvedByMembershipId: input.approvedByMembershipId ?? null
  });
  const approvalHistorySnapshot = buildApprovalHistorySnapshot({
    existingHistory: Array.isArray((record.approvalHistorySnapshot as Record<string, unknown> | null)?.history)
      ? (((record.approvalHistorySnapshot as Record<string, unknown>).history as unknown[]) as Array<Record<string, unknown>>)
      : null,
    nextAction:
      approval.approvalState === "APPROVED_WITH_OVERRIDE" ? "APPROVED_WITH_OVERRIDE" : "APPROVED",
    actorMembershipId: input.approvedByMembershipId ?? null,
    details: {
      approvalState: approval.approvalState
    },
    createdAt: approvedAt
  });
  const manualAmazonExportSnapshot = buildManualAmazonExportSnapshot({
    packageId: record.id,
    comparisonSetId: record.comparisonSetId ?? null,
    scenarioId: record.calculationScenarioId,
    approvalState: approval.approvalState,
    exportContractVersion: record.exportContractVersion ?? "manual-amazon-v1",
    exportShapeSnapshot: (record.exportShapeSnapshot ?? null) as Record<string, unknown> | null,
    readyForListingPrepSummary: (record.readyForListingPrepSummary ?? null) as Record<string, unknown> | null,
    overrideSnapshot: (record.overrideSnapshot ?? null) as Record<string, unknown> | null,
    channelPreset: record.channelMappingPreset
      ? {
          id: record.channelMappingPreset.id,
          name: record.channelMappingPreset.name,
          channelCode: record.channelMappingPreset.channelCode
        }
      : null,
    approvedAt
  });
  const manualListingWorksheetSnapshot = buildManualListingWorksheet({
    worksheetVersion: record.worksheetVersion ?? "manual-listing-v1",
    packageId: record.id,
    packageApprovalState: approval.approvalState,
    currentApprovedArtifact: true,
    selectedScenarioId: record.calculationScenarioId,
    selectedScenarioName: record.calculationScenario?.name ?? null,
    exportShapeSnapshot: (record.exportShapeSnapshot ?? null) as Record<string, unknown> | null,
    approvalSummarySnapshot,
    readyForListingPrepSummary: (record.readyForListingPrepSummary ?? null) as Record<string, unknown> | null,
    overrideSummary: (record.overrideSnapshot ?? null) as Record<string, unknown> | null,
    presetSelectionSummary: (record.channelPresetSelectionSummary ?? null) as Record<string, unknown> | null,
    approvedAt
  });
  const operatorChecklistSnapshot = buildOperatorFieldChecklist({
    validationSnapshot: (record.validationSnapshot ?? null) as Record<string, unknown> | null,
    readyForListingPrepSummary: (record.readyForListingPrepSummary ?? null) as Record<string, unknown> | null,
    preset: record.channelMappingPreset
      ? {
          requiredFieldChecklistSnapshot:
            record.channelMappingPreset.requiredFieldChecklistSnapshot ?? null,
          optionalFieldChecklistSnapshot:
            record.channelMappingPreset.optionalFieldChecklistSnapshot ?? null,
          worksheetPromptSnapshot: record.channelMappingPreset.worksheetPromptSnapshot ?? null
        }
      : null
  });
  const channelHandoffSummarySnapshot = buildChannelHandoffSummary({
    preset: record.channelMappingPreset
      ? {
          id: record.channelMappingPreset.id,
          name: record.channelMappingPreset.name,
          channelCode: record.channelMappingPreset.channelCode,
          worksheetFieldOrderingSnapshot:
            record.channelMappingPreset.worksheetFieldOrderingSnapshot ?? null,
          worksheetPromptSnapshot: record.channelMappingPreset.worksheetPromptSnapshot ?? null,
          requiredFieldChecklistSnapshot:
            record.channelMappingPreset.requiredFieldChecklistSnapshot ?? null,
          optionalFieldChecklistSnapshot:
            record.channelMappingPreset.optionalFieldChecklistSnapshot ?? null,
          notes: record.channelMappingPreset.notes ?? null
        }
      : null,
    selectionSummary: (record.channelPresetSelectionSummary ?? null) as Record<string, unknown> | null
  });
  const currentApprovedArtifactSummary = buildCurrentApprovedArtifactSummary({
    packageId: record.id,
    name: record.name,
    approvalState: approval.approvalState,
    currentApprovedArtifact: true,
    exportVersion: record.exportVersion ?? "listing-prep-v1",
    exportContractVersion: record.exportContractVersion ?? "manual-amazon-v1",
    worksheetVersion: record.worksheetVersion ?? "manual-listing-v1",
    operatorWorksheetVersion: "operator-listing-v1",
    approvedAt,
    overrideSnapshot: (record.overrideSnapshot ?? null) as Record<string, unknown> | null
  });
  const operatorWorksheetSnapshot = buildOperatorWorksheetPackage({
    operatorWorksheetVersion: "operator-listing-v1",
    packageId: record.id,
    packageName: record.name,
    packageApprovalState: approval.approvalState,
    currentApprovedArtifact: true,
    selectedScenarioId: record.calculationScenarioId,
    selectedScenarioName: record.calculationScenario?.name ?? null,
    exportShapeSnapshot: (record.exportShapeSnapshot ?? null) as Record<string, unknown> | null,
    manualListingWorksheetSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    channelHandoffSummary: channelHandoffSummarySnapshot,
    currentApprovedArtifactSummary,
    approvedAt
  });
  const operatorPromptSnapshot = buildOperatorPromptSnapshot({
    approvalState: approval.approvalState,
    currentApprovedArtifact: true,
    warningSnapshot: Array.isArray(record.warningSnapshot) ? (record.warningSnapshot as any) : [],
    overrideSnapshot: (record.overrideSnapshot ?? null) as Record<string, unknown> | null,
    checklistSnapshot: operatorChecklistSnapshot,
    preset: record.channelMappingPreset
      ? {
          operatorPromptTemplateSnapshot:
            record.channelMappingPreset.operatorPromptTemplateSnapshot ?? null
        }
      : null
  });
  const copyExportSnapshot = buildCopyExportSnapshot({
    packageId: record.id,
    exportShapeSnapshot: (record.exportShapeSnapshot ?? null) as Record<string, unknown> | null,
    operatorWorksheetSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    promptSnapshot: operatorPromptSnapshot,
    preset: record.channelMappingPreset
      ? {
          copyGroupOrderingSnapshot:
            record.channelMappingPreset.copyGroupOrderingSnapshot ?? null,
          worksheetSectionLabelSnapshot:
            record.channelMappingPreset.worksheetSectionLabelSnapshot ?? null
        }
      : null
  });
  const plainTextWorksheetSnapshot = buildPlainTextWorksheet({
    operatorWorksheetSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    promptSnapshot: operatorPromptSnapshot,
    currentApprovedArtifactSummary
  });
  const structuredWorksheetExportSnapshot = buildStructuredWorksheetExport({
    operatorWorksheetSnapshot,
    copyExportSnapshot,
    promptSnapshot: operatorPromptSnapshot,
    checklistSnapshot: operatorChecklistSnapshot,
    currentApprovedArtifactSummary
  });
  const worksheetErgonomicsSummary = buildWorksheetErgonomicsSummary({
    checklistSnapshot: operatorChecklistSnapshot,
    promptSnapshot: operatorPromptSnapshot,
    copyExportSnapshot,
    currentApprovedArtifact: true
  });
  const worksheetSummarySnapshot = buildWorksheetSummarySnapshot({
    worksheet: operatorWorksheetSnapshot,
    presetSelectionSummary: (record.channelPresetSelectionSummary ?? null) as Record<string, unknown> | null
  });
  const quickCopySummarySnapshot = buildQuickCopySummarySnapshot({
    copyExportSnapshot,
    exportShapeSnapshot: (record.exportShapeSnapshot ?? null) as Record<string, unknown> | null,
    preset: record.channelMappingPreset
      ? {
          quickCopyOrderingSnapshot:
            record.channelMappingPreset.quickCopyOrderingSnapshot ?? null
        }
      : null
  });
  const finalReviewPromptSnapshot = buildFinalReviewPromptSnapshot({
    approvalState: approval.approvalState,
    currentApprovedArtifact: true,
    warningSnapshot: Array.isArray(record.warningSnapshot) ? (record.warningSnapshot as any) : [],
    overrideSnapshot: (record.overrideSnapshot ?? null) as Record<string, unknown> | null,
    checklistSnapshot: operatorChecklistSnapshot,
    preset: record.channelMappingPreset
      ? {
          finalReviewPromptTemplateSnapshot:
            record.channelMappingPreset.finalReviewPromptTemplateSnapshot ?? null
        }
      : null
  });
  const artifactHandoffSummarySnapshot = buildArtifactHandoffSummarySnapshot({
    packageId: record.id,
    packageName: record.name,
    approvalState: approval.approvalState,
    currentApprovedArtifact: true,
    exportContractVersion: record.exportContractVersion ?? "manual-amazon-v1",
    worksheetVersion: record.worksheetVersion ?? "manual-listing-v1",
    operatorWorksheetVersion: "operator-listing-v1",
    quickCopyVersion: record.quickCopyVersion ?? "quick-copy-v1"
  });
  const shortPlainTextSummarySnapshot = buildShortPlainTextSummary({
    exportShapeSnapshot: (record.exportShapeSnapshot ?? null) as Record<string, unknown> | null,
    approvalState: approval.approvalState,
    currentApprovedArtifact: true,
    readyForListingPrepSummary: (record.readyForListingPrepSummary ?? null) as Record<string, unknown> | null,
    preset: record.channelMappingPreset
      ? {
          shortSummaryFormatSnapshot:
            record.channelMappingPreset.shortSummaryFormatSnapshot ?? null
        }
      : null
  });
  const completionCueSnapshot = buildCompletionCueSnapshot({
    approvalState: approval.approvalState,
    currentApprovedArtifact: true,
    overrideSnapshot: (record.overrideSnapshot ?? null) as Record<string, unknown> | null,
    checklistSnapshot: operatorChecklistSnapshot,
    warningSnapshot: Array.isArray(record.warningSnapshot) ? (record.warningSnapshot as any) : [],
    preset: record.channelMappingPreset
      ? {
          completionCueTemplateSnapshot:
            record.channelMappingPreset.completionCueTemplateSnapshot ?? null
        }
      : null
  });
  const internalShareSummarySnapshot = buildInternalShareSummarySnapshot({
    packageId: record.id,
    packageName: record.name,
    approvalState: approval.approvalState,
    currentApprovedArtifact: true,
    currentApprovedArtifactSummary,
    quickCopySummarySnapshot,
    finalReviewPromptSnapshot,
    artifactHandoffSummarySnapshot,
    shortPlainTextSummarySnapshot,
    warningSnapshot: Array.isArray(record.warningSnapshot) ? (record.warningSnapshot as any) : [],
    preset: record.channelMappingPreset
      ? {
          shareSummaryFormatSnapshot:
            record.channelMappingPreset.shareSummaryFormatSnapshot ?? null
        }
      : null
  });
  const shortShareTextSnapshot = buildShortShareTextSnapshot({
    packageName: record.name,
    approvalState: approval.approvalState,
    currentApprovedArtifact: true,
    quickCopySummarySnapshot,
    completionCueSnapshot,
    preset: record.channelMappingPreset
      ? {
          shareSummaryFormatSnapshot:
            record.channelMappingPreset.shareSummaryFormatSnapshot ?? null
        }
      : null
  });
  const lastChangeSummarySnapshot = buildLastChangeSummarySnapshot({
    approvalHistorySnapshot,
    overrideHistorySnapshot: (record.overrideHistorySnapshot ?? null) as Record<string, unknown> | null,
    channelPresetSelectionSummary: (record.channelPresetSelectionSummary ?? null) as Record<string, unknown> | null
  });
  const runbookVersion = record.runbookVersion ?? "manual-runbook-v1";
  const finalRunbookSnapshot = buildFinalRunbookSnapshot({
    packageId: record.id,
    packageName: record.name,
    approvalState: approval.approvalState,
    currentApprovedArtifactSummary,
    quickCopySummarySnapshot,
    finalReviewPromptSnapshot,
    completionCueSnapshot,
    warningSnapshot: Array.isArray(record.warningSnapshot) ? (record.warningSnapshot as any) : [],
    overrideSnapshot: (record.overrideSnapshot ?? null) as Record<string, unknown> | null,
    internalShareSummarySnapshot,
    lastChangeSummarySnapshot,
    preset: record.channelMappingPreset
      ? {
          finalReviewOrderingSnapshot:
            record.channelMappingPreset.finalReviewOrderingSnapshot ?? null
        }
      : null
  });

  await clearCurrentApprovedArtifactsForScope({
    organizationId: input.organizationId,
    comparisonSetId: record.comparisonSetId ?? null,
    calculationScenarioId: record.calculationScenarioId,
    exceptListingPrepPackageId: record.id
  });

  await updateListingPrepPackageRecord({
    organizationId: input.organizationId,
    listingPrepPackageId: record.id,
    data: normalizeUpdateData({
      approvalState: approval.approvalState,
      approvalSummarySnapshot,
      manualAmazonExportSnapshot,
      approvalHistorySnapshot,
      manualListingWorksheetSnapshot,
      operatorWorksheetSnapshot,
      operatorWorksheetVersion: "operator-listing-v1",
      operatorChecklistSnapshot,
      channelHandoffSummarySnapshot,
      currentApprovedArtifactSummary,
      worksheetSummarySnapshot,
      operatorPromptSnapshot,
      copyExportSnapshot,
      plainTextWorksheetSnapshot,
      structuredWorksheetExportSnapshot,
      worksheetErgonomicsSummary,
      quickCopySummarySnapshot,
      finalReviewPromptSnapshot,
      artifactHandoffSummarySnapshot,
      shortPlainTextSummarySnapshot,
      quickCopyVersion: record.quickCopyVersion ?? "quick-copy-v1",
      finalRunbookSnapshot,
      completionCueSnapshot,
      internalShareSummarySnapshot,
      shortShareTextSnapshot,
      runbookVersion,
      lastChangeSummarySnapshot,
      approvedAt,
      approvedByMembershipId: input.approvedByMembershipId ?? null,
      currentApprovedArtifact: true
    })
  });

  await updateCalculationScenarioRecord({
    organizationId: input.organizationId,
    scenarioId: record.calculationScenarioId,
    data: normalizeUpdateData({
      latestApprovalSummarySnapshot: approvalSummarySnapshot,
      latestWorksheetSummarySnapshot: worksheetSummarySnapshot,
      latestQuickCopySummarySnapshot: quickCopySummarySnapshot,
      latestRunbookSummarySnapshot: finalRunbookSnapshot,
      latestOperatorPromptSummarySnapshot: {
        summary: operatorPromptSnapshot.summary ?? null,
        criticalPrompts: operatorPromptSnapshot.criticalPrompts ?? [],
        reviewPrompts: operatorPromptSnapshot.reviewPrompts ?? [],
        completionPrompts: operatorPromptSnapshot.completionPrompts ?? []
      }
    })
  });

  if (record.comparisonSetId) {
    await updateCalculationComparisonSetRecord({
      organizationId: input.organizationId,
      comparisonSetId: record.comparisonSetId,
      data: normalizeUpdateData({
        selectedListingPrepPackageId: record.id,
        selectedListingPrepApprovalSnapshot: approvalSummarySnapshot,
        selectedListingPrepExportContractVersion: record.exportContractVersion ?? "manual-amazon-v1",
        selectedWorksheetVersion: record.worksheetVersion ?? "manual-listing-v1",
        selectedWorksheetSummarySnapshot: worksheetSummarySnapshot,
        selectedOperatorWorksheetVersion: "operator-listing-v1",
        selectedOperatorWorksheetSummarySnapshot: operatorWorksheetSnapshot,
        selectedWorksheetErgonomicsSummary: worksheetErgonomicsSummary,
        selectedQuickCopySummarySnapshot: quickCopySummarySnapshot,
        selectedFinalReviewPromptSnapshot: finalReviewPromptSnapshot,
        selectedRunbookVersion: runbookVersion,
        selectedRunbookSummarySnapshot: finalRunbookSnapshot
      })
    });
  }

  const refreshed = await getListingPrepPackageRecord({
    organizationId: input.organizationId,
    listingPrepPackageId: record.id
  });
  return { ok: true, listingPrepPackage: mapListingPrepPackage(refreshed) };
}

export async function getManualListingWorksheet(input: {
  organizationId: string;
  listingPrepPackageId: string;
}) {
  const record = await getListingPrepPackageRecord(input);
  if (!record) {
    throw new Error("Listing prep package not found.");
  }
  return {
    ok: true,
    manualListingWorksheet: record.manualListingWorksheetSnapshot ?? null,
    worksheetVersion: record.worksheetVersion ?? null,
    worksheetSummary: record.worksheetSummarySnapshot ?? null,
    approvalState: record.approvalState ?? "DRAFT",
    currentApprovedArtifact: Boolean(record.currentApprovedArtifact)
  };
}

export async function getOperatorWorksheet(input: {
  organizationId: string;
  listingPrepPackageId: string;
}) {
  const record = await getListingPrepPackageRecord(input);
  if (!record) {
    throw new Error("Listing prep package not found.");
  }
  return {
    ok: true,
    operatorWorksheet: record.operatorWorksheetSnapshot ?? null,
    operatorChecklist: record.operatorChecklistSnapshot ?? null,
    channelHandoffSummary: record.channelHandoffSummarySnapshot ?? null,
    currentApprovedArtifactSummary: record.currentApprovedArtifactSummary ?? null,
    operatorPromptSummary: record.operatorPromptSnapshot ?? null,
    quickCopySummary: record.quickCopySummarySnapshot ?? null,
    finalReviewPrompts: record.finalReviewPromptSnapshot ?? null,
    artifactHandoffSummary: record.artifactHandoffSummarySnapshot ?? null,
    completionCue: record.completionCueSnapshot ?? null,
    finalRunbook: record.finalRunbookSnapshot ?? null,
    internalShareSummary: record.internalShareSummarySnapshot ?? null,
    shortShareText: record.shortShareTextSnapshot ?? null,
    lastChangeSummary: record.lastChangeSummarySnapshot ?? null,
    shortPlainTextSummary: record.shortPlainTextSummarySnapshot ?? null,
    worksheetErgonomicsSummary: record.worksheetErgonomicsSummary ?? null,
    operatorWorksheetVersion: record.operatorWorksheetVersion ?? null,
    quickCopyVersion: record.quickCopyVersion ?? null,
    runbookVersion: record.runbookVersion ?? null,
    approvalState: record.approvalState ?? "DRAFT",
    currentApprovedArtifact: Boolean(record.currentApprovedArtifact)
  };
}

export async function getWorksheetExport(input: {
  organizationId: string;
  listingPrepPackageId: string;
}) {
  const record = await getListingPrepPackageRecord(input);
  if (!record) {
    throw new Error("Listing prep package not found.");
  }
  return {
    ok: true,
    worksheetExport: record.structuredWorksheetExportSnapshot ?? null,
    copyExportSummary: record.copyExportSnapshot ?? null,
    quickCopySummary: record.quickCopySummarySnapshot ?? null,
    artifactHandoffSummary: record.artifactHandoffSummarySnapshot ?? null,
    completionCue: record.completionCueSnapshot ?? null,
    internalShareSummary: record.internalShareSummarySnapshot ?? null,
    finalRunbook: record.finalRunbookSnapshot ?? null,
    shortPlainTextSummary: record.shortPlainTextSummarySnapshot ?? null,
    worksheetErgonomicsSummary: record.worksheetErgonomicsSummary ?? null,
    quickCopyVersion: record.quickCopyVersion ?? null,
    runbookVersion: record.runbookVersion ?? null,
    approvalState: record.approvalState ?? "DRAFT",
    currentApprovedArtifact: Boolean(record.currentApprovedArtifact)
  };
}

export async function getQuickCopySummary(input: {
  organizationId: string;
  listingPrepPackageId: string;
}) {
  const record = await getListingPrepPackageRecord(input);
  if (!record) {
    throw new Error("Listing prep package not found.");
  }
  return {
    ok: true,
    quickCopySummary: record.quickCopySummarySnapshot ?? null,
    shortPlainTextSummary: record.shortPlainTextSummarySnapshot ?? null,
    artifactHandoffSummary: record.artifactHandoffSummarySnapshot ?? null,
    shortShareText: record.shortShareTextSnapshot ?? null,
    quickCopyVersion: record.quickCopyVersion ?? null,
    approvalState: record.approvalState ?? "DRAFT",
    currentApprovedArtifact: Boolean(record.currentApprovedArtifact)
  };
}

export async function getFinalReviewPrompts(input: {
  organizationId: string;
  listingPrepPackageId: string;
}) {
  const record = await getListingPrepPackageRecord(input);
  if (!record) {
    throw new Error("Listing prep package not found.");
  }
  return {
    ok: true,
    finalReviewPrompts: record.finalReviewPromptSnapshot ?? null,
    artifactHandoffSummary: record.artifactHandoffSummarySnapshot ?? null,
    completionCue: record.completionCueSnapshot ?? null,
    approvalState: record.approvalState ?? "DRAFT",
    currentApprovedArtifact: Boolean(record.currentApprovedArtifact)
  };
}

export async function getPlainTextWorksheet(input: {
  organizationId: string;
  listingPrepPackageId: string;
}) {
  const record = await getListingPrepPackageRecord(input);
  if (!record) {
    throw new Error("Listing prep package not found.");
  }
  return {
    ok: true,
    plainTextWorksheet: record.plainTextWorksheetSnapshot ?? null,
    operatorPromptSummary: record.operatorPromptSnapshot ?? null,
    finalReviewPrompts: record.finalReviewPromptSnapshot ?? null,
    shortPlainTextSummary: record.shortPlainTextSummarySnapshot ?? null,
    artifactHandoffSummary: record.artifactHandoffSummarySnapshot ?? null,
    internalShareSummary: record.internalShareSummarySnapshot ?? null,
    completionCue: record.completionCueSnapshot ?? null,
    worksheetErgonomicsSummary: record.worksheetErgonomicsSummary ?? null,
    quickCopyVersion: record.quickCopyVersion ?? null,
    runbookVersion: record.runbookVersion ?? null,
    approvalState: record.approvalState ?? "DRAFT",
    currentApprovedArtifact: Boolean(record.currentApprovedArtifact)
  };
}

export async function getFinalRunbook(input: {
  organizationId: string;
  listingPrepPackageId: string;
}) {
  const record = await getListingPrepPackageRecord(input);
  if (!record) {
    throw new Error("Listing prep package not found.");
  }
  return {
    ok: true,
    finalRunbook: record.finalRunbookSnapshot ?? null,
    completionCue: record.completionCueSnapshot ?? null,
    internalShareSummary: record.internalShareSummarySnapshot ?? null,
    lastChangeSummary: record.lastChangeSummarySnapshot ?? null,
    runbookVersion: record.runbookVersion ?? null,
    approvalState: record.approvalState ?? "DRAFT",
    currentApprovedArtifact: Boolean(record.currentApprovedArtifact)
  };
}

export async function getInternalShareSummary(input: {
  organizationId: string;
  listingPrepPackageId: string;
}) {
  const record = await getListingPrepPackageRecord(input);
  if (!record) {
    throw new Error("Listing prep package not found.");
  }
  return {
    ok: true,
    internalShareSummary: record.internalShareSummarySnapshot ?? null,
    shortShareText: record.shortShareTextSnapshot ?? null,
    artifactHandoffSummary: record.artifactHandoffSummarySnapshot ?? null,
    lastChangeSummary: record.lastChangeSummarySnapshot ?? null,
    runbookVersion: record.runbookVersion ?? null,
    approvalState: record.approvalState ?? "DRAFT",
    currentApprovedArtifact: Boolean(record.currentApprovedArtifact)
  };
}

export async function getListingPrepManualAmazonExport(input: {
  organizationId: string;
  listingPrepPackageId: string;
}) {
  const record = await getListingPrepPackageRecord(input);
  if (!record) {
    throw new Error("Listing prep package not found.");
  }
  return {
    ok: true,
    manualAmazonExport: record.manualAmazonExportSnapshot ?? null,
    approvalState: record.approvalState ?? "DRAFT",
    currentApprovedArtifact: Boolean(record.currentApprovedArtifact)
  };
}
