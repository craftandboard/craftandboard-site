"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  calculateShelfCost,
  compareShelfCostScenarios,
  createAmazonFeePreset,
  createCostProfile,
  createEdgeBandCostRule,
  createLaunchGuardrailProfile,
  createLaunchTemplate,
  createMaterialCostRule,
  createPackagingCostRule,
  createShippingCostRule,
  createShippingZoneRule,
  getCostComparisonSet,
  getCostComparisonSets,
  getCostProfile,
  getCostProfiles,
  getLaunchGuardrailProfiles,
  getShelfCostCalculations,
  selectCostLaunchScenario,
  saveCostComparisonSet,
  saveShelfCostCalculation,
  updateAmazonFeePreset,
  updateCostProfile,
  updateLaunchGuardrailProfile,
  updateLaunchTemplate,
  updatePackagingCostRule,
  updateShippingCostRule,
  updateShippingZoneRule,
  type LaunchGuardrailProfileItem,
  type LaunchTemplateItem,
  type ComparisonSetListItem,
  type CostCalculationInput,
  type CostCalculationPreview,
  type CostCalculationResult,
  type CostComparisonResult,
  type CostProfileDetail,
  type CostProfileSummaryItem,
  type CostScenarioInput,
  type ShelfCostCalculationRecord
} from "../lib/api";
import { CostAssumptionsPanel } from "./cost-assumptions-panel";
import { AmazonFeePresetEditor } from "./amazon-fee-preset-editor";
import { CostBreakdownCard } from "./cost-breakdown-card";
import { CostHistoryList } from "./cost-history-list";
import { LaunchCandidateHandoffCard } from "./launch-candidate-handoff-card";
import { LaunchGuardrailProfileEditor } from "./launch-guardrail-profile-editor";
import { LaunchRecommendationCard } from "./launch-recommendation-card";
import { LaunchRiskSummaryCard } from "./launch-risk-summary-card";
import { LaunchTemplateEditor } from "./launch-template-editor";
import { CostPricingRecommendationCard } from "./cost-pricing-recommendation-card";
import { CostProfileEditor } from "./cost-profile-editor";
import { CostScenarioBuilder } from "./cost-scenario-builder";
import { CostScenarioComparisonCard } from "./cost-scenario-comparison-card";
import { ScenarioRankingTable } from "./scenario-ranking-table";
import { ShippingZoneRuleEditor } from "./shipping-zone-rule-editor";
import { getEdgeBandPatternLabel } from "../lib/cost-engine";

const edgeBandOptions = ["NONE", "LONG_EDGES", "SHORT_EDGES", "ALL_FOUR"] as const;

function toOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function createDefaultScenario(index: number): CostScenarioInput {
  return {
    name: index === 0 ? "Baseline" : `Scenario ${index + 1}`,
    launchStrategy: "BALANCED",
    amazonFeePresetId: null,
    shippingZoneRuleId: null,
    packagingCode: null,
    shippingCode: null,
    targetMarginPct: null,
    growthMarginPct: null,
    marketplaceFeePct: null,
    returnReservePct: null,
    damageReservePct: null,
    shippingBufferPct: null,
    shippingBufferCents: null
  };
}

export function CostCalculatorForm() {
  const [profiles, setProfiles] = useState<CostProfileSummaryItem[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<CostProfileDetail | null>(null);
  const [guardrailProfiles, setGuardrailProfiles] = useState<LaunchGuardrailProfileItem[]>([]);
  const [calculations, setCalculations] = useState<ShelfCostCalculationRecord[]>([]);
  const [comparisonSets, setComparisonSets] = useState<ComparisonSetListItem[]>([]);
  const [activeComparisonSetId, setActiveComparisonSetId] = useState<string | null>(null);
  const [preview, setPreview] = useState<CostCalculationPreview | null>(null);
  const [result, setResult] = useState<CostCalculationResult | null>(null);
  const [comparison, setComparison] = useState<CostComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    quantity: "1",
    lengthIn: "30",
    depthIn: "12",
    thicknessIn: "0.75",
    weightLb: "",
    materialCode: "",
    edgeBandCode: "",
    edgeBandPattern: "LONG_EDGES",
    packagingCode: "",
    shippingCode: "",
    amazonFeePresetId: "",
    shippingZoneRuleId: "",
    laborMinutes: "12",
    machineMinutes: "8",
    overheadMinutes: "10",
    packingMinutes: "",
    targetMarginPct: "",
    growthMarginPct: "",
    marketplaceFeePct: "",
    returnReservePct: "",
    damageReservePct: "",
    shippingBufferPct: "",
    shippingBufferCents: "",
    guardrailProfileId: "",
    comparisonName: "Launch pricing comparison",
    comparisonNotes: ""
  });
  const [scenarios, setScenarios] = useState<CostScenarioInput[]>([
    createDefaultScenario(0),
    createDefaultScenario(1)
  ]);

  const refreshAll = useCallback(
    async (preferredProfileId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const [profilesPayload, calculationsPayload, comparisonSetsPayload, guardrailsPayload] = await Promise.all([
          getCostProfiles(),
          getShelfCostCalculations(),
          getCostComparisonSets(),
          getLaunchGuardrailProfiles()
        ]);
        const nextProfiles = profilesPayload?.profiles ?? [];
        setProfiles(nextProfiles);
        setCalculations(calculationsPayload?.calculations ?? []);
        setComparisonSets(comparisonSetsPayload?.comparisonSets ?? []);
        setGuardrailProfiles(guardrailsPayload?.launchGuardrailProfiles ?? []);
        const nextProfileId =
          preferredProfileId ??
          selectedProfileId ??
          nextProfiles.find((profile) => profile.status === "ACTIVE")?.id ??
          nextProfiles[0]?.id ??
          "";
        setSelectedProfileId(nextProfileId);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to load cost engine.");
      } finally {
        setLoading(false);
      }
    },
    [selectedProfileId]
  );

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!selectedProfileId) {
      setSelectedProfile(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const payload = await getCostProfile(selectedProfileId);
        if (cancelled || !payload?.profile) return;
        setSelectedProfile(payload.profile);
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Failed to load cost profile.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedProfileId]);

  useEffect(() => {
    if (!selectedProfile) return;
    setForm((current) => ({
      ...current,
      materialCode: current.materialCode || selectedProfile.materialRules[0]?.materialCode || "",
      edgeBandCode: current.edgeBandCode || selectedProfile.edgeBandRules[0]?.edgeBandCode || "",
      packagingCode: current.packagingCode || selectedProfile.packagingRules[0]?.packagingCode || "",
      shippingCode: current.shippingCode || selectedProfile.shippingRules[0]?.shippingCode || "",
      amazonFeePresetId:
        current.amazonFeePresetId || selectedProfile.amazonFeePresets[0]?.id || "",
      shippingZoneRuleId:
        current.shippingZoneRuleId || selectedProfile.shippingZoneRules[0]?.id || "",
      targetMarginPct:
        current.targetMarginPct ||
        (selectedProfile.targetMarginPct !== null ? String(selectedProfile.targetMarginPct) : ""),
      growthMarginPct:
        current.growthMarginPct ||
        (selectedProfile.growthMarginPct !== null ? String(selectedProfile.growthMarginPct) : ""),
      packingMinutes:
        current.packingMinutes ||
        (selectedProfile.defaultPackingMinutes !== null ? String(selectedProfile.defaultPackingMinutes) : ""),
      marketplaceFeePct:
        current.marketplaceFeePct ||
        (selectedProfile.defaultMarketplaceFeePct !== null
          ? String(selectedProfile.defaultMarketplaceFeePct)
          : ""),
      returnReservePct:
        current.returnReservePct ||
        (selectedProfile.defaultReturnReservePct !== null
          ? String(selectedProfile.defaultReturnReservePct)
          : ""),
      damageReservePct:
        current.damageReservePct ||
        (selectedProfile.defaultDamageReservePct !== null
          ? String(selectedProfile.defaultDamageReservePct)
          : ""),
      shippingBufferPct:
        current.shippingBufferPct ||
        (selectedProfile.defaultShippingBufferPct !== null
          ? String(selectedProfile.defaultShippingBufferPct)
          : ""),
      shippingBufferCents:
        current.shippingBufferCents ||
        (selectedProfile.defaultShippingBufferCents !== null
          ? String(selectedProfile.defaultShippingBufferCents)
          : ""),
      guardrailProfileId:
        current.guardrailProfileId || selectedProfile.launchGuardrailProfiles[0]?.id || ""
    }));
  }, [selectedProfile]);

  const options = useMemo(
    () => ({
      materials: selectedProfile?.materialRules ?? [],
      edgeBands: selectedProfile?.edgeBandRules ?? [],
      packaging: selectedProfile?.packagingRules ?? [],
      shipping: selectedProfile?.shippingRules ?? [],
      feePresets: selectedProfile?.amazonFeePresets ?? [],
      shippingZones: selectedProfile?.shippingZoneRules ?? [],
      launchTemplates: selectedProfile?.launchTemplates ?? [],
      launchGuardrailProfiles: selectedProfile?.launchGuardrailProfiles ?? guardrailProfiles
    }),
    [guardrailProfiles, selectedProfile]
  );

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function buildPayload(): CostCalculationInput {
    if (!selectedProfileId) throw new Error("Choose a cost profile first.");
    return {
      costProfileId: selectedProfileId,
      name: form.name || null,
      sku: form.sku || null,
      quantity: Number(form.quantity),
      lengthIn: Number(form.lengthIn),
      depthIn: Number(form.depthIn),
      thicknessIn: form.thicknessIn ? Number(form.thicknessIn) : null,
      weightLb: form.weightLb ? Number(form.weightLb) : null,
      materialCode: form.materialCode,
      edgeBandCode: form.edgeBandPattern === "NONE" ? null : form.edgeBandCode || null,
      edgeBandPattern: form.edgeBandPattern as (typeof edgeBandOptions)[number],
      packagingCode: form.packagingCode || null,
      shippingCode: form.shippingCode || null,
      amazonFeePresetId: form.amazonFeePresetId || null,
      shippingZoneRuleId: form.shippingZoneRuleId || null,
      laborMinutes: Number(form.laborMinutes),
      machineMinutes: Number(form.machineMinutes),
      overheadMinutes: form.overheadMinutes ? Number(form.overheadMinutes) : null,
      packingMinutes: form.packingMinutes ? Number(form.packingMinutes) : null,
      targetMarginPct: form.targetMarginPct ? Number(form.targetMarginPct) : null,
      growthMarginPct: form.growthMarginPct ? Number(form.growthMarginPct) : null,
      marketplaceFeePct: form.marketplaceFeePct ? Number(form.marketplaceFeePct) : null,
      returnReservePct: form.returnReservePct ? Number(form.returnReservePct) : null,
      damageReservePct: form.damageReservePct ? Number(form.damageReservePct) : null,
      shippingBufferPct: form.shippingBufferPct ? Number(form.shippingBufferPct) : null,
      shippingBufferCents: form.shippingBufferCents ? Number(form.shippingBufferCents) : null
    };
  }

  function hydrateFromCalculation(calculation: ShelfCostCalculationRecord) {
    setPreview({
      name: calculation.name,
      sku: calculation.sku,
      quantity: calculation.quantity,
      lengthIn: calculation.lengthIn,
      depthIn: calculation.depthIn,
      thicknessIn: calculation.thicknessIn,
      materialCode: calculation.materialCode,
      edgeBandCode: calculation.edgeBandCode,
      edgeBandPattern: calculation.edgeBandPattern,
      packagingCode: calculation.packagingCode,
      shippingCode: calculation.shippingCode,
      amazonFeePresetId: calculation.amazonFeePresetId,
      shippingZoneRuleId: calculation.shippingZoneRuleId,
      laborMinutes: calculation.laborMinutes,
      machineMinutes: calculation.machineMinutes,
      overheadMinutes: calculation.overheadMinutes,
      packingMinutes: calculation.packingMinutes,
      materialCostCents: calculation.materialCostCents,
      edgeBandCostCents: calculation.edgeBandCostCents,
      laborCostCents: calculation.laborCostCents,
      machineCostCents: calculation.machineCostCents,
      packagingCostCents: calculation.packagingCostCents,
      packingLaborCostCents: calculation.packingLaborCostCents,
      shippingCostCents: calculation.shippingCostCents,
      shippingBufferCostCents: calculation.shippingBufferCostCents,
      overheadCostCents: calculation.overheadCostCents,
      marketplaceFeeCostCents: calculation.marketplaceFeeCostCents,
      referralFeeCostCents: calculation.referralFeeCostCents,
      closingFeeCostCents: calculation.closingFeeCostCents,
      fulfillmentFeeCostCents: calculation.fulfillmentFeeCostCents,
      storageAllowanceCostCents: calculation.storageAllowanceCostCents,
      advertisingAllowanceCostCents: calculation.advertisingAllowanceCostCents,
      returnReserveCostCents: calculation.returnReserveCostCents,
      damageReserveCostCents: calculation.damageReserveCostCents,
      miscMarketplaceCostCents: calculation.miscMarketplaceCostCents,
      subtotalCostCents: calculation.subtotalCostCents,
      breakEvenPriceCents: calculation.breakEvenPriceCents,
      recommendedMinSellPriceCents: calculation.recommendedMinSellPriceCents,
      recommendedTargetSellPriceCents: calculation.recommendedTargetSellPriceCents,
      recommendedInternalPriceCents: calculation.recommendedInternalPriceCents ?? 0,
      recommendedSellPriceCents: calculation.recommendedSellPriceCents ?? 0
    });
    setResult((calculation.resultSnapshot as unknown as CostCalculationResult) ?? null);
    setForm((current) => ({
      ...current,
      name: calculation.name ?? "",
      sku: calculation.sku ?? "",
      quantity: String(calculation.quantity),
      lengthIn: String(calculation.lengthIn),
      depthIn: String(calculation.depthIn),
      thicknessIn: calculation.thicknessIn !== null ? String(calculation.thicknessIn) : "",
      materialCode: calculation.materialCode,
      edgeBandCode: calculation.edgeBandCode ?? "",
      edgeBandPattern: calculation.edgeBandPattern,
      packagingCode: calculation.packagingCode ?? "",
      shippingCode: calculation.shippingCode ?? "",
      amazonFeePresetId: calculation.amazonFeePresetId ?? "",
      shippingZoneRuleId: calculation.shippingZoneRuleId ?? "",
      laborMinutes: String(calculation.laborMinutes),
      machineMinutes: String(calculation.machineMinutes),
      overheadMinutes: calculation.overheadMinutes !== null ? String(calculation.overheadMinutes) : "",
      packingMinutes: calculation.packingMinutes !== null ? String(calculation.packingMinutes) : "",
      targetMarginPct: calculation.targetMarginPct !== null ? String(calculation.targetMarginPct) : "",
      growthMarginPct: calculation.growthMarginPct !== null ? String(calculation.growthMarginPct) : "",
      marketplaceFeePct:
        typeof calculation.pricingSnapshot?.["marketplaceFeePct"] === "number"
          ? String(calculation.pricingSnapshot["marketplaceFeePct"])
          : "",
      returnReservePct:
        typeof calculation.pricingSnapshot?.["returnReservePct"] === "number"
          ? String(calculation.pricingSnapshot["returnReservePct"])
          : "",
      damageReservePct:
        typeof calculation.pricingSnapshot?.["damageReservePct"] === "number"
          ? String(calculation.pricingSnapshot["damageReservePct"])
          : "",
      shippingBufferPct:
        typeof calculation.shippingSnapshot?.["shippingBufferPct"] === "number"
          ? String(calculation.shippingSnapshot["shippingBufferPct"])
          : "",
      shippingBufferCents:
        typeof calculation.shippingSnapshot?.["shippingBufferCents"] === "number"
          ? String(calculation.shippingSnapshot["shippingBufferCents"])
          : ""
    }));
  }

  function handleCalculate() {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          const payload = await calculateShelfCost(buildPayload());
          setPreview(payload?.calculation ?? null);
          setResult(payload?.result ?? null);
          setSuccess("Shelf cost recalculated.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to calculate shelf cost.");
        }
      })();
    });
  }

  function handleSave() {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          const payload = await saveShelfCostCalculation(buildPayload());
          await refreshAll(selectedProfileId);
          if (payload?.calculation) hydrateFromCalculation(payload.calculation);
          setSuccess("Shelf cost calculation saved.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to save shelf cost calculation.");
        }
      })();
    });
  }

  function handleCompare() {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          const payload = await compareShelfCostScenarios({
            name: form.comparisonName || null,
            notes: form.comparisonNotes || null,
            baseSpec: buildPayload(),
            guardrailProfileId: form.guardrailProfileId || null,
            scenarios
          });
          setComparison(payload.comparison);
          setSuccess("Scenario comparison updated.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to compare scenarios.");
        }
      })();
    });
  }

  function handleSaveComparisonSet() {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          const payload = await saveCostComparisonSet({
            name: form.comparisonName || "Shelf comparison",
            notes: form.comparisonNotes || null,
            baseSpec: buildPayload(),
            guardrailProfileId: form.guardrailProfileId || null,
            selectedScenarioId: comparison?.selectedLaunchScenarioId ?? null,
            scenarios
          });
          setActiveComparisonSetId(payload.comparisonSet.id);
          await refreshAll(selectedProfileId);
          setSuccess("Scenario comparison saved.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to save comparison set.");
        }
      })();
    });
  }

  function loadComparisonSet(comparisonSetId: string) {
    startTransition(() => {
      void (async () => {
        try {
          const payload = await getCostComparisonSet(comparisonSetId);
          if (!payload?.comparisonSet) {
            throw new Error("Comparison set not found.");
          }
          const comparisonSet = payload.comparisonSet;
          setActiveComparisonSetId(comparisonSet.id);
          const baseSpec = comparisonSet.baseShelfSpecSnapshot as unknown as CostCalculationInput;
          setForm((current) => ({
            ...current,
            comparisonName: comparisonSet.name,
            comparisonNotes: comparisonSet.notes ?? "",
            name: (baseSpec.name as string) ?? "",
            sku: (baseSpec.sku as string) ?? "",
            quantity: String(baseSpec.quantity),
            lengthIn: String(baseSpec.lengthIn),
            depthIn: String(baseSpec.depthIn),
            thicknessIn: baseSpec.thicknessIn ? String(baseSpec.thicknessIn) : "",
            weightLb: baseSpec.weightLb ? String(baseSpec.weightLb) : "",
            materialCode: baseSpec.materialCode,
            edgeBandCode: baseSpec.edgeBandCode ?? "",
            edgeBandPattern: baseSpec.edgeBandPattern,
            packagingCode: baseSpec.packagingCode ?? "",
            shippingCode: baseSpec.shippingCode ?? "",
            amazonFeePresetId: baseSpec.amazonFeePresetId ?? "",
            shippingZoneRuleId: baseSpec.shippingZoneRuleId ?? "",
            laborMinutes: String(baseSpec.laborMinutes),
            machineMinutes: String(baseSpec.machineMinutes),
            overheadMinutes: baseSpec.overheadMinutes ? String(baseSpec.overheadMinutes) : "",
            packingMinutes: baseSpec.packingMinutes ? String(baseSpec.packingMinutes) : "",
            targetMarginPct: baseSpec.targetMarginPct ? String(baseSpec.targetMarginPct) : "",
            growthMarginPct: baseSpec.growthMarginPct ? String(baseSpec.growthMarginPct) : "",
            marketplaceFeePct: baseSpec.marketplaceFeePct ? String(baseSpec.marketplaceFeePct) : "",
            returnReservePct: baseSpec.returnReservePct ? String(baseSpec.returnReservePct) : "",
            damageReservePct: baseSpec.damageReservePct ? String(baseSpec.damageReservePct) : "",
            shippingBufferPct: baseSpec.shippingBufferPct ? String(baseSpec.shippingBufferPct) : "",
            shippingBufferCents: baseSpec.shippingBufferCents ? String(baseSpec.shippingBufferCents) : "",
            guardrailProfileId: comparisonSet.scenarios[0]?.scenario.guardrailProfileId ?? ""
          }));
          setScenarios(
            comparisonSet.scenarios.map((entry) => {
              const assumptions = entry.scenario.assumptionsSnapshot as Record<string, unknown>;
              return {
                name: entry.scenario.name,
                launchStrategy: entry.scenario.launchStrategy ?? "BALANCED",
                amazonFeePresetId: (assumptions["amazonFeePreset"] as Record<string, unknown> | undefined)?.["id"] as
                  | string
                  | null
                  | undefined,
                shippingZoneRuleId: (assumptions["shippingZoneRule"] as Record<string, unknown> | undefined)?.["id"] as
                  | string
                  | null
                  | undefined,
                packagingCode: (assumptions["packagingRule"] as Record<string, unknown> | undefined)?.["packagingCode"] as
                  | string
                  | null
                  | undefined,
                shippingCode: (assumptions["shippingRule"] as Record<string, unknown> | undefined)?.["shippingCode"] as
                  | string
                  | null
                  | undefined,
                targetMarginPct: null,
                growthMarginPct: null,
                marketplaceFeePct: null,
                returnReservePct: null,
                damageReservePct: null,
                shippingBufferPct: null,
                shippingBufferCents: null
              };
            })
          );
          setComparison({
            name: comparisonSet.name,
            notes: comparisonSet.notes,
            baseSpec,
            baselineScenarioId: comparisonSet.scenarios[0]?.scenario.id ?? "scenario-1",
            ranking: (comparisonSet.rankingSnapshot as CostComparisonResult["ranking"]) ?? undefined,
            selectedLaunchScenarioId: comparisonSet.selectedLaunchScenarioId ?? null,
            selectedLaunchSummary: comparisonSet.selectedLaunchSummary ?? null,
            riskSummary: comparisonSet.riskSummary ?? null,
            scenarios: comparisonSet.scenarios.map((entry, index) => ({
              id: entry.scenario.id,
              name: entry.scenario.name,
              launchStrategy: entry.scenario.launchStrategy,
              calculation: entry.scenario.resultSnapshot as unknown as CostCalculationPreview,
              assumptionsSnapshot: entry.scenario.assumptionsSnapshot,
              result: entry.scenario.resultSnapshot as unknown as CostCalculationResult,
              changedAssumptions: {
                packagingCode: ((entry.scenario.assumptionsSnapshot.packagingRule as Record<string, unknown> | undefined)?.[
                  "packagingCode"
                ] as string | null | undefined) ?? null,
                shippingCode: ((entry.scenario.assumptionsSnapshot.shippingRule as Record<string, unknown> | undefined)?.[
                  "shippingCode"
                ] as string | null | undefined) ?? null,
                amazonFeePresetId: ((entry.scenario.assumptionsSnapshot.amazonFeePreset as Record<string, unknown> | undefined)?.[
                  "id"
                ] as string | null | undefined) ?? null,
                shippingZoneRuleId: ((entry.scenario.assumptionsSnapshot.shippingZoneRule as Record<string, unknown> | undefined)?.[
                  "id"
                ] as string | null | undefined) ?? null,
                targetMarginPct: null,
                growthMarginPct: null,
                launchStrategy: entry.scenario.launchStrategy ?? null
              },
              rankingScore: entry.scenario.rankingScore,
              rankingSummary: entry.scenario.rankingSummary,
              guardrailProfileId: entry.scenario.guardrailProfileId,
              guardrailProfileName: entry.scenario.guardrailProfileName,
              riskScore: entry.scenario.riskScore,
              riskLevel: entry.scenario.riskLevel,
              guardrailSnapshot: entry.scenario.guardrailSnapshot,
              warningSnapshot: entry.scenario.warningSnapshot,
              handoffSnapshot: entry.scenario.handoffSnapshot,
              isRecommendedLaunchScenario: entry.scenario.isRecommendedLaunchScenario,
              isLaunchApprovedCandidate: entry.scenario.isLaunchApprovedCandidate,
              riskSummary:
                typeof (entry.scenario.guardrailSnapshot as Record<string, unknown> | null)?.["summary"] === "string"
                  ? String((entry.scenario.guardrailSnapshot as Record<string, unknown>)["summary"])
                  : null,
              deltas:
                index === 0
                  ? {
                      subtotalCostCents: 0,
                      breakEvenPriceCents: 0,
                      recommendedMinSellPriceCents: 0,
                      recommendedTargetSellPriceCents: 0
                    }
                  : {
                      subtotalCostCents: 0,
                      breakEvenPriceCents: 0,
                      recommendedMinSellPriceCents: 0,
                      recommendedTargetSellPriceCents: 0
                    }
            }))
          });
          setSuccess("Comparison set loaded.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to load comparison set.");
        }
      })();
    });
  }

  function handleCreateProfile(formData: FormData) {
    startTransition(() => {
      void (async () => {
        try {
          const payload = await createCostProfile({
            name: String(formData.get("name") ?? ""),
            targetMarginPct: toOptionalNumber(formData.get("targetMarginPct")) ?? null,
            growthMarginPct: toOptionalNumber(formData.get("growthMarginPct")) ?? null,
            defaultLaborRateCentsPerHour: toOptionalNumber(formData.get("defaultLaborRateCentsPerHour")),
            defaultMachineRateCentsPerHour: toOptionalNumber(formData.get("defaultMachineRateCentsPerHour")),
            defaultOverheadRateCentsPerHour: toOptionalNumber(formData.get("defaultOverheadRateCentsPerHour")) ?? null,
            defaultPackingLaborRateCentsPerHour:
              toOptionalNumber(formData.get("defaultPackingLaborRateCentsPerHour")) ?? null,
            defaultPackingMinutes: toOptionalNumber(formData.get("defaultPackingMinutes")) ?? null,
            defaultMarketplaceFeePct: toOptionalNumber(formData.get("defaultMarketplaceFeePct")) ?? null,
            defaultReturnReservePct: toOptionalNumber(formData.get("defaultReturnReservePct")) ?? null,
            defaultDamageReservePct: toOptionalNumber(formData.get("defaultDamageReservePct")) ?? null,
            defaultShippingBufferPct: toOptionalNumber(formData.get("defaultShippingBufferPct")) ?? null,
            defaultShippingBufferCents: toOptionalNumber(formData.get("defaultShippingBufferCents")) ?? null,
            defaultPackagingOverheadCents: toOptionalNumber(formData.get("defaultPackagingOverheadCents")) ?? null,
            defaultRecommendedMinMarginPct:
              toOptionalNumber(formData.get("defaultRecommendedMinMarginPct")) ?? null,
            defaultRecommendedTargetMarginPct:
              toOptionalNumber(formData.get("defaultRecommendedTargetMarginPct")) ?? null
          });
          await refreshAll(payload?.profile?.id);
          setSuccess("Cost profile created.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to create cost profile.");
        }
      })();
    });
  }

  function handleUpdateProfile(formData: FormData) {
    if (!selectedProfileId) return;
    startTransition(() => {
      void (async () => {
        try {
          await updateCostProfile(selectedProfileId, {
            targetMarginPct: toOptionalNumber(formData.get("targetMarginPct")) ?? null,
            growthMarginPct: toOptionalNumber(formData.get("growthMarginPct")) ?? null,
            defaultRecommendedMinMarginPct:
              toOptionalNumber(formData.get("defaultRecommendedMinMarginPct")) ?? null,
            defaultRecommendedTargetMarginPct:
              toOptionalNumber(formData.get("defaultRecommendedTargetMarginPct")) ?? null,
            defaultPackingLaborRateCentsPerHour:
              toOptionalNumber(formData.get("defaultPackingLaborRateCentsPerHour")) ?? null,
            defaultPackingMinutes: toOptionalNumber(formData.get("defaultPackingMinutes")) ?? null,
            defaultMarketplaceFeePct: toOptionalNumber(formData.get("defaultMarketplaceFeePct")) ?? null,
            defaultReturnReservePct: toOptionalNumber(formData.get("defaultReturnReservePct")) ?? null,
            defaultDamageReservePct: toOptionalNumber(formData.get("defaultDamageReservePct")) ?? null,
            defaultShippingBufferPct: toOptionalNumber(formData.get("defaultShippingBufferPct")) ?? null,
            defaultShippingBufferCents: toOptionalNumber(formData.get("defaultShippingBufferCents")) ?? null,
            defaultPackagingOverheadCents: toOptionalNumber(formData.get("defaultPackagingOverheadCents")) ?? null
          });
          await refreshAll(selectedProfileId);
          setSuccess("Cost profile defaults updated.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to update cost profile.");
        }
      })();
    });
  }

  function handleCreateMaterialRule(formData: FormData) {
    if (!selectedProfileId) return;
    startTransition(() => {
      void createMaterialCostRule(selectedProfileId, {
        materialCode: String(formData.get("materialCode") ?? ""),
        materialName: String(formData.get("materialName") ?? ""),
        sheetLengthIn: Number(formData.get("sheetLengthIn") ?? 0),
        sheetWidthIn: Number(formData.get("sheetWidthIn") ?? 0),
        sheetCostCents: Number(formData.get("sheetCostCents") ?? 0),
        wastePct: toOptionalNumber(formData.get("wastePct")) ?? null
      })
        .then(() => refreshAll(selectedProfileId))
        .then(() => setSuccess("Material rule added."))
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Failed to add material rule.")
        );
    });
  }

  function handleCreateEdgeBandRule(formData: FormData) {
    if (!selectedProfileId) return;
    startTransition(() => {
      void createEdgeBandCostRule(selectedProfileId, {
        edgeBandCode: String(formData.get("edgeBandCode") ?? ""),
        edgeBandName: String(formData.get("edgeBandName") ?? ""),
        costCentsPerLinearFoot: Number(formData.get("costCentsPerLinearFoot") ?? 0),
        setupAllowanceLinearFt: toOptionalNumber(formData.get("setupAllowanceLinearFt")) ?? null
      })
        .then(() => refreshAll(selectedProfileId))
        .then(() => setSuccess("Edge band rule added."))
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Failed to add edge band rule.")
        );
    });
  }

  function handleCreatePackagingRule(formData: FormData) {
    if (!selectedProfileId) return;
    startTransition(() => {
      void createPackagingCostRule(selectedProfileId, {
        packagingCode: String(formData.get("packagingCode") ?? ""),
        packagingName: String(formData.get("packagingName") ?? ""),
        boxCostCents: toOptionalNumber(formData.get("boxCostCents")) ?? null,
        bubbleWrapCostCents: toOptionalNumber(formData.get("bubbleWrapCostCents")) ?? null,
        tapeCostCents: toOptionalNumber(formData.get("tapeCostCents")) ?? null,
        labelCostCents: toOptionalNumber(formData.get("labelCostCents")) ?? null,
        foamCostCents: toOptionalNumber(formData.get("foamCostCents")) ?? null,
        cornerProtectorCostCents: toOptionalNumber(formData.get("cornerProtectorCostCents")) ?? null,
        packingMinutes: toOptionalNumber(formData.get("packingMinutes")) ?? null,
        packagingOverheadCents: toOptionalNumber(formData.get("packagingOverheadCents")) ?? null
      })
        .then(() => refreshAll(selectedProfileId))
        .then(() => setSuccess("Packaging rule added."))
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Failed to add packaging rule.")
        );
    });
  }

  function handleUpdatePackagingRule(ruleId: string, formData: FormData) {
    startTransition(() => {
      void updatePackagingCostRule(ruleId, {
        boxCostCents: toOptionalNumber(formData.get("boxCostCents")) ?? null,
        bubbleWrapCostCents: toOptionalNumber(formData.get("bubbleWrapCostCents")) ?? null,
        foamCostCents: toOptionalNumber(formData.get("foamCostCents")) ?? null,
        cornerProtectorCostCents: toOptionalNumber(formData.get("cornerProtectorCostCents")) ?? null,
        tapeCostCents: toOptionalNumber(formData.get("tapeCostCents")) ?? null,
        labelCostCents: toOptionalNumber(formData.get("labelCostCents")) ?? null,
        insertFlyerCostCents: toOptionalNumber(formData.get("insertFlyerCostCents")) ?? null,
        shrinkWrapCostCents: toOptionalNumber(formData.get("shrinkWrapCostCents")) ?? null,
        otherPackagingCostCents: toOptionalNumber(formData.get("otherPackagingCostCents")) ?? null,
        packingMinutes: toOptionalNumber(formData.get("packingMinutes")) ?? null,
        packingLaborOverrideCents: toOptionalNumber(formData.get("packingLaborOverrideCents")) ?? null,
        packagingOverheadCents: toOptionalNumber(formData.get("packagingOverheadCents")) ?? null
      })
        .then(() => refreshAll(selectedProfileId))
        .then(() => setSuccess("Packaging rule updated."))
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Failed to update packaging rule.")
        );
    });
  }

  function handleCreateShippingRule(formData: FormData) {
    if (!selectedProfileId) return;
    startTransition(() => {
      void createShippingCostRule(selectedProfileId, {
        shippingCode: String(formData.get("shippingCode") ?? ""),
        shippingName: String(formData.get("shippingName") ?? ""),
        baseCostCents: Number(formData.get("baseCostCents") ?? 0),
        costPerPoundCents: toOptionalNumber(formData.get("costPerPoundCents")) ?? null,
        costPerCubicInchCents: toOptionalNumber(formData.get("costPerCubicInchCents")) ?? null,
        dimensionalDivisor: toOptionalNumber(formData.get("dimensionalDivisor")) ?? null,
        dimensionalRateCents: toOptionalNumber(formData.get("dimensionalRateCents")) ?? null,
        shippingBufferPct: toOptionalNumber(formData.get("shippingBufferPct")) ?? null,
        shippingBufferCents: toOptionalNumber(formData.get("shippingBufferCents")) ?? null,
        marketplaceHandlingCents: toOptionalNumber(formData.get("marketplaceHandlingCents")) ?? null
      })
        .then(() => refreshAll(selectedProfileId))
        .then(() => setSuccess("Shipping rule added."))
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Failed to add shipping rule.")
        );
    });
  }

  function handleUpdateShippingRule(ruleId: string, formData: FormData) {
    startTransition(() => {
      void updateShippingCostRule(ruleId, {
        baseCostCents: toOptionalNumber(formData.get("baseCostCents")) ?? 0,
        costPerPoundCents: toOptionalNumber(formData.get("costPerPoundCents")) ?? null,
        costPerCubicInchCents: toOptionalNumber(formData.get("costPerCubicInchCents")) ?? null,
        dimensionalDivisor: toOptionalNumber(formData.get("dimensionalDivisor")) ?? null,
        dimensionalRateCents: toOptionalNumber(formData.get("dimensionalRateCents")) ?? null,
        shippingBufferPct: toOptionalNumber(formData.get("shippingBufferPct")) ?? null,
        shippingBufferCents: toOptionalNumber(formData.get("shippingBufferCents")) ?? null,
        marketplaceHandlingCents: toOptionalNumber(formData.get("marketplaceHandlingCents")) ?? null,
        flatOverride: toOptionalNumber(formData.get("flatOverride")) ?? null
      })
        .then(() => refreshAll(selectedProfileId))
        .then(() => setSuccess("Shipping rule updated."))
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Failed to update shipping rule.")
        );
    });
  }

  function handleCreateAmazonFeePreset(formData: FormData) {
    if (!selectedProfileId) return;
    startTransition(() => {
      void createAmazonFeePreset(selectedProfileId, {
        name: String(formData.get("name") ?? ""),
        referralFeePct: Number(formData.get("referralFeePct") ?? 0),
        closingFeeCents: toOptionalNumber(formData.get("closingFeeCents")) ?? null,
        fulfillmentFeeCents: toOptionalNumber(formData.get("fulfillmentFeeCents")) ?? null,
        storageAllowanceCents: toOptionalNumber(formData.get("storageAllowanceCents")) ?? null,
        advertisingAllowancePct: toOptionalNumber(formData.get("advertisingAllowancePct")) ?? null,
        advertisingAllowanceCents: toOptionalNumber(formData.get("advertisingAllowanceCents")) ?? null,
        returnReservePct: toOptionalNumber(formData.get("returnReservePct")) ?? null,
        damageReservePct: toOptionalNumber(formData.get("damageReservePct")) ?? null,
        miscMarketplacePct: toOptionalNumber(formData.get("miscMarketplacePct")) ?? null
      })
        .then(() => refreshAll(selectedProfileId))
        .then(() => setSuccess("Amazon fee preset added."))
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Failed to add Amazon fee preset.")
        );
    });
  }

  function handleUpdateAmazonFeePreset(presetId: string, formData: FormData) {
    startTransition(() => {
      void updateAmazonFeePreset(presetId, {
        referralFeePct: toOptionalNumber(formData.get("referralFeePct")) ?? 0,
        closingFeeCents: toOptionalNumber(formData.get("closingFeeCents")) ?? null,
        fulfillmentFeeCents: toOptionalNumber(formData.get("fulfillmentFeeCents")) ?? null,
        storageAllowanceCents: toOptionalNumber(formData.get("storageAllowanceCents")) ?? null,
        advertisingAllowancePct: toOptionalNumber(formData.get("advertisingAllowancePct")) ?? null,
        advertisingAllowanceCents: toOptionalNumber(formData.get("advertisingAllowanceCents")) ?? null,
        returnReservePct: toOptionalNumber(formData.get("returnReservePct")) ?? null,
        damageReservePct: toOptionalNumber(formData.get("damageReservePct")) ?? null,
        miscMarketplacePct: toOptionalNumber(formData.get("miscMarketplacePct")) ?? null
      })
        .then(() => refreshAll(selectedProfileId))
        .then(() => setSuccess("Amazon fee preset updated."))
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Failed to update Amazon fee preset.")
        );
    });
  }

  function handleCreateShippingZoneRule(formData: FormData) {
    if (!selectedProfileId) return;
    startTransition(() => {
      void createShippingZoneRule(selectedProfileId, {
        name: String(formData.get("name") ?? ""),
        zoneCode: String(formData.get("zoneCode") ?? ""),
        baseCostCents: Number(formData.get("baseCostCents") ?? 0),
        weightAdderCents: toOptionalNumber(formData.get("weightAdderCents")) ?? null,
        dimensionalAdderCents: toOptionalNumber(formData.get("dimensionalAdderCents")) ?? null,
        bufferPct: toOptionalNumber(formData.get("bufferPct")) ?? null,
        bufferCents: toOptionalNumber(formData.get("bufferCents")) ?? null,
        marketplaceHandlingCents: toOptionalNumber(formData.get("marketplaceHandlingCents")) ?? null
      })
        .then(() => refreshAll(selectedProfileId))
        .then(() => setSuccess("Shipping zone rule added."))
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Failed to add shipping zone rule.")
        );
    });
  }

  function handleUpdateShippingZoneRule(ruleId: string, formData: FormData) {
    startTransition(() => {
      void updateShippingZoneRule(ruleId, {
        baseCostCents: toOptionalNumber(formData.get("baseCostCents")) ?? 0,
        weightAdderCents: toOptionalNumber(formData.get("weightAdderCents")) ?? null,
        dimensionalAdderCents: toOptionalNumber(formData.get("dimensionalAdderCents")) ?? null,
        bufferPct: toOptionalNumber(formData.get("bufferPct")) ?? null,
        bufferCents: toOptionalNumber(formData.get("bufferCents")) ?? null,
        marketplaceHandlingCents: toOptionalNumber(formData.get("marketplaceHandlingCents")) ?? null
      })
        .then(() => refreshAll(selectedProfileId))
        .then(() => setSuccess("Shipping zone rule updated."))
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Failed to update shipping zone rule.")
        );
    });
  }

  function handleCreateLaunchTemplate(formData: FormData) {
    if (!selectedProfileId) return;
    startTransition(() => {
      void createLaunchTemplate(selectedProfileId, {
        name: String(formData.get("name") ?? ""),
        status: (String(formData.get("status") ?? "ACTIVE") as "ACTIVE" | "ARCHIVED"),
        defaultAmazonFeePresetId:
          (String(formData.get("defaultAmazonFeePresetId") ?? "") || null),
        defaultShippingZoneRuleId:
          (String(formData.get("defaultShippingZoneRuleId") ?? "") || null),
        defaultPackagingRuleId:
          (String(formData.get("defaultPackagingRuleId") ?? "") || null),
        defaultShippingRuleId:
          (String(formData.get("defaultShippingRuleId") ?? "") || null),
        launchStrategy: String(formData.get("launchStrategy") ?? "BALANCED") as
          | "BALANCED"
          | "AGGRESSIVE"
          | "SAFER_MARGIN",
        notes: (String(formData.get("notes") ?? "") || null)
      })
        .then(() => refreshAll(selectedProfileId))
        .then(() => setSuccess("Launch template added."))
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Failed to add launch template.")
        );
    });
  }

  function handleUpdateLaunchTemplate(templateId: string, formData: FormData) {
    startTransition(() => {
      void updateLaunchTemplate(templateId, {
        name: String(formData.get("name") ?? ""),
        status: String(formData.get("status") ?? "ACTIVE"),
        defaultAmazonFeePresetId: String(formData.get("defaultAmazonFeePresetId") ?? "") || null,
        defaultShippingZoneRuleId: String(formData.get("defaultShippingZoneRuleId") ?? "") || null,
        defaultPackagingRuleId: String(formData.get("defaultPackagingRuleId") ?? "") || null,
        defaultShippingRuleId: String(formData.get("defaultShippingRuleId") ?? "") || null,
        launchStrategy: String(formData.get("launchStrategy") ?? "BALANCED"),
        notes: String(formData.get("notes") ?? "") || null
      })
        .then(() => refreshAll(selectedProfileId))
        .then(() => setSuccess("Launch template updated."))
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Failed to update launch template.")
        );
    });
  }

  function handleCreateLaunchGuardrailProfile(formData: FormData) {
    if (!selectedProfileId) return;
    startTransition(() => {
      void createLaunchGuardrailProfile(selectedProfileId, {
        name: String(formData.get("name") ?? ""),
        status: String(formData.get("status") ?? "ACTIVE") as "ACTIVE" | "ARCHIVED",
        minimumMarginPct: Number(formData.get("minimumMarginPct") ?? 0),
        minimumBufferAboveBreakEvenPct: toOptionalNumber(formData.get("minimumBufferAboveBreakEvenPct")) ?? null,
        maximumFeeBurdenPct: toOptionalNumber(formData.get("maximumFeeBurdenPct")) ?? null,
        maximumShippingBurdenPct: toOptionalNumber(formData.get("maximumShippingBurdenPct")) ?? null,
        maximumReserveBurdenPct: toOptionalNumber(formData.get("maximumReserveBurdenPct")) ?? null,
        maximumAllowedTargetToFloorGapPct:
          toOptionalNumber(formData.get("maximumAllowedTargetToFloorGapPct")) ?? null,
        notes: String(formData.get("notes") ?? "") || null
      })
        .then(() => refreshAll(selectedProfileId))
        .then(() => setSuccess("Launch guardrail profile added."))
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Failed to add launch guardrail profile.")
        );
    });
  }

  function handleUpdateLaunchGuardrailProfile(guardrailProfileId: string, formData: FormData) {
    startTransition(() => {
      void updateLaunchGuardrailProfile(guardrailProfileId, {
        name: String(formData.get("name") ?? ""),
        status: String(formData.get("status") ?? "ACTIVE"),
        minimumMarginPct: Number(formData.get("minimumMarginPct") ?? 0),
        minimumBufferAboveBreakEvenPct: toOptionalNumber(formData.get("minimumBufferAboveBreakEvenPct")) ?? null,
        maximumFeeBurdenPct: toOptionalNumber(formData.get("maximumFeeBurdenPct")) ?? null,
        maximumShippingBurdenPct: toOptionalNumber(formData.get("maximumShippingBurdenPct")) ?? null,
        maximumReserveBurdenPct: toOptionalNumber(formData.get("maximumReserveBurdenPct")) ?? null,
        maximumAllowedTargetToFloorGapPct:
          toOptionalNumber(formData.get("maximumAllowedTargetToFloorGapPct")) ?? null,
        notes: String(formData.get("notes") ?? "") || null
      })
        .then(() => refreshAll(selectedProfileId))
        .then(() => setSuccess("Launch guardrail profile updated."))
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Failed to update launch guardrail profile.")
        );
    });
  }

  function handleApplyLaunchTemplate(index: number, templateId: string) {
    if (!templateId) return;
    const template = options.launchTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setScenarios((current) =>
      current.map((scenario, currentIndex) =>
        currentIndex === index
          ? {
              ...scenario,
              name: template.name,
              launchStrategy: template.launchStrategy,
              amazonFeePresetId: template.defaultAmazonFeePresetId,
              shippingZoneRuleId: template.defaultShippingZoneRuleId,
              packagingCode:
                selectedProfile?.packagingRules.find((rule) => rule.id === template.defaultPackagingRuleId)
                  ?.packagingCode ?? scenario.packagingCode ?? null,
              shippingCode:
                selectedProfile?.shippingRules.find((rule) => rule.id === template.defaultShippingRuleId)
                  ?.shippingCode ?? scenario.shippingCode ?? null
            }
          : scenario
      )
    );
    setSuccess(`Applied ${template.name} to scenario ${index + 1}.`);
  }

  function handleSelectLaunchScenario(scenarioId: string) {
    const comparisonSetId = activeComparisonSetId;
    if (!comparisonSetId) {
      setError("Save a comparison set before selecting a launch candidate.");
      return;
    }

    startTransition(() => {
      void selectCostLaunchScenario(comparisonSetId, {
        scenarioId,
        guardrailProfileId: form.guardrailProfileId || null
      })
        .then((payload) => loadComparisonSet(payload.comparisonSet.id))
        .then(() => setSuccess("Launch candidate selected."))
        .catch((caught) =>
          setError(caught instanceof Error ? caught.message : "Failed to select launch candidate.")
        );
    });
  }

  if (loading) {
    return <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-8 text-slate-300">Loading Hugo cost engine…</div>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Hugo Cost Engine</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Amazon-aware shelf pricing scenarios</h1>
        <p className="mt-3 max-w-4xl text-sm text-slate-300">
          Build editable cost assumptions, then compare fee presets, shipping zones, and margin strategies side by side before Hugo picks a launch price.
        </p>
      </section>

      {error ? <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{success}</div> : null}

      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="min-w-[18rem] flex-1 text-sm text-slate-300">
            Cost profile
            <select value={selectedProfileId} onChange={(event) => setSelectedProfileId(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-white">
              <option value="">Select a profile</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} · {profile.status}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-xl border border-white/10 bg-slate-950/25 px-4 py-3 text-sm text-slate-300">
            {selectedProfile
              ? `${selectedProfile.materialRules.length} materials · ${selectedProfile.packagingRules.length} packaging rules · ${selectedProfile.amazonFeePresets.length} fee presets · ${selectedProfile.shippingZoneRules.length} zones`
              : "Create a profile to start calculating."}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <label className="text-sm text-slate-300">Calculation name<input value={form.name} onChange={(event) => updateField("name", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" placeholder="36in pantry shelf" /></label>
          <label className="text-sm text-slate-300">SKU<input value={form.sku} onChange={(event) => updateField("sku", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" placeholder="HUGO-SHELF-36W" /></label>
          <label className="text-sm text-slate-300">Quantity<input value={form.quantity} onChange={(event) => updateField("quantity", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" /></label>
          <label className="text-sm text-slate-300">Length (in)<input value={form.lengthIn} onChange={(event) => updateField("lengthIn", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" /></label>
          <label className="text-sm text-slate-300">Depth (in)<input value={form.depthIn} onChange={(event) => updateField("depthIn", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" /></label>
          <label className="text-sm text-slate-300">Thickness (in)<input value={form.thicknessIn} onChange={(event) => updateField("thicknessIn", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" /></label>
          <label className="text-sm text-slate-300">Material<select value={form.materialCode} onChange={(event) => updateField("materialCode", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white"><option value="">Select material</option>{options.materials.map((rule) => <option key={rule.id} value={rule.materialCode}>{rule.materialName}</option>)}</select></label>
          <label className="text-sm text-slate-300">Edge band pattern<select value={form.edgeBandPattern} onChange={(event) => updateField("edgeBandPattern", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white">{edgeBandOptions.map((option) => <option key={option} value={option}>{getEdgeBandPatternLabel(option)}</option>)}</select></label>
          <label className="text-sm text-slate-300">Edge band rule<select value={form.edgeBandCode} onChange={(event) => updateField("edgeBandCode", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" disabled={form.edgeBandPattern === "NONE"}><option value="">{form.edgeBandPattern === "NONE" ? "Not needed" : "Select edge band"}</option>{options.edgeBands.map((rule) => <option key={rule.id} value={rule.edgeBandCode}>{rule.edgeBandName}</option>)}</select></label>
          <label className="text-sm text-slate-300">Packaging rule<select value={form.packagingCode} onChange={(event) => updateField("packagingCode", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white"><option value="">No packaging rule</option>{options.packaging.map((rule) => <option key={rule.id} value={rule.packagingCode}>{rule.packagingName}</option>)}</select></label>
          <label className="text-sm text-slate-300">Shipping rule<select value={form.shippingCode} onChange={(event) => updateField("shippingCode", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white"><option value="">No shipping rule</option>{options.shipping.map((rule) => <option key={rule.id} value={rule.shippingCode}>{rule.shippingName}</option>)}</select></label>
          <label className="text-sm text-slate-300">Amazon fee preset<select value={form.amazonFeePresetId} onChange={(event) => updateField("amazonFeePresetId", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white"><option value="">Profile/default marketplace rules</option>{options.feePresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label>
          <label className="text-sm text-slate-300">Shipping zone<select value={form.shippingZoneRuleId} onChange={(event) => updateField("shippingZoneRuleId", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white"><option value="">Base shipping only</option>{options.shippingZones.map((rule) => <option key={rule.id} value={rule.id}>{rule.name}</option>)}</select></label>
          <label className="text-sm text-slate-300">Guardrail profile<select value={form.guardrailProfileId} onChange={(event) => updateField("guardrailProfileId", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white"><option value="">No guardrails</option>{options.launchGuardrailProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
          <label className="text-sm text-slate-300">Weight (lb)<input value={form.weightLb} onChange={(event) => updateField("weightLb", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" /></label>
          <label className="text-sm text-slate-300">Labor minutes<input value={form.laborMinutes} onChange={(event) => updateField("laborMinutes", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" /></label>
          <label className="text-sm text-slate-300">Machine minutes<input value={form.machineMinutes} onChange={(event) => updateField("machineMinutes", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" /></label>
          <label className="text-sm text-slate-300">Packing minutes<input value={form.packingMinutes} onChange={(event) => updateField("packingMinutes", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" /></label>
          <label className="text-sm text-slate-300">Overhead minutes<input value={form.overheadMinutes} onChange={(event) => updateField("overheadMinutes", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" /></label>
          <label className="text-sm text-slate-300">Target margin %<input value={form.targetMarginPct} onChange={(event) => updateField("targetMarginPct", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" /></label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={handleCalculate} disabled={isPending} className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-5 py-2 text-sm font-medium text-white disabled:opacity-60">Calculate shelf cost</button>
          <button type="button" onClick={handleSave} disabled={isPending} className="rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-white disabled:opacity-60">Save calculation</button>
          <button type="button" onClick={handleCompare} disabled={isPending} className="rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-white disabled:opacity-60">Compare scenarios</button>
          <button type="button" onClick={handleSaveComparisonSet} disabled={isPending} className="rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-white disabled:opacity-60">Save comparison set</button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <CostBreakdownCard preview={preview} result={result} />
          <CostPricingRecommendationCard preview={preview} result={result} />
          <LaunchRecommendationCard comparison={comparison} />
          <LaunchRiskSummaryCard comparison={comparison} />
          <LaunchCandidateHandoffCard comparison={comparison} />
          <CostScenarioBuilder
            scenarios={scenarios}
            feePresets={options.feePresets}
            shippingZones={options.shippingZones}
            packagingRules={options.packaging}
            shippingRules={options.shipping}
            launchTemplates={options.launchTemplates}
            onChange={(index, next) =>
              setScenarios((current) => current.map((scenario, currentIndex) => (currentIndex === index ? next : scenario)))
            }
            onAdd={() => setScenarios((current) => [...current, createDefaultScenario(current.length)])}
            onRemove={(index) => setScenarios((current) => current.filter((_, currentIndex) => currentIndex !== index))}
            onApplyTemplate={handleApplyLaunchTemplate}
          />
          <ScenarioRankingTable comparison={comparison} onSelectScenario={handleSelectLaunchScenario} />
          <CostScenarioComparisonCard comparison={comparison} />
        </div>

        <div className="space-y-6">
          <CostAssumptionsPanel profile={selectedProfile} />
          <CostHistoryList calculations={calculations} onSelect={hydrateFromCalculation} />
          <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Saved Comparisons</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Scenario comparison history</h3>
            <div className="mt-4 space-y-3">
              {comparisonSets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-slate-300">
                  No saved comparison sets yet.
                </div>
              ) : (
                comparisonSets.slice(0, 8).map((set) => (
                  <button key={set.id} type="button" onClick={() => loadComparisonSet(set.id)} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/25 px-4 py-4 text-left text-sm text-slate-200 transition hover:border-emerald-300/30">
                    <div>
                      <p className="font-medium text-white">{set.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {set.scenarioCount} scenarios
                        {set.recommendedScenarioName ? ` · recommends ${set.recommendedScenarioName}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(set.updatedAt).toLocaleDateString()}</span>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>
      </section>

      <CostProfileEditor
        profile={selectedProfile}
        onCreateProfile={handleCreateProfile}
        onUpdateProfile={handleUpdateProfile}
        onCreateMaterialRule={handleCreateMaterialRule}
        onCreateEdgeBandRule={handleCreateEdgeBandRule}
        onCreatePackagingRule={handleCreatePackagingRule}
        onUpdatePackagingRule={handleUpdatePackagingRule}
        onCreateShippingRule={handleCreateShippingRule}
        onUpdateShippingRule={handleUpdateShippingRule}
        busy={isPending}
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <AmazonFeePresetEditor
          presets={selectedProfile?.amazonFeePresets ?? []}
          onCreate={handleCreateAmazonFeePreset}
          onUpdate={handleUpdateAmazonFeePreset}
          busy={isPending}
        />
        <ShippingZoneRuleEditor
          rules={selectedProfile?.shippingZoneRules ?? []}
          onCreate={handleCreateShippingZoneRule}
          onUpdate={handleUpdateShippingZoneRule}
          busy={isPending}
        />
      </section>

      <LaunchTemplateEditor
        templates={selectedProfile?.launchTemplates ?? []}
        feePresets={selectedProfile?.amazonFeePresets ?? []}
        shippingZones={selectedProfile?.shippingZoneRules ?? []}
        packagingRules={selectedProfile?.packagingRules ?? []}
        shippingRules={selectedProfile?.shippingRules ?? []}
        onCreate={handleCreateLaunchTemplate}
        onUpdate={handleUpdateLaunchTemplate}
      />

      <LaunchGuardrailProfileEditor
        profiles={selectedProfile?.launchGuardrailProfiles ?? guardrailProfiles}
        onCreate={handleCreateLaunchGuardrailProfile}
        onUpdate={handleUpdateLaunchGuardrailProfile}
      />
    </div>
  );
}
