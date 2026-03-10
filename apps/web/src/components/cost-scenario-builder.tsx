"use client";

import type {
  AmazonFeePresetItem,
  CostScenarioInput,
  LaunchTemplateItem,
  PackagingCostRuleItem,
  ShippingCostRuleItem,
  ShippingZoneRuleItem
} from "../lib/api";
import { getLaunchStrategyLabel } from "../lib/cost-engine";

function selectClass() {
  return "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-white";
}

function inputClass() {
  return "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-white";
}

export function CostScenarioBuilder({
  scenarios,
  feePresets,
  shippingZones,
  packagingRules,
  shippingRules,
  launchTemplates,
  onChange,
  onAdd,
  onRemove,
  onApplyTemplate
}: {
  scenarios: CostScenarioInput[];
  feePresets: AmazonFeePresetItem[];
  shippingZones: ShippingZoneRuleItem[];
  packagingRules: PackagingCostRuleItem[];
  shippingRules: ShippingCostRuleItem[];
  launchTemplates: LaunchTemplateItem[];
  onChange: (index: number, next: CostScenarioInput) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onApplyTemplate: (index: number, templateId: string) => void;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Scenario Builder</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Compare launch pricing cases</h3>
          <p className="mt-1 text-sm text-slate-300">
            Use the same shelf spec, then vary fee presets, zones, shipping, packaging, or margin targets.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
        >
          Add scenario
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {scenarios.map((scenario, index) => (
          <div key={`${scenario.name}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium text-white">{scenario.name}</p>
              {scenarios.length > 1 ? (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
                >
                  Remove
                </button>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <label className="text-sm text-slate-300">Scenario name<input value={scenario.name} onChange={(event) => onChange(index, { ...scenario, name: event.target.value })} className={inputClass()} /></label>
              <label className="text-sm text-slate-300">Launch template<select defaultValue="" onChange={(event) => onApplyTemplate(index, event.target.value)} className={selectClass()}><option value="">No template</option>{launchTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
              <label className="text-sm text-slate-300">Launch strategy<select value={scenario.launchStrategy ?? "BALANCED"} onChange={(event) => onChange(index, { ...scenario, launchStrategy: event.target.value as CostScenarioInput["launchStrategy"] })} className={selectClass()}><option value="BALANCED">Balanced launch</option><option value="AGGRESSIVE">Aggressive launch</option><option value="SAFER_MARGIN">Safer margin</option></select></label>
              <label className="text-sm text-slate-300">Amazon fee preset<select value={scenario.amazonFeePresetId ?? ""} onChange={(event) => onChange(index, { ...scenario, amazonFeePresetId: event.target.value || null })} className={selectClass()}><option value="">Use profile/defaults</option>{feePresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label>
              <label className="text-sm text-slate-300">Shipping zone<select value={scenario.shippingZoneRuleId ?? ""} onChange={(event) => onChange(index, { ...scenario, shippingZoneRuleId: event.target.value || null })} className={selectClass()}><option value="">Use base shipping only</option>{shippingZones.map((rule) => <option key={rule.id} value={rule.id}>{rule.name}</option>)}</select></label>
              <label className="text-sm text-slate-300">Packaging rule<select value={scenario.packagingCode ?? ""} onChange={(event) => onChange(index, { ...scenario, packagingCode: event.target.value || null })} className={selectClass()}><option value="">Use base selection</option>{packagingRules.map((rule) => <option key={rule.id} value={rule.packagingCode}>{rule.packagingName}</option>)}</select></label>
              <label className="text-sm text-slate-300">Shipping rule<select value={scenario.shippingCode ?? ""} onChange={(event) => onChange(index, { ...scenario, shippingCode: event.target.value || null })} className={selectClass()}><option value="">Use base selection</option>{shippingRules.map((rule) => <option key={rule.id} value={rule.shippingCode}>{rule.shippingName}</option>)}</select></label>
              <label className="text-sm text-slate-300">Target margin %<input value={scenario.targetMarginPct ?? ""} onChange={(event) => onChange(index, { ...scenario, targetMarginPct: event.target.value ? Number(event.target.value) : null })} className={inputClass()} /></label>
            </div>
            <p className="mt-3 text-xs text-slate-400">{getLaunchStrategyLabel(scenario.launchStrategy)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
