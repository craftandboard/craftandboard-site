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
        <label className="text-sm text-slate-300 md:col-span-3">Review prompts<textarea name="reviewPrompts" className={fieldClass()} rows={2} placeholder="Confirm dimensions before entry&#10;Review packaging summary" /></label>
        <label className="text-sm text-slate-300 md:col-span-3">Completion prompts<textarea name="completionPrompts" className={fieldClass()} rows={2} placeholder="Use the current approved artifact only&#10;Re-check warning notes before finishing" /></label>
        <label className="text-sm text-slate-300 md:col-span-3">Copy block group order<textarea name="copyGroupOrdering" className={fieldClass()} rows={2} placeholder="identity,specs,fulfillment,pricing,warnings,checklist,prompts" /></label>
        <label className="text-sm text-slate-300 md:col-span-3">Quick-copy priority order<textarea name="quickCopyOrdering" className={fieldClass()} rows={2} placeholder="identity,specs,pricing,warnings" /></label>
        <label className="text-sm text-slate-300 md:col-span-3">Final-review critical prompts<textarea name="finalReviewCriticalPrompts" className={fieldClass()} rows={2} placeholder="Confirm approved price field before entry&#10;Confirm this is still the current approved artifact" /></label>
        <label className="text-sm text-slate-300 md:col-span-3">Final-review warning prompts<textarea name="finalReviewWarningPrompts" className={fieldClass()} rows={2} placeholder="Acknowledge override notes before entry&#10;Re-check warning-sensitive values" /></label>
        <label className="text-sm text-slate-300 md:col-span-3">Final-review completion prompts<textarea name="finalReviewCompletionPrompts" className={fieldClass()} rows={2} placeholder="Confirm missing or weak fields are resolved&#10;Verify packaging and shipping match the launch scenario" /></label>
        <label className="text-sm text-slate-300 md:col-span-3">Final runbook section order<textarea name="finalRunbookOrdering" className={fieldClass()} rows={2} placeholder="copy-first,final-review,completion-cue,warnings,internal-share" /></label>
        <label className="text-sm text-slate-300 md:col-span-3">Completion cue last checks<textarea name="completionCueChecks" className={fieldClass()} rows={2} placeholder="Confirm this is still the current approved artifact&#10;Verify the final price field before entry" /></label>
        <label className="text-sm text-slate-300 md:col-span-3">Final check order<textarea name="finalCheckOrdering" className={fieldClass()} rows={2} placeholder="copy-first,pricing-critical,warnings,final-confirmation" /></label>
        <label className="text-sm text-slate-300 md:col-span-3">Pricing-critical checks<textarea name="pricingCriticalPrompts" className={fieldClass()} rows={2} placeholder="Confirm approved launch price&#10;Confirm minimum and safer-margin prices are still visible" /></label>
        <label className="text-sm text-slate-300 md:col-span-3">Entry-critical order<textarea name="entryCriticalOrdering" className={fieldClass()} rows={2} placeholder="copy-first,share-first,final-review,entry-complete" /></label>
        <label className="text-sm text-slate-300 md:col-span-3">Entry completion checks<textarea name="entryCompletionCueChecks" className={fieldClass()} rows={2} placeholder="Confirm all required entry values are packaged&#10;Mark entry complete only after final warning review" /></label>
        <label className="text-sm text-slate-300">Short summary headline<input name="shortSummaryHeadline" className={fieldClass()} placeholder="Copy these fields first" /></label>
        <label className="text-sm text-slate-300 md:col-span-2">Short summary footer<input name="shortSummaryFooter" className={fieldClass()} placeholder="Use the current approved artifact only" /></label>
        <label className="text-sm text-slate-300">Share packaging label<input name="sharePackagingLabel" className={fieldClass()} placeholder="share-ready-v1" /></label>
        <label className="text-sm text-slate-300 md:col-span-2">Share packaging summary<input name="sharePackagingSummary" className={fieldClass()} placeholder="Send this concise package internally when Amazon manual entry is about to start." /></label>
        <label className="text-sm text-slate-300">Handoff packet label<input name="handoffPacketLabel" className={fieldClass()} placeholder="handoff-packet-v1" /></label>
        <label className="text-sm text-slate-300 md:col-span-2">Handoff packet summary<input name="handoffPacketSummary" className={fieldClass()} placeholder="Use this final packet for manual Amazon entry and internal handoff." /></label>
        <label className="text-sm text-slate-300">Share summary purpose<input name="shareSummaryPurpose" className={fieldClass()} placeholder="Internal handoff summary for manual Amazon listing prep." /></label>
        <label className="text-sm text-slate-300">Share summary watch<input name="shareSummaryWatch" className={fieldClass()} placeholder="Review warnings and override notes before entry." /></label>
        <label className="text-sm text-slate-300">Share summary format label<input name="shareSummaryFormatLabel" className={fieldClass()} placeholder="internal-share-v1" /></label>
        <label className="text-sm text-slate-300">Identity label<input name="sectionLabelIdentity" className={fieldClass()} placeholder="Package identity" /></label>
        <label className="text-sm text-slate-300">Specs label<input name="sectionLabelSpecs" className={fieldClass()} placeholder="Product, dimensions, and material" /></label>
        <label className="text-sm text-slate-300">Fulfillment label<input name="sectionLabelFulfillment" className={fieldClass()} placeholder="Packaging and shipping" /></label>
        <label className="text-sm text-slate-300">Pricing label<input name="sectionLabelPricing" className={fieldClass()} placeholder="Pricing" /></label>
        <label className="text-sm text-slate-300">Warnings label<input name="sectionLabelWarnings" className={fieldClass()} placeholder="Warnings and overrides" /></label>
        <label className="text-sm text-slate-300">Checklist label<input name="sectionLabelChecklist" className={fieldClass()} placeholder="Checklist" /></label>
        <label className="text-sm text-slate-300">Prompts label<input name="sectionLabelPrompts" className={fieldClass()} placeholder="Operator prompts" /></label>
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
            <label className="text-sm text-slate-300 md:col-span-3">Review prompts<textarea name="reviewPrompts" defaultValue={((preset.operatorPromptTemplateSnapshot?.reviewPrompts as string[] | undefined) ?? []).join("\n")} className={fieldClass()} rows={2} /></label>
            <label className="text-sm text-slate-300 md:col-span-3">Completion prompts<textarea name="completionPrompts" defaultValue={((preset.operatorPromptTemplateSnapshot?.completionPrompts as string[] | undefined) ?? []).join("\n")} className={fieldClass()} rows={2} /></label>
            <label className="text-sm text-slate-300 md:col-span-3">Copy block group order<textarea name="copyGroupOrdering" defaultValue={((preset.copyGroupOrderingSnapshot?.groups as string[] | undefined) ?? []).join(",")} className={fieldClass()} rows={2} /></label>
            <label className="text-sm text-slate-300 md:col-span-3">Quick-copy priority order<textarea name="quickCopyOrdering" defaultValue={((preset.quickCopyOrderingSnapshot?.groups as string[] | undefined) ?? []).join(",")} className={fieldClass()} rows={2} /></label>
            <label className="text-sm text-slate-300 md:col-span-3">Final-review critical prompts<textarea name="finalReviewCriticalPrompts" defaultValue={((preset.finalReviewPromptTemplateSnapshot?.criticalReviewPrompts as string[] | undefined) ?? []).join("\n")} className={fieldClass()} rows={2} /></label>
            <label className="text-sm text-slate-300 md:col-span-3">Final-review warning prompts<textarea name="finalReviewWarningPrompts" defaultValue={((preset.finalReviewPromptTemplateSnapshot?.warningSensitivePrompts as string[] | undefined) ?? []).join("\n")} className={fieldClass()} rows={2} /></label>
            <label className="text-sm text-slate-300 md:col-span-3">Final-review completion prompts<textarea name="finalReviewCompletionPrompts" defaultValue={((preset.finalReviewPromptTemplateSnapshot?.completionReviewPrompts as string[] | undefined) ?? []).join("\n")} className={fieldClass()} rows={2} /></label>
            <label className="text-sm text-slate-300 md:col-span-3">Final runbook section order<textarea name="finalRunbookOrdering" defaultValue={((preset.finalReviewOrderingSnapshot?.sections as string[] | undefined) ?? []).join(",")} className={fieldClass()} rows={2} /></label>
            <label className="text-sm text-slate-300 md:col-span-3">Completion cue last checks<textarea name="completionCueChecks" defaultValue={((preset.completionCueTemplateSnapshot?.lastChecks as string[] | undefined) ?? []).join("\n")} className={fieldClass()} rows={2} /></label>
            <label className="text-sm text-slate-300 md:col-span-3">Final check order<textarea name="finalCheckOrdering" defaultValue={((preset.finalCheckOrderingSnapshot?.groups as string[] | undefined) ?? []).join(",")} className={fieldClass()} rows={2} /></label>
            <label className="text-sm text-slate-300 md:col-span-3">Pricing-critical checks<textarea name="pricingCriticalPrompts" defaultValue={((preset.pricingCriticalPromptSnapshot?.checks as string[] | undefined) ?? []).join("\n")} className={fieldClass()} rows={2} /></label>
            <label className="text-sm text-slate-300 md:col-span-3">Entry-critical order<textarea name="entryCriticalOrdering" defaultValue={((preset.entryCriticalOrderingSnapshot?.groups as string[] | undefined) ?? []).join(",")} className={fieldClass()} rows={2} /></label>
            <label className="text-sm text-slate-300 md:col-span-3">Entry completion checks<textarea name="entryCompletionCueChecks" defaultValue={((preset.entryCompletionCueTemplateSnapshot?.lastChecks as string[] | undefined) ?? []).join("\n")} className={fieldClass()} rows={2} /></label>
            <label className="text-sm text-slate-300">Short summary headline<input name="shortSummaryHeadline" defaultValue={String(preset.shortSummaryFormatSnapshot?.headline ?? "")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300 md:col-span-2">Short summary footer<input name="shortSummaryFooter" defaultValue={String(preset.shortSummaryFormatSnapshot?.footer ?? "")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Share packaging label<input name="sharePackagingLabel" defaultValue={String(preset.sharePackagingFormatSnapshot?.label ?? "")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300 md:col-span-2">Share packaging summary<input name="sharePackagingSummary" defaultValue={String(preset.sharePackagingFormatSnapshot?.summary ?? "")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Handoff packet label<input name="handoffPacketLabel" defaultValue={String(preset.handoffPacketFormatSnapshot?.label ?? "")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300 md:col-span-2">Handoff packet summary<input name="handoffPacketSummary" defaultValue={String(preset.handoffPacketFormatSnapshot?.summary ?? "")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Share summary purpose<input name="shareSummaryPurpose" defaultValue={String(preset.shareSummaryFormatSnapshot?.whatThisIsFor ?? "")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Share summary watch<input name="shareSummaryWatch" defaultValue={String(preset.shareSummaryFormatSnapshot?.whatToWatch ?? "")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Share summary format label<input name="shareSummaryFormatLabel" defaultValue={String(preset.shareSummaryFormatSnapshot?.formatLabel ?? "")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Identity label<input name="sectionLabelIdentity" defaultValue={String(preset.worksheetSectionLabelSnapshot?.identity ?? "")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Specs label<input name="sectionLabelSpecs" defaultValue={String(preset.worksheetSectionLabelSnapshot?.specs ?? "")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Fulfillment label<input name="sectionLabelFulfillment" defaultValue={String(preset.worksheetSectionLabelSnapshot?.fulfillment ?? "")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Pricing label<input name="sectionLabelPricing" defaultValue={String(preset.worksheetSectionLabelSnapshot?.pricing ?? "")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Warnings label<input name="sectionLabelWarnings" defaultValue={String(preset.worksheetSectionLabelSnapshot?.warnings ?? "")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Checklist label<input name="sectionLabelChecklist" defaultValue={String(preset.worksheetSectionLabelSnapshot?.checklist ?? "")} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Prompts label<input name="sectionLabelPrompts" defaultValue={String(preset.worksheetSectionLabelSnapshot?.prompts ?? "")} className={fieldClass()} /></label>
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
