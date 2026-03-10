"use client";

import type { CostProfileDetail } from "../lib/api";
import {
  formatCostLabel,
  formatMoney,
  formatPercent,
  getAmazonFeePresetSummary,
  getPackagingRuleSummary,
  getShippingRuleSummary,
  getShippingZoneRuleSummary
} from "../lib/cost-engine";

export function CostAssumptionsPanel({ profile }: { profile: CostProfileDetail | null }) {
  if (!profile) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Create or choose a cost profile to see the assumptions that drive Hugo’s shelf pricing.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Assumptions</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{profile.name}</h3>
          <p className="mt-1 text-sm text-slate-300">
            {profile.materialRules.length} material rules · {profile.edgeBandRules.length} edge band rules ·{" "}
            {profile.packagingRules.length} packaging rules · {profile.shippingRules.length} shipping rules ·{" "}
            {profile.amazonFeePresets.length} fee presets · {profile.shippingZoneRules.length} zone rules
          </p>
        </div>
        <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
          {profile.status}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Default Shop Rates</p>
          <p className="mt-2 text-sm text-slate-200">
            Labor: <span className="font-semibold">{formatMoney(profile.defaultLaborRateCentsPerHour)}</span> / hr
          </p>
          <p className="mt-1 text-sm text-slate-200">
            Machine: <span className="font-semibold">{formatMoney(profile.defaultMachineRateCentsPerHour)}</span> / hr
          </p>
          <p className="mt-1 text-sm text-slate-200">
            Overhead:{" "}
            <span className="font-semibold">{formatMoney(profile.defaultOverheadRateCentsPerHour ?? 0)}</span> / hr
          </p>
          <p className="mt-1 text-sm text-slate-200">
            Packing labor:{" "}
            <span className="font-semibold">{formatMoney(profile.defaultPackingLaborRateCentsPerHour ?? 0)}</span> / hr
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Default Margins / Waste</p>
          <p className="mt-2 text-sm text-slate-200">
            Material waste: <span className="font-semibold">{formatPercent(profile.defaultMaterialWastePct)}</span>
          </p>
          <p className="mt-1 text-sm text-slate-200">
            Edge band waste: <span className="font-semibold">{formatPercent(profile.defaultEdgeBandWastePct)}</span>
          </p>
          <p className="mt-1 text-sm text-slate-200">
            Target margin: <span className="font-semibold">{formatPercent(profile.targetMarginPct)}</span>
          </p>
          <p className="mt-1 text-sm text-slate-200">
            Growth margin: <span className="font-semibold">{formatPercent(profile.growthMarginPct)}</span>
          </p>
          <p className="mt-1 text-sm text-slate-200">
            Marketplace fee:{" "}
            <span className="font-semibold">{formatPercent(profile.defaultMarketplaceFeePct)}</span>
          </p>
          <p className="mt-1 text-sm text-slate-200">
            Return reserve:{" "}
            <span className="font-semibold">{formatPercent(profile.defaultReturnReservePct)}</span>
          </p>
          <p className="mt-1 text-sm text-slate-200">
            Damage reserve:{" "}
            <span className="font-semibold">{formatPercent(profile.defaultDamageReservePct)}</span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Materials</p>
          <div className="mt-3 space-y-3 text-sm text-slate-200">
            {profile.materialRules.length === 0 ? (
              <p className="text-slate-400">No material rules yet.</p>
            ) : (
              profile.materialRules.map((rule) => (
                <div key={rule.id} className="rounded-xl border border-white/10 px-3 py-3">
                  <p className="font-medium text-white">{rule.materialName}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatCostLabel(rule.materialCode)} · {rule.sheetLengthIn}&quot; x {rule.sheetWidthIn}&quot;
                  </p>
                  <p className="mt-1">{formatMoney(rule.sheetCostCents)} per sheet</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Packaging / Shipping</p>
          <div className="mt-3 space-y-3 text-sm text-slate-200">
            {profile.packagingRules.slice(0, 2).map((rule) => (
              <div key={rule.id} className="rounded-xl border border-white/10 px-3 py-3">
                <p className="font-medium text-white">{rule.packagingName}</p>
                <p className="mt-1 text-xs text-slate-400">{formatCostLabel(rule.packagingCode)}</p>
                <p className="mt-1 text-xs text-slate-300">{getPackagingRuleSummary(rule)}</p>
              </div>
            ))}
            {profile.shippingRules.slice(0, 2).map((rule) => (
              <div key={rule.id} className="rounded-xl border border-white/10 px-3 py-3">
                <p className="font-medium text-white">{rule.shippingName}</p>
                <p className="mt-1 text-xs text-slate-400">{formatCostLabel(rule.shippingCode)}</p>
                <p className="mt-1 text-xs text-slate-300">{getShippingRuleSummary(rule)}</p>
              </div>
            ))}
            {profile.packagingRules.length === 0 && profile.shippingRules.length === 0 ? (
              <p className="text-slate-400">No packaging or shipping rules yet.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Amazon Fees / Zones</p>
          <div className="mt-3 space-y-3 text-sm text-slate-200">
            {profile.amazonFeePresets.slice(0, 2).map((preset) => (
              <div key={preset.id} className="rounded-xl border border-white/10 px-3 py-3">
                <p className="font-medium text-white">{preset.name}</p>
                <p className="mt-1 text-xs text-slate-300">{getAmazonFeePresetSummary(preset)}</p>
              </div>
            ))}
            {profile.shippingZoneRules.slice(0, 2).map((rule) => (
              <div key={rule.id} className="rounded-xl border border-white/10 px-3 py-3">
                <p className="font-medium text-white">{rule.name}</p>
                <p className="mt-1 text-xs text-slate-300">{getShippingZoneRuleSummary(rule)}</p>
              </div>
            ))}
            {profile.amazonFeePresets.length === 0 && profile.shippingZoneRules.length === 0 ? (
              <p className="text-slate-400">No Amazon fee presets or shipping zone rules yet.</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
