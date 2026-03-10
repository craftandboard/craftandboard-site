"use client";

import type { MarketplaceMappingTemplateItem } from "../lib/api";

function fieldClass() {
  return "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-white";
}

export function MarketplaceMappingTemplateEditor({
  templates,
  onCreate,
  onUpdate
}: {
  templates: MarketplaceMappingTemplateItem[];
  onCreate: (formData: FormData) => void;
  onUpdate: (mappingTemplateId: string, formData: FormData) => void;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-200">Marketplace Mapping Templates</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Standardize listing-prep field packaging</h3>
      <p className="mt-1 text-sm text-slate-300">
        Keep listing handoff shapes consistent with reusable internal formatting rules for product label, SKU, dimensions, packaging, and pricing summaries.
      </p>

      <form action={onCreate} className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/25 p-4 md:grid-cols-3">
        <label className="text-sm text-slate-300">Template name<input name="name" required className={fieldClass()} placeholder="Balanced Amazon handoff" /></label>
        <label className="text-sm text-slate-300">Status<select name="status" className={fieldClass()} defaultValue="ACTIVE"><option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option></select></label>
        <label className="text-sm text-slate-300">SKU format<input name="skuFormat" className={fieldClass()} placeholder="HUGO-{sku}" /></label>
        <label className="text-sm text-slate-300">Product label format<input name="productLabelFormat" className={fieldClass()} placeholder="{productLabel}" /></label>
        <label className="text-sm text-slate-300">Dimensions format<input name="dimensionsFormat" className={fieldClass()} placeholder="{dimensionSummary}" /></label>
        <label className="text-sm text-slate-300">Material format<input name="materialFormat" className={fieldClass()} placeholder="{materialSummary}" /></label>
        <label className="text-sm text-slate-300">Packaging format<input name="packagingFormat" className={fieldClass()} placeholder="{packagingSummary}" /></label>
        <label className="text-sm text-slate-300">Pricing format<input name="pricingFormat" className={fieldClass()} placeholder="{pricingSummary}" /></label>
        <label className="text-sm text-slate-300 md:col-span-2">Notes<input name="notes" className={fieldClass()} placeholder="Use for clean Amazon launch-prep exports." /></label>
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="includeWarningNotes" value="true" defaultChecked className="rounded border-white/20 bg-slate-950/35" /> Include warning notes</label>
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="includeOverrideNotes" value="true" defaultChecked className="rounded border-white/20 bg-slate-950/35" /> Include override notes</label>
        <div className="flex items-end md:col-span-1">
          <button type="submit" className="w-full rounded-full bg-fuchsia-300 px-4 py-2 text-sm font-semibold text-slate-950">Add mapping template</button>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {templates.length ? templates.map((template) => (
          <form key={template.id} action={(formData) => onUpdate(template.id, formData)} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/25 p-4 md:grid-cols-3">
            <label className="text-sm text-slate-300">Template name<input name="name" defaultValue={template.name} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Status<select name="status" defaultValue={template.status} className={fieldClass()}><option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option></select></label>
            <label className="text-sm text-slate-300">SKU format<input name="skuFormat" defaultValue={template.skuFormat ?? ""} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Product label format<input name="productLabelFormat" defaultValue={template.productLabelFormat ?? ""} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Dimensions format<input name="dimensionsFormat" defaultValue={template.dimensionsFormat ?? ""} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Material format<input name="materialFormat" defaultValue={template.materialFormat ?? ""} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Packaging format<input name="packagingFormat" defaultValue={template.packagingFormat ?? ""} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300">Pricing format<input name="pricingFormat" defaultValue={template.pricingFormat ?? ""} className={fieldClass()} /></label>
            <label className="text-sm text-slate-300 md:col-span-2">Notes<input name="notes" defaultValue={template.notes ?? ""} className={fieldClass()} /></label>
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="includeWarningNotes" value="true" defaultChecked={template.includeWarningNotes} className="rounded border-white/20 bg-slate-950/35" /> Include warning notes</label>
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="includeOverrideNotes" value="true" defaultChecked={template.includeOverrideNotes} className="rounded border-white/20 bg-slate-950/35" /> Include override notes</label>
            <div className="flex items-end justify-between gap-3 md:col-span-1">
              <div className="text-xs text-slate-400">{template.status} · {template.productLabelFormat ?? "{productLabel}"}</div>
              <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">Update template</button>
            </div>
          </form>
        )) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/20 p-4 text-sm text-slate-300">
            No marketplace mapping templates yet. Add one so listing-prep exports follow a stable internal format.
          </div>
        )}
      </div>
    </section>
  );
}
