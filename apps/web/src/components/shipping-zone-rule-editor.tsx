"use client";

import type { ShippingZoneRuleItem } from "../lib/api";
import { getShippingZoneRuleSummary } from "../lib/cost-engine";

function textInputClass() {
  return "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40";
}

export function ShippingZoneRuleEditor({
  rules,
  onCreate,
  onUpdate,
  busy
}: {
  rules: ShippingZoneRuleItem[];
  onCreate: (formData: FormData) => void;
  onUpdate: (ruleId: string, formData: FormData) => void;
  busy: boolean;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Shipping Zones</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Zone-aware ship cases</h3>
        <p className="mt-1 text-sm text-slate-300">
          Compare launch pricing against cheaper and more expensive shipping outcomes without calling carrier APIs.
        </p>
      </div>

      <form action={onCreate} className="mt-5 rounded-2xl border border-white/10 bg-slate-950/25 p-4">
        <p className="text-sm font-medium text-white">Create shipping zone rule</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-sm text-slate-300">Name<input name="name" className={textInputClass()} placeholder="Zone 2 Near" /></label>
          <label className="text-sm text-slate-300">Zone code<input name="zoneCode" className={textInputClass()} placeholder="Z2" /></label>
          <label className="text-sm text-slate-300">Base cost cents<input name="baseCostCents" defaultValue="800" className={textInputClass()} /></label>
          <label className="text-sm text-slate-300">Weight adder cents/lb<input name="weightAdderCents" defaultValue="0" className={textInputClass()} /></label>
          <label className="text-sm text-slate-300">Dimensional adder cents/lb<input name="dimensionalAdderCents" defaultValue="0" className={textInputClass()} /></label>
          <label className="text-sm text-slate-300">Buffer %<input name="bufferPct" defaultValue="5" className={textInputClass()} /></label>
          <label className="text-sm text-slate-300">Buffer cents<input name="bufferCents" defaultValue="0" className={textInputClass()} /></label>
          <label className="text-sm text-slate-300">Marketplace handling cents<input name="marketplaceHandlingCents" defaultValue="0" className={textInputClass()} /></label>
        </div>
        <button type="submit" disabled={busy} className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60">
          Add shipping zone rule
        </button>
      </form>

      <div className="mt-4 space-y-3">
        {rules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-slate-300">
            No shipping zone rules yet.
          </div>
        ) : (
          rules.map((rule) => (
            <form
              key={rule.id}
              action={(formData) => onUpdate(rule.id, formData)}
              className="rounded-2xl border border-white/10 bg-slate-950/25 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{rule.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{getShippingZoneRuleSummary(rule)}</p>
                </div>
                <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                  {rule.status}
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="text-sm text-slate-300">Base cost cents<input name="baseCostCents" defaultValue={rule.baseCostCents} className={textInputClass()} /></label>
                <label className="text-sm text-slate-300">Weight adder cents/lb<input name="weightAdderCents" defaultValue={rule.weightAdderCents ?? 0} className={textInputClass()} /></label>
                <label className="text-sm text-slate-300">Dimensional adder cents/lb<input name="dimensionalAdderCents" defaultValue={rule.dimensionalAdderCents ?? 0} className={textInputClass()} /></label>
                <label className="text-sm text-slate-300">Buffer %<input name="bufferPct" defaultValue={rule.bufferPct ?? 0} className={textInputClass()} /></label>
                <label className="text-sm text-slate-300">Buffer cents<input name="bufferCents" defaultValue={rule.bufferCents ?? 0} className={textInputClass()} /></label>
                <label className="text-sm text-slate-300">Marketplace handling cents<input name="marketplaceHandlingCents" defaultValue={rule.marketplaceHandlingCents ?? 0} className={textInputClass()} /></label>
              </div>
              <button type="submit" disabled={busy} className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60">
                Update shipping zone rule
              </button>
            </form>
          ))
        )}
      </div>
    </section>
  );
}
