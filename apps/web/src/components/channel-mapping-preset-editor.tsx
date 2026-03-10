"use client";

import type { ChannelMappingPresetItem } from "../lib/api";

function fieldClass() {
  return "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-white";
}

export function ChannelMappingPresetEditor({
  presets,
  onCreate,
  onUpdate
}: {
  presets: ChannelMappingPresetItem[];
  onCreate: (formData: FormData) => void;
  onUpdate: (channelMappingPresetId: string, formData: FormData) => void;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Channel Mapping Presets</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Standardize manual Amazon field packaging</h3>
      <p className="mt-1 text-sm text-slate-300">
        Use reusable channel presets to keep label, SKU, dimensions, packaging, pricing, warnings, and override notes packaged consistently.
      </p>

      <form action={onCreate} className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/25 p-4 md:grid-cols-3">
        <label className="text-sm text-slate-300">Preset name<input name="name" required className={fieldClass()} placeholder="Amazon manual default" /></label>
        <label className="text-sm text-slate-300">Status<select name="status" className={fieldClass()} defaultValue="ACTIVE"><option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option></select></label>
        <label className="text-sm text-slate-300">Channel<input value="AMAZON_MANUAL" disabled className={fieldClass()} /></label>
        <label className="text-sm text-slate-300">Product label format<input name="productLabelFormat" className={fieldClass()} placeholder="{productLabel}" /></label>
        <label className="text-sm text-slate-300">SKU format<input name="skuFormat" className={fieldClass()} placeholder="AMZ-{sku}" /></label>
        <label className="text-sm text-slate-300">Dimensions format<input name="dimensionsFormat" className={fieldClass()} placeholder="{dimensionSummary}" /></label>
        <label className="text-sm text-slate-300">Material format<input name="materialFormat" className={fieldClass()} placeholder="{materialSummary}" /></label>
        <label className="text-sm text-slate-300">Packaging format<input name="packagingFormat" className={fieldClass()} placeholder="{packagingSummary}" /></label>
        <label className="text-sm text-slate-300">Pricing format<input name="pricingFormat" className={fieldClass()} placeholder="{pricingSummary}" /></label>
        <label className="text-sm text-slate-300">Priority<input name="priority" type="number" min="0" className={fieldClass()} placeholder="10" /></label>
        <label className="text-sm text-slate-300">Default launch strategies<input name="defaultLaunchStrategies" className={fieldClass()} placeholder="BALANCED,AGGRESSIVE" /></label>
        <label className="text-sm text-slate-300 md:col-span-3">Worksheet group order<textarea name="worksheetFieldOrdering" className={fieldClass()} rows={2} placeholder="header,specs,pricing,fulfillment,warnings,checklist,prompts" /></label>
        <label className="text-sm text-slate-300 md:col-span-3">Worksheet prompts<textarea name="worksheetPrompts" className={fieldClass()} rows={3} placeholder="Confirm title and SKU before entry&#10;Review warnings before publish" /></label>
        <label className="text-sm text-slate-300 md:col-span-2">Required field checklist<input name="requiredChecklist" className={fieldClass()} placeholder="productLabel,dimensionSummary,materialSummary,pricingSummary" /></label>
        <label className="text-sm text-slate-300">Optional field checklist<input name="optionalChecklist" className={fieldClass()} placeholder="sku,shippingSummary,feePresetLabel" /></label>
        <label className="text-sm text-slate-300 md:col-span-2">Notes<input name="notes" className={fieldClass()} placeholder="Use this preset for the first manual Amazon listing pass." /></label>
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="includeWarningNotes" value="true" defaultChecked className="rounded border-white/20 bg-slate-950/35" /> Include warning notes</label>
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="includeOverrideNotes" value="true" defaultChecked className="rounded border-white/20 bg-slate-950/35" /> Include override notes</label>
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="defaultForChannel" value="true" className="rounded border-white/20 bg-slate-950/35" /> Default for channel</label>
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="autoApplyEnabled" value="true" className="rounded border-white/20 bg-slate-950/35" /> Auto-apply enabled</label>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">Add channel preset</button>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {presets.length ? presets.map((preset) => (
          <form key={preset.id} action={(formData) => onUpdate(preset.id, formData)} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/25 p-4 md:grid-cols-3">
            <label className="text-sm text-slate-300">Preset name<input name="name" defaultValue={preset.name} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Status<select name="status" defaultValue={preset.status} className={fieldClass()}><option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option></select></label>
            <label className="text-sm text-slate-300">Channel<input value={preset.channelCode} disabled className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Product label format<input name="productLabelFormat" defaultValue={preset.productLabelFormat ?? ""} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">SKU format<input name="skuFormat" defaultValue={preset.skuFormat ?? ""} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Dimensions format<input name="dimensionsFormat" defaultValue={preset.dimensionsFormat ?? ""} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Material format<input name="materialFormat" defaultValue={preset.materialFormat ?? ""} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Packaging format<input name="packagingFormat" defaultValue={preset.packagingFormat ?? ""} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Pricing format<input name="pricingFormat" defaultValue={preset.pricingFormat ?? ""} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Priority<input name="priority" type="number" min="0" defaultValue={preset.priority ?? ""} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Default launch strategies<input name="defaultLaunchStrategies" defaultValue={(preset.defaultLaunchStrategies ?? []).join(",")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300 md:col-span-3">Worksheet group order<textarea name="worksheetFieldOrdering" defaultValue={((preset.worksheetFieldOrderingSnapshot?.groups as string[] | undefined) ?? []).join(",")} className={fieldClass()} rows={2} /></label>
            <label className="text-sm text-slate-300 md:col-span-3">Worksheet prompts<textarea name="worksheetPrompts" defaultValue={((preset.worksheetPromptSnapshot?.prompts as string[] | undefined) ?? []).join("\n")} className={fieldClass()} rows={3} /></label>
            <label className="text-sm text-slate-300 md:col-span-2">Required field checklist<input name="requiredChecklist" defaultValue={((preset.requiredFieldChecklistSnapshot?.fields as string[] | undefined) ?? []).join(",")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Optional field checklist<input name="optionalChecklist" defaultValue={((preset.optionalFieldChecklistSnapshot?.fields as string[] | undefined) ?? []).join(",")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300 md:col-span-2">Notes<input name="notes" defaultValue={preset.notes ?? ""} className={fieldClass()} /></label>
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="includeWarningNotes" value="true" defaultChecked={preset.includeWarningNotes} className="rounded border-white/20 bg-slate-950/35" /> Include warning notes</label>
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="includeOverrideNotes" value="true" defaultChecked={preset.includeOverrideNotes} className="rounded border-white/20 bg-slate-950/35" /> Include override notes</label>
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="defaultForChannel" value="true" defaultChecked={preset.defaultForChannel} className="rounded border-white/20 bg-slate-950/35" /> Default for channel</label>
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="autoApplyEnabled" value="true" defaultChecked={preset.autoApplyEnabled} className="rounded border-white/20 bg-slate-950/35" /> Auto-apply enabled</label>
            <div className="flex items-end justify-between gap-3">
              <div className="text-xs text-slate-400">{preset.channelCode} · {preset.defaultForChannel ? "default" : "manual"} · {preset.productLabelFormat ?? "{productLabel}"}</div>
              <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">Update preset</button>
            </div>
          </form>
        )) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/20 p-4 text-sm text-slate-300">
            No channel mapping presets yet. Add one to standardize the manual Amazon handoff package.
          </div>
        )}
      </div>
    </section>
  );
}
