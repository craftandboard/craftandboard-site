"use client";

import type { CostCalculationPreview, CostCalculationResult } from "../lib/api";
import { formatMoney, formatPercent } from "../lib/cost-engine";

export function CostBreakdownCard({
  preview,
  result
}: {
  preview: CostCalculationPreview | null;
  result: CostCalculationResult | null;
}) {
  if (!preview || !result) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Calculate a shelf to see the material, edge band, labor, machine, packaging, shipping,
        overhead, and price recommendations.
      </section>
    );
  }

  const rows: Array<[string, number]> = [
    ["Material", preview.materialCostCents],
    ["Edge band", preview.edgeBandCostCents],
    ["Labor", preview.laborCostCents],
    ["Machine", preview.machineCostCents],
    ["Packaging components", result.packaging.componentCostCents],
    ["Packing labor", preview.packingLaborCostCents],
    ["Packaging total", preview.packagingCostCents],
    ["Shipping total", preview.shippingCostCents],
    ["Shipping buffer", preview.shippingBufferCostCents],
    ["Overhead", preview.overheadCostCents]
  ];

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Cost Breakdown</p>
          <h3 className="mt-2 text-xl font-semibold text-white">
            {preview.name || "Unsaved shelf calculation"}
          </h3>
          <p className="mt-1 text-sm text-slate-300">
            {preview.quantity} shelf{preview.quantity === 1 ? "" : "s"} · {preview.lengthIn}&quot; x{" "}
            {preview.depthIn}&quot;
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Recommended Sell</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {formatMoney(preview.recommendedSellPriceCents)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/25 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-1 text-lg font-semibold text-white">{formatMoney(value)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
        <div className="flex items-center justify-between text-sm text-slate-200">
          <span>Subtotal production cost</span>
          <span className="font-semibold">{formatMoney(preview.subtotalCostCents)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm text-slate-200">
          <span>Recommended internal price</span>
          <span className="font-semibold">{formatMoney(preview.recommendedInternalPriceCents)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm text-slate-200">
          <span>Recommended customer / Amazon price</span>
          <span className="font-semibold">{formatMoney(preview.recommendedSellPriceCents)}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Material Geometry</p>
          <p className="mt-2 text-sm text-slate-200">
            Required area: <span className="font-semibold">{result.geometry.requiredAreaSqFt.toFixed(2)} sq ft</span>
          </p>
          <p className="mt-1 text-sm text-slate-200">
            Sheet area: <span className="font-semibold">{result.geometry.sheetAreaSqFt.toFixed(2)} sq ft</span>
          </p>
          <p className="mt-1 text-sm text-slate-200">
            Effective sheets: <span className="font-semibold">{result.geometry.sheetsRequired.toFixed(2)}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pricing Assumptions</p>
          <p className="mt-2 text-sm text-slate-200">
            Target margin: <span className="font-semibold">{formatPercent(result.pricing.targetMarginPct)}</span>
          </p>
          <p className="mt-1 text-sm text-slate-200">
            Growth margin: <span className="font-semibold">{formatPercent(result.pricing.growthMarginPct)}</span>
          </p>
          <p className="mt-1 text-sm text-slate-200">
            Edge band footage:{" "}
            <span className="font-semibold">{result.geometry.effectiveEdgeBandLinearFeet.toFixed(2)} ft</span>
          </p>
          <p className="mt-1 text-sm text-slate-200">
            Packing minutes:{" "}
            <span className="font-semibold">{result.packaging.packingMinutes.toFixed(1)} min</span>
          </p>
        </div>
      </div>
    </section>
  );
}
