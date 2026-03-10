"use client";

import type {
  AmazonFeePresetItem,
  LaunchTemplateItem,
  PackagingCostRuleItem,
  ShippingCostRuleItem,
  ShippingZoneRuleItem
} from "../lib/api";
import { getLaunchStrategyLabel } from "../lib/cost-engine";

function fieldClass() {
  return "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-white";
}

export function LaunchTemplateEditor({
  templates,
  feePresets,
  shippingZones,
  packagingRules,
  shippingRules,
  onCreate,
  onUpdate
}: {
  templates: LaunchTemplateItem[];
  feePresets: AmazonFeePresetItem[];
  shippingZones: ShippingZoneRuleItem[];
  packagingRules: PackagingCostRuleItem[];
  shippingRules: ShippingCostRuleItem[];
  onCreate: (formData: FormData) => void;
  onUpdate: (templateId: string, formData: FormData) => void;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Launch Templates</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Seed Amazon launch scenarios</h3>
      <p className="mt-1 text-sm text-slate-300">
        Save reusable launch defaults so new comparisons start from realistic Hugo assumptions.
      </p>

      <form action={onCreate} className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/25 p-4 md:grid-cols-3">
        <label className="text-sm text-slate-300">
          Template name
          <input name="name" className={fieldClass()} placeholder="Balanced launch starter" required />
        </label>
        <label className="text-sm text-slate-300">
          Launch strategy
          <select name="launchStrategy" className={fieldClass()} defaultValue="BALANCED">
            <option value="BALANCED">Balanced launch</option>
            <option value="AGGRESSIVE">Aggressive launch</option>
            <option value="SAFER_MARGIN">Safer margin</option>
          </select>
        </label>
        <label className="text-sm text-slate-300">
          Status
          <select name="status" className={fieldClass()} defaultValue="ACTIVE">
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label className="text-sm text-slate-300">
          Default fee preset
          <select name="defaultAmazonFeePresetId" className={fieldClass()} defaultValue="">
            <option value="">None</option>
            {feePresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-300">
          Default shipping zone
          <select name="defaultShippingZoneRuleId" className={fieldClass()} defaultValue="">
            <option value="">None</option>
            {shippingZones.map((rule) => (
              <option key={rule.id} value={rule.id}>
                {rule.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-300">
          Default packaging rule
          <select name="defaultPackagingRuleId" className={fieldClass()} defaultValue="">
            <option value="">None</option>
            {packagingRules.map((rule) => (
              <option key={rule.id} value={rule.id}>
                {rule.packagingName}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-300">
          Default shipping rule
          <select name="defaultShippingRuleId" className={fieldClass()} defaultValue="">
            <option value="">None</option>
            {shippingRules.map((rule) => (
              <option key={rule.id} value={rule.id}>
                {rule.shippingName}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-300 md:col-span-2">
          Notes
          <input name="notes" className={fieldClass()} placeholder="Good starting point for launch pricing reviews" />
        </label>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">
            Add launch template
          </button>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {templates.length ? (
          templates.map((template) => (
            <form
              key={template.id}
              action={(formData) => onUpdate(template.id, formData)}
              className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/25 p-4 md:grid-cols-3"
            >
              <label className="text-sm text-slate-300">
                Template name
                <input name="name" defaultValue={template.name} className={fieldClass()} />
              </label>
              <label className="text-sm text-slate-300">
                Launch strategy
                <select name="launchStrategy" defaultValue={template.launchStrategy} className={fieldClass()}>
                  <option value="BALANCED">Balanced launch</option>
                  <option value="AGGRESSIVE">Aggressive launch</option>
                  <option value="SAFER_MARGIN">Safer margin</option>
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Status
                <select name="status" defaultValue={template.status} className={fieldClass()}>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Fee preset
                <select
                  name="defaultAmazonFeePresetId"
                  defaultValue={template.defaultAmazonFeePresetId ?? ""}
                  className={fieldClass()}
                >
                  <option value="">None</option>
                  {feePresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Shipping zone
                <select
                  name="defaultShippingZoneRuleId"
                  defaultValue={template.defaultShippingZoneRuleId ?? ""}
                  className={fieldClass()}
                >
                  <option value="">None</option>
                  {shippingZones.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Packaging rule
                <select
                  name="defaultPackagingRuleId"
                  defaultValue={template.defaultPackagingRuleId ?? ""}
                  className={fieldClass()}
                >
                  <option value="">None</option>
                  {packagingRules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.packagingName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Shipping rule
                <select
                  name="defaultShippingRuleId"
                  defaultValue={template.defaultShippingRuleId ?? ""}
                  className={fieldClass()}
                >
                  <option value="">None</option>
                  {shippingRules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.shippingName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300 md:col-span-2">
                Notes
                <input name="notes" defaultValue={template.notes ?? ""} className={fieldClass()} />
              </label>
              <div className="flex items-end justify-between gap-3">
                <div className="text-xs text-slate-400">{getLaunchStrategyLabel(template.launchStrategy)}</div>
                <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">
                  Update template
                </button>
              </div>
            </form>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/20 p-4 text-sm text-slate-300">
            No launch templates yet. Add a balanced, aggressive, and safer-margin starter so Hugo can compare launch choices faster.
          </div>
        )}
      </div>
    </section>
  );
}
