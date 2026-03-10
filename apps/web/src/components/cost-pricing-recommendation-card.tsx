"use client";

import type { CostCalculationPreview, CostCalculationResult } from "../lib/api";
import { formatMoney, formatPercent } from "../lib/cost-engine";

export function CostPricingRecommendationCard({
  preview,
  result
}: {
  preview: CostCalculationPreview | null;
  result: CostCalculationResult | null;
}) {
  if (!preview || !result) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Calculate a shelf to see break-even, minimum sell, and target Amazon price guidance.
      </section>
    );
  }

  const rows: Array<[string, number | null]> = [
    ["Break-even price", preview.breakEvenPriceCents],
    ["Recommended minimum", preview.recommendedMinSellPriceCents],
    ["Recommended target", preview.recommendedTargetSellPriceCents],
    ["Marketplace fee allowance", preview.marketplaceFeeCostCents],
    ["Return reserve", preview.returnReserveCostCents],
    ["Damage reserve", preview.damageReserveCostCents]
  ];

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Sell Price Guidance</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Amazon-oriented recommendation</h3>
      <p className="mt-2 text-sm text-slate-300">
        The target price layers marketplace fees, return reserve, damage reserve, growth margin,
        and the selected target margin onto the true landed shelf cost.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-1 text-lg font-semibold text-white">{formatMoney(value ?? 0)}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-200">
        <div className="flex items-center justify-between">
          <span>Marketplace fee %</span>
          <span className="font-semibold">{formatPercent(result.pricing.marketplaceFeePct)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span>Return reserve %</span>
          <span className="font-semibold">{formatPercent(result.pricing.returnReservePct)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span>Damage reserve %</span>
          <span className="font-semibold">{formatPercent(result.pricing.damageReservePct)}</span>
        </div>
      </div>
    </section>
  );
}
