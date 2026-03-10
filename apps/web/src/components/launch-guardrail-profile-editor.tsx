"use client";

import type { LaunchGuardrailProfileItem } from "../lib/api";
import { formatPercent } from "../lib/cost-engine";

function fieldClass() {
  return "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-white";
}

export function LaunchGuardrailProfileEditor({
  profiles,
  onCreate,
  onUpdate
}: {
  profiles: LaunchGuardrailProfileItem[];
  onCreate: (formData: FormData) => void;
  onUpdate: (guardrailProfileId: string, formData: FormData) => void;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Launch Guardrails</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Protect launch pricing from fragile scenarios</h3>
      <p className="mt-1 text-sm text-slate-300">
        Define plain-language thresholds for margin, fee burden, shipping burden, and floor-price safety.
      </p>

      <form action={onCreate} className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/25 p-4 md:grid-cols-3">
        <label className="text-sm text-slate-300">Profile name<input name="name" required className={fieldClass()} placeholder="Balanced Amazon guardrails" /></label>
        <label className="text-sm text-slate-300">Minimum margin %<input name="minimumMarginPct" type="number" step="0.1" defaultValue="20" className={fieldClass()} /></label>
        <label className="text-sm text-slate-300">Min buffer above break-even %<input name="minimumBufferAboveBreakEvenPct" type="number" step="0.1" defaultValue="10" className={fieldClass()} /></label>
        <label className="text-sm text-slate-300">Max fee burden %<input name="maximumFeeBurdenPct" type="number" step="0.1" defaultValue="28" className={fieldClass()} /></label>
        <label className="text-sm text-slate-300">Max shipping burden %<input name="maximumShippingBurdenPct" type="number" step="0.1" defaultValue="18" className={fieldClass()} /></label>
        <label className="text-sm text-slate-300">Max reserve burden %<input name="maximumReserveBurdenPct" type="number" step="0.1" defaultValue="8" className={fieldClass()} /></label>
        <label className="text-sm text-slate-300">Max target-to-floor gap %<input name="maximumAllowedTargetToFloorGapPct" type="number" step="0.1" defaultValue="20" className={fieldClass()} /></label>
        <label className="text-sm text-slate-300">Status<select name="status" className={fieldClass()} defaultValue="ACTIVE"><option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option></select></label>
        <label className="text-sm text-slate-300 md:col-span-2">Notes<input name="notes" className={fieldClass()} placeholder="Use for safer-margin launch reviews." /></label>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">
            Add guardrail profile
          </button>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {profiles.length ? (
          profiles.map((profile) => (
            <form
              key={profile.id}
              action={(formData) => onUpdate(profile.id, formData)}
              className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/25 p-4 md:grid-cols-3"
            >
              <label className="text-sm text-slate-300">Profile name<input name="name" defaultValue={profile.name} className={fieldClass()} /></label>
              <label className="text-sm text-slate-300">Minimum margin %<input name="minimumMarginPct" type="number" step="0.1" defaultValue={profile.minimumMarginPct} className={fieldClass()} /></label>
              <label className="text-sm text-slate-300">Min buffer %<input name="minimumBufferAboveBreakEvenPct" type="number" step="0.1" defaultValue={profile.minimumBufferAboveBreakEvenPct ?? ""} className={fieldClass()} /></label>
              <label className="text-sm text-slate-300">Max fee burden %<input name="maximumFeeBurdenPct" type="number" step="0.1" defaultValue={profile.maximumFeeBurdenPct ?? ""} className={fieldClass()} /></label>
              <label className="text-sm text-slate-300">Max shipping burden %<input name="maximumShippingBurdenPct" type="number" step="0.1" defaultValue={profile.maximumShippingBurdenPct ?? ""} className={fieldClass()} /></label>
              <label className="text-sm text-slate-300">Max reserve burden %<input name="maximumReserveBurdenPct" type="number" step="0.1" defaultValue={profile.maximumReserveBurdenPct ?? ""} className={fieldClass()} /></label>
              <label className="text-sm text-slate-300">Max target/floor gap %<input name="maximumAllowedTargetToFloorGapPct" type="number" step="0.1" defaultValue={profile.maximumAllowedTargetToFloorGapPct ?? ""} className={fieldClass()} /></label>
              <label className="text-sm text-slate-300">Status<select name="status" defaultValue={profile.status} className={fieldClass()}><option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option></select></label>
              <label className="text-sm text-slate-300 md:col-span-2">Notes<input name="notes" defaultValue={profile.notes ?? ""} className={fieldClass()} /></label>
              <div className="flex items-end justify-between gap-3">
                <div className="text-xs text-slate-400">
                  Margin {formatPercent(profile.minimumMarginPct)} · Fee {formatPercent(profile.maximumFeeBurdenPct)}
                </div>
                <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">
                  Update guardrails
                </button>
              </div>
            </form>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/20 p-4 text-sm text-slate-300">
            No guardrail profiles yet. Add one before selecting a launch candidate so the ranking can be checked for margin and fee safety.
          </div>
        )}
      </div>
    </section>
  );
}
