"use client";

import type { CostComparisonResult } from "../lib/api";
import { formatMoney } from "../lib/cost-engine";

export function LaunchCandidateHandoffCard({
  comparison
}: {
  comparison: CostComparisonResult | null;
}) {
  const handoff = comparison?.selectedLaunchSummary ?? null;

  if (!handoff) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Select a launch candidate after ranking and guardrail evaluation to generate the listing handoff summary.
      </section>
    );
  }

  const pricing = (handoff.pricing ?? {}) as Record<string, unknown>;
  const shelfSpec = (handoff.shelfSpec ?? {}) as Record<string, unknown>;
  const burdens = (handoff.burdens ?? {}) as Record<string, unknown>;
  const risk = (handoff.risk ?? {}) as Record<string, unknown>;

  return (
    <section className="rounded-[1.75rem] border border-emerald-400/20 bg-emerald-400/10 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Launch Handoff</p>
      <h3 className="mt-2 text-xl font-semibold text-white">{String(handoff.scenarioName ?? "Selected launch candidate")}</h3>
      <p className="mt-2 text-sm text-emerald-50/90">
        {typeof risk.summary === "string"
          ? risk.summary
          : "Use this summary as the pricing handoff into the next listing-focused phase."}
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Launch price</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatMoney(Number(pricing.launchPriceCents ?? 0))}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Floor price</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatMoney(Number(pricing.minimumSellPriceCents ?? 0))}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Break-even</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatMoney(Number(pricing.breakEvenPriceCents ?? 0))}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-emerald-50/90">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Shelf identity</p>
          <p className="mt-2 text-white">
            {String(shelfSpec.name ?? "Shelf")} · {String(shelfSpec.lengthIn ?? "?")} × {String(shelfSpec.depthIn ?? "?")} in
          </p>
          <p className="mt-1 text-xs text-emerald-50/70">
            Material {String(shelfSpec.materialCode ?? "Unknown")} · Edge {String(shelfSpec.edgeBandPattern ?? "Unknown")}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Assumption bundle</p>
          <p className="mt-2 text-white">
            Fee preset {String(handoff.amazonFeePresetName ?? "Default")} · Zone {String(handoff.shippingZoneRuleName ?? "Base")}
          </p>
          <p className="mt-1 text-xs text-emerald-50/70">
            Packaging {String(handoff.packagingRuleName ?? "Default")} · Shipping {String(handoff.shippingRuleName ?? "Default")}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-emerald-50/90">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Key burdens</p>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <p>Marketplace fees: <span className="font-semibold text-white">{formatMoney(Number(burdens.marketplaceFeeCostCents ?? 0))}</span></p>
          <p>Shipping: <span className="font-semibold text-white">{formatMoney(Number(burdens.shippingCostCents ?? 0))}</span></p>
          <p>Reserves: <span className="font-semibold text-white">{formatMoney(Number(burdens.reserveCostCents ?? 0))}</span></p>
        </div>
      </div>
    </section>
  );
}
