"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  calculateShelfCost,
  createCostProfile,
  createEdgeBandCostRule,
  createMaterialCostRule,
  createPackagingCostRule,
  createShippingCostRule,
  getCostProfile,
  getCostProfiles,
  getShelfCostCalculations,
  saveShelfCostCalculation,
  type CostCalculationPreview,
  type CostCalculationResult,
  type CostProfileDetail,
  type CostProfileSummaryItem,
  type ShelfCostCalculationRecord
} from "../lib/api";
import { formatCostLabel, getEdgeBandPatternLabel } from "../lib/cost-engine";
import { CostAssumptionsPanel } from "./cost-assumptions-panel";
import { CostBreakdownCard } from "./cost-breakdown-card";
import { CostHistoryList } from "./cost-history-list";
import { CostProfileEditor } from "./cost-profile-editor";

const edgeBandOptions = ["NONE", "LONG_EDGES", "SHORT_EDGES", "ALL_FOUR"] as const;

function toOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function CostCalculatorForm() {
  const [profiles, setProfiles] = useState<CostProfileSummaryItem[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<CostProfileDetail | null>(null);
  const [calculations, setCalculations] = useState<ShelfCostCalculationRecord[]>([]);
  const [preview, setPreview] = useState<CostCalculationPreview | null>(null);
  const [result, setResult] = useState<CostCalculationResult | null>(null);
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
    laborMinutes: "12",
    machineMinutes: "8",
    overheadMinutes: "10",
    targetMarginPct: "",
    growthMarginPct: ""
  });

  const refreshAll = useCallback(
    async (preferredProfileId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const [profilesPayload, calculationsPayload] = await Promise.all([
          getCostProfiles(),
          getShelfCostCalculations()
        ]);
        const nextProfiles = profilesPayload?.profiles ?? [];
        const nextCalculations = calculationsPayload?.calculations ?? [];
        setProfiles(nextProfiles);
        setCalculations(nextCalculations);

        const defaultProfileId =
          preferredProfileId ??
          selectedProfileId ??
          nextProfiles.find((profile) => profile.status === "ACTIVE")?.id ??
          nextProfiles[0]?.id ??
          "";
        setSelectedProfileId(defaultProfileId);
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
    if (!selectedProfile) {
      return;
    }

    setForm((current) => ({
      ...current,
      materialCode: current.materialCode || selectedProfile.materialRules[0]?.materialCode || "",
      edgeBandCode: current.edgeBandCode || selectedProfile.edgeBandRules[0]?.edgeBandCode || "",
      packagingCode: current.packagingCode || selectedProfile.packagingRules[0]?.packagingCode || "",
      shippingCode: current.shippingCode || selectedProfile.shippingRules[0]?.shippingCode || "",
      targetMarginPct:
        current.targetMarginPct || (selectedProfile.targetMarginPct !== null ? String(selectedProfile.targetMarginPct) : ""),
      growthMarginPct:
        current.growthMarginPct || (selectedProfile.growthMarginPct !== null ? String(selectedProfile.growthMarginPct) : "")
    }));
  }, [selectedProfile]);

  const options = useMemo(
    () => ({
      materials: selectedProfile?.materialRules ?? [],
      edgeBands: selectedProfile?.edgeBandRules ?? [],
      packaging: selectedProfile?.packagingRules ?? [],
      shipping: selectedProfile?.shippingRules ?? []
    }),
    [selectedProfile]
  );

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function buildPayload() {
    if (!selectedProfileId) {
      throw new Error("Choose a cost profile first.");
    }

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
      laborMinutes: Number(form.laborMinutes),
      machineMinutes: Number(form.machineMinutes),
      overheadMinutes: form.overheadMinutes ? Number(form.overheadMinutes) : null,
      targetMarginPct: form.targetMarginPct ? Number(form.targetMarginPct) : null,
      growthMarginPct: form.growthMarginPct ? Number(form.growthMarginPct) : null
    };
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
          setSuccess("Shelf cost calculation saved.");
          await refreshAll(selectedProfileId);
          if (payload?.calculation) {
            hydrateFromCalculation(payload.calculation);
          }
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to save shelf cost calculation.");
        }
      })();
    });
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
      laborMinutes: calculation.laborMinutes,
      machineMinutes: calculation.machineMinutes,
      overheadMinutes: calculation.overheadMinutes,
      materialCostCents: calculation.materialCostCents,
      edgeBandCostCents: calculation.edgeBandCostCents,
      laborCostCents: calculation.laborCostCents,
      machineCostCents: calculation.machineCostCents,
      packagingCostCents: calculation.packagingCostCents,
      shippingCostCents: calculation.shippingCostCents,
      overheadCostCents: calculation.overheadCostCents,
      subtotalCostCents: calculation.subtotalCostCents,
      recommendedInternalPriceCents: calculation.recommendedInternalPriceCents ?? 0,
      recommendedSellPriceCents: calculation.recommendedSellPriceCents ?? 0
    });
    setResult((calculation.resultSnapshot as unknown as CostCalculationResult) ?? null);
    setForm({
      name: calculation.name ?? "",
      sku: calculation.sku ?? "",
      quantity: String(calculation.quantity),
      lengthIn: String(calculation.lengthIn),
      depthIn: String(calculation.depthIn),
      thicknessIn: calculation.thicknessIn !== null ? String(calculation.thicknessIn) : "",
      weightLb: "",
      materialCode: calculation.materialCode,
      edgeBandCode: calculation.edgeBandCode ?? "",
      edgeBandPattern: calculation.edgeBandPattern,
      packagingCode: calculation.packagingCode ?? "",
      shippingCode: calculation.shippingCode ?? "",
      laborMinutes: String(calculation.laborMinutes),
      machineMinutes: String(calculation.machineMinutes),
      overheadMinutes: calculation.overheadMinutes !== null ? String(calculation.overheadMinutes) : "",
      targetMarginPct: calculation.targetMarginPct !== null ? String(calculation.targetMarginPct) : "",
      growthMarginPct: calculation.growthMarginPct !== null ? String(calculation.growthMarginPct) : ""
    });
  }

  function handleCreateProfile(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          const payload = await createCostProfile({
            name: String(formData.get("name") ?? ""),
            targetMarginPct: toOptionalNumber(formData.get("targetMarginPct")) ?? null,
            growthMarginPct: toOptionalNumber(formData.get("growthMarginPct")) ?? null,
            defaultLaborRateCentsPerHour: toOptionalNumber(formData.get("defaultLaborRateCentsPerHour")),
            defaultMachineRateCentsPerHour: toOptionalNumber(formData.get("defaultMachineRateCentsPerHour")),
            defaultOverheadRateCentsPerHour: toOptionalNumber(formData.get("defaultOverheadRateCentsPerHour")) ?? null
          });
          const nextId = payload?.profile?.id;
          setSuccess("Cost profile created.");
          await refreshAll(nextId);
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to create cost profile.");
        }
      })();
    });
  }

  function handleCreateMaterialRule(formData: FormData) {
    if (!selectedProfileId) return;
    startTransition(() => {
      void (async () => {
        try {
          await createMaterialCostRule(selectedProfileId, {
            materialCode: String(formData.get("materialCode") ?? ""),
            materialName: String(formData.get("materialName") ?? ""),
            sheetLengthIn: Number(formData.get("sheetLengthIn") ?? 0),
            sheetWidthIn: Number(formData.get("sheetWidthIn") ?? 0),
            sheetCostCents: Number(formData.get("sheetCostCents") ?? 0),
            wastePct: toOptionalNumber(formData.get("wastePct")) ?? null
          });
          setSuccess("Material rule added.");
          await refreshAll(selectedProfileId);
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to add material rule.");
        }
      })();
    });
  }

  function handleCreateEdgeBandRule(formData: FormData) {
    if (!selectedProfileId) return;
    startTransition(() => {
      void (async () => {
        try {
          await createEdgeBandCostRule(selectedProfileId, {
            edgeBandCode: String(formData.get("edgeBandCode") ?? ""),
            edgeBandName: String(formData.get("edgeBandName") ?? ""),
            costCentsPerLinearFoot: Number(formData.get("costCentsPerLinearFoot") ?? 0),
            setupAllowanceLinearFt: toOptionalNumber(formData.get("setupAllowanceLinearFt")) ?? null
          });
          setSuccess("Edge band rule added.");
          await refreshAll(selectedProfileId);
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to add edge band rule.");
        }
      })();
    });
  }

  function handleCreatePackagingRule(formData: FormData) {
    if (!selectedProfileId) return;
    startTransition(() => {
      void (async () => {
        try {
          await createPackagingCostRule(selectedProfileId, {
            packagingCode: String(formData.get("packagingCode") ?? ""),
            packagingName: String(formData.get("packagingName") ?? ""),
            boxCostCents: toOptionalNumber(formData.get("boxCostCents")) ?? null,
            bubbleWrapCostCents: toOptionalNumber(formData.get("bubbleWrapCostCents")) ?? null,
            tapeCostCents: toOptionalNumber(formData.get("tapeCostCents")) ?? null,
            labelCostCents: toOptionalNumber(formData.get("labelCostCents")) ?? null
          });
          setSuccess("Packaging rule added.");
          await refreshAll(selectedProfileId);
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to add packaging rule.");
        }
      })();
    });
  }

  function handleCreateShippingRule(formData: FormData) {
    if (!selectedProfileId) return;
    startTransition(() => {
      void (async () => {
        try {
          await createShippingCostRule(selectedProfileId, {
            shippingCode: String(formData.get("shippingCode") ?? ""),
            shippingName: String(formData.get("shippingName") ?? ""),
            baseCostCents: Number(formData.get("baseCostCents") ?? 0),
            costPerCubicInchCents: toOptionalNumber(formData.get("costPerCubicInchCents")) ?? null
          });
          setSuccess("Shipping rule added.");
          await refreshAll(selectedProfileId);
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to add shipping rule.");
        }
      })();
    });
  }

  if (loading) {
    return <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-8 text-slate-300">Loading Hugo cost engine…</div>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Hugo Cost Engine</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Shelf cost calculator foundation</h1>
        <p className="mt-3 max-w-4xl text-sm text-slate-300">
          Use editable shop assumptions to calculate true per-shelf cost, then turn that into a
          recommended internal and sell price Hugo can trust.
        </p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-end gap-4">
              <label className="min-w-[18rem] flex-1 text-sm text-slate-300">
                Cost profile
                <select
                  value={selectedProfileId}
                  onChange={(event) => setSelectedProfileId(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-white"
                >
                  <option value="">Select a profile</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} · {profile.status}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-xl border border-white/10 bg-slate-950/25 px-4 py-3 text-sm text-slate-300">
                {selectedProfile ? (
                  <>
                    Active materials: {selectedProfile.materialRules.length} · Packaging:{" "}
                    {selectedProfile.packagingRules.length} · Shipping: {selectedProfile.shippingRules.length}
                  </>
                ) : (
                  "Create a profile to start calculating."
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <label className="text-sm text-slate-300">
                Calculation name
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white"
                  placeholder="36in pantry shelf"
                />
              </label>
              <label className="text-sm text-slate-300">
                SKU
                <input
                  value={form.sku}
                  onChange={(event) => updateField("sku", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white"
                  placeholder="HUGO-SHELF-36W"
                />
              </label>
              <label className="text-sm text-slate-300">
                Quantity
                <input value={form.quantity} onChange={(event) => updateField("quantity", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" />
              </label>
              <label className="text-sm text-slate-300">
                Length (in)
                <input value={form.lengthIn} onChange={(event) => updateField("lengthIn", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" />
              </label>
              <label className="text-sm text-slate-300">
                Depth (in)
                <input value={form.depthIn} onChange={(event) => updateField("depthIn", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" />
              </label>
              <label className="text-sm text-slate-300">
                Thickness (in)
                <input value={form.thicknessIn} onChange={(event) => updateField("thicknessIn", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" />
              </label>
              <label className="text-sm text-slate-300">
                Material
                <select value={form.materialCode} onChange={(event) => updateField("materialCode", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white">
                  <option value="">Select material</option>
                  {options.materials.map((rule) => (
                    <option key={rule.id} value={rule.materialCode}>
                      {rule.materialName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Edge band pattern
                <select value={form.edgeBandPattern} onChange={(event) => updateField("edgeBandPattern", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white">
                  {edgeBandOptions.map((option) => (
                    <option key={option} value={option}>
                      {getEdgeBandPatternLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Edge band rule
                <select value={form.edgeBandCode} onChange={(event) => updateField("edgeBandCode", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" disabled={form.edgeBandPattern === "NONE"}>
                  <option value="">{form.edgeBandPattern === "NONE" ? "Not needed" : "Select edge band"}</option>
                  {options.edgeBands.map((rule) => (
                    <option key={rule.id} value={rule.edgeBandCode}>
                      {rule.edgeBandName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Packaging profile
                <select value={form.packagingCode} onChange={(event) => updateField("packagingCode", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white">
                  <option value="">No packaging profile</option>
                  {options.packaging.map((rule) => (
                    <option key={rule.id} value={rule.packagingCode}>
                      {rule.packagingName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Shipping profile
                <select value={form.shippingCode} onChange={(event) => updateField("shippingCode", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white">
                  <option value="">No shipping profile</option>
                  {options.shipping.map((rule) => (
                    <option key={rule.id} value={rule.shippingCode}>
                      {rule.shippingName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Labor minutes
                <input value={form.laborMinutes} onChange={(event) => updateField("laborMinutes", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" />
              </label>
              <label className="text-sm text-slate-300">
                Machine minutes
                <input value={form.machineMinutes} onChange={(event) => updateField("machineMinutes", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" />
              </label>
              <label className="text-sm text-slate-300">
                Overhead minutes
                <input value={form.overheadMinutes} onChange={(event) => updateField("overheadMinutes", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" />
              </label>
              <label className="text-sm text-slate-300">
                Target margin %
                <input value={form.targetMarginPct} onChange={(event) => updateField("targetMarginPct", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" />
              </label>
              <label className="text-sm text-slate-300">
                Growth margin %
                <input value={form.growthMarginPct} onChange={(event) => updateField("growthMarginPct", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white" />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={handleCalculate} disabled={isPending} className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
                Calculate shelf cost
              </button>
              <button type="button" onClick={handleSave} disabled={isPending || !preview} className="rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
                Save calculation
              </button>
            </div>
          </section>

          <CostBreakdownCard preview={preview} result={result} />
          <CostHistoryList calculations={calculations} onSelect={hydrateFromCalculation} />
        </div>

        <div className="space-y-6">
          <CostAssumptionsPanel profile={selectedProfile} />
          <CostProfileEditor
            profile={selectedProfile}
            onCreateProfile={handleCreateProfile}
            onCreateMaterialRule={handleCreateMaterialRule}
            onCreateEdgeBandRule={handleCreateEdgeBandRule}
            onCreatePackagingRule={handleCreatePackagingRule}
            onCreateShippingRule={handleCreateShippingRule}
            busy={isPending}
          />
          <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Selected Rule Context</p>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <p>
                Material: <span className="font-semibold">{formatCostLabel(form.materialCode)}</span>
              </p>
              <p>
                Edge band:{" "}
                <span className="font-semibold">
                  {form.edgeBandPattern === "NONE"
                    ? "No edge band"
                    : formatCostLabel(form.edgeBandCode)}
                </span>
              </p>
              <p>
                Packaging: <span className="font-semibold">{formatCostLabel(form.packagingCode)}</span>
              </p>
              <p>
                Shipping: <span className="font-semibold">{formatCostLabel(form.shippingCode)}</span>
              </p>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
