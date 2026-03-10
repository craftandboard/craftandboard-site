"use client";

import type { ShelfCostCalculationRecord } from "../lib/api";
import { formatCostLabel, formatMoney } from "../lib/cost-engine";

export function CostHistoryList({
  calculations,
  onSelect
}: {
  calculations: ShelfCostCalculationRecord[];
  onSelect: (calculation: ShelfCostCalculationRecord) => void;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Recent Calculations</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Saved shelf cost history</h3>
        </div>
      </div>

      {calculations.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-slate-300">
          No calculations saved yet. Run a shelf cost and save it to build Hugo’s reference library.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {calculations.slice(0, 10).map((calculation) => (
            <button
              key={calculation.id}
              type="button"
              onClick={() => onSelect(calculation)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-4 text-left transition hover:border-emerald-300/30 hover:bg-slate-950/45"
            >
              <div>
                <p className="font-medium text-white">{calculation.name || "Untitled shelf calculation"}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {calculation.quantity} qty · {calculation.lengthIn}&quot; x {calculation.depthIn}&quot; ·{" "}
                  {formatCostLabel(calculation.materialCode)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {calculation.amazonFeePresetName || "Profile fee defaults"} ·{" "}
                  {calculation.shippingZoneRuleName || "Base shipping"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Saved {new Date(calculation.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sell price</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {formatMoney(calculation.recommendedSellPriceCents)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Cost {formatMoney(calculation.subtotalCostCents)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Break-even {formatMoney(calculation.breakEvenPriceCents)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
