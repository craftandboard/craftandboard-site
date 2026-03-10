"use client";

import type { CostComparisonResult } from "../lib/api";
import { formatMoney } from "../lib/cost-engine";

export function ListingPrepFieldCard({
  comparison
}: {
  comparison: CostComparisonResult | null;
}) {
  const exportSnapshot = (comparison?.selectedLaunchExportSnapshot ?? null) as
    | {
        marketplaceFieldSnapshot?: Record<string, unknown>;
      }
    | null;
  const fields = exportSnapshot?.marketplaceFieldSnapshot ?? null;

  if (!fields) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Marketplace-prep fields will appear here after listing readiness is evaluated for the selected launch scenario.
      </section>
    );
  }

  const pricingSummary = (fields.pricingSummary ?? {}) as Record<string, unknown>;
  const completeness = (fields.completenessFlags ?? {}) as Record<string, unknown>;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Marketplace Prep</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Internal listing field package</h3>
      <div className="mt-5 grid gap-3 md:grid-cols-2 text-sm text-slate-200">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Product</p>
          <p className="mt-2 text-white">{String(fields.productLabel ?? "Not set")}</p>
          <p className="mt-1 text-xs text-slate-400">SKU {String(fields.sku ?? "Missing")}</p>
          <p className="mt-1 text-xs text-slate-400">{String(fields.dimensionSummary ?? "No dimensions")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Material / fulfillment</p>
          <p className="mt-2 text-white">{String(fields.materialSummary ?? "Unknown material")}</p>
          <p className="mt-1 text-xs text-slate-400">Edge {String(fields.edgeBandSummary ?? "Unknown")}</p>
          <p className="mt-1 text-xs text-slate-400">
            {String(fields.packagingSummary ?? "No packaging")} · {String(fields.shippingSummary ?? "No shipping")}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Preset labels</p>
          <p className="mt-2 text-white">{String(fields.feePresetLabel ?? "Default fee preset")}</p>
          <p className="mt-1 text-xs text-slate-400">{String(fields.shippingZoneLabel ?? "Base shipping zone")}</p>
          <p className="mt-1 text-xs text-slate-400">{String(fields.launchStrategyLabel ?? "BALANCED")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prep completeness</p>
          <div className="mt-2 space-y-1 text-xs text-slate-300">
            {Object.entries(completeness).map(([key, value]) => (
              <p key={key}>
                {String(key)}: <span className="font-semibold text-white">{value ? "Ready" : "Missing"}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pricing summary</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <p>Break-even: <span className="font-semibold text-white">{formatMoney(Number(pricingSummary.breakEvenPriceCents ?? 0))}</span></p>
          <p>Minimum: <span className="font-semibold text-white">{formatMoney(Number(pricingSummary.minimumSellPriceCents ?? 0))}</span></p>
          <p>Safer margin: <span className="font-semibold text-white">{formatMoney(Number(pricingSummary.saferMarginPriceCents ?? 0))}</span></p>
          <p>Launch: <span className="font-semibold text-white">{formatMoney(Number(pricingSummary.recommendedLaunchPriceCents ?? 0))}</span></p>
        </div>
      </div>
    </section>
  );
}
