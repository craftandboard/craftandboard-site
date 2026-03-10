"use client";

import type { AmazonFeePresetItem } from "../lib/api";
import { getAmazonFeePresetSummary } from "../lib/cost-engine";

function textInputClass() {
  return "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40";
}

export function AmazonFeePresetEditor({
  presets,
  onCreate,
  onUpdate,
  busy
}: {
  presets: AmazonFeePresetItem[];
  onCreate: (formData: FormData) => void;
  onUpdate: (presetId: string, formData: FormData) => void;
  busy: boolean;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Amazon Fee Presets</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Marketplace cost assumptions</h3>
        <p className="mt-1 text-sm text-slate-300">
          Capture Amazon fee load as reusable presets instead of burying it in one-off calculator overrides.
        </p>
      </div>

      <form action={onCreate} className="mt-5 rounded-2xl border border-white/10 bg-slate-950/25 p-4">
        <p className="text-sm font-medium text-white">Create Amazon fee preset</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-sm text-slate-300">Preset name<input name="name" className={textInputClass()} placeholder="Amazon Standard Shelf" /></label>
          <label className="text-sm text-slate-300">Referral fee %<input name="referralFeePct" defaultValue="15" className={textInputClass()} /></label>
          <label className="text-sm text-slate-300">Closing fee cents<input name="closingFeeCents" defaultValue="0" className={textInputClass()} /></label>
          <label className="text-sm text-slate-300">Fulfillment fee cents<input name="fulfillmentFeeCents" defaultValue="0" className={textInputClass()} /></label>
          <label className="text-sm text-slate-300">Storage allowance cents<input name="storageAllowanceCents" defaultValue="0" className={textInputClass()} /></label>
          <label className="text-sm text-slate-300">Advertising allowance %<input name="advertisingAllowancePct" defaultValue="8" className={textInputClass()} /></label>
          <label className="text-sm text-slate-300">Advertising allowance cents<input name="advertisingAllowanceCents" defaultValue="0" className={textInputClass()} /></label>
          <label className="text-sm text-slate-300">Return reserve %<input name="returnReservePct" defaultValue="2" className={textInputClass()} /></label>
          <label className="text-sm text-slate-300">Damage reserve %<input name="damageReservePct" defaultValue="1" className={textInputClass()} /></label>
          <label className="text-sm text-slate-300">Misc marketplace %<input name="miscMarketplacePct" defaultValue="0" className={textInputClass()} /></label>
        </div>
        <button type="submit" disabled={busy} className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60">
          Add Amazon fee preset
        </button>
      </form>

      <div className="mt-4 space-y-3">
        {presets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-slate-300">
            No Amazon fee presets yet.
          </div>
        ) : (
          presets.map((preset) => (
            <form
              key={preset.id}
              action={(formData) => onUpdate(preset.id, formData)}
              className="rounded-2xl border border-white/10 bg-slate-950/25 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{preset.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{getAmazonFeePresetSummary(preset)}</p>
                </div>
                <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                  {preset.status}
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="text-sm text-slate-300">Referral fee %<input name="referralFeePct" defaultValue={preset.referralFeePct} className={textInputClass()} /></label>
                <label className="text-sm text-slate-300">Closing fee cents<input name="closingFeeCents" defaultValue={preset.closingFeeCents ?? 0} className={textInputClass()} /></label>
                <label className="text-sm text-slate-300">Fulfillment fee cents<input name="fulfillmentFeeCents" defaultValue={preset.fulfillmentFeeCents ?? 0} className={textInputClass()} /></label>
                <label className="text-sm text-slate-300">Storage allowance cents<input name="storageAllowanceCents" defaultValue={preset.storageAllowanceCents ?? 0} className={textInputClass()} /></label>
                <label className="text-sm text-slate-300">Advertising %<input name="advertisingAllowancePct" defaultValue={preset.advertisingAllowancePct ?? 0} className={textInputClass()} /></label>
                <label className="text-sm text-slate-300">Advertising cents<input name="advertisingAllowanceCents" defaultValue={preset.advertisingAllowanceCents ?? 0} className={textInputClass()} /></label>
                <label className="text-sm text-slate-300">Return reserve %<input name="returnReservePct" defaultValue={preset.returnReservePct ?? 0} className={textInputClass()} /></label>
                <label className="text-sm text-slate-300">Damage reserve %<input name="damageReservePct" defaultValue={preset.damageReservePct ?? 0} className={textInputClass()} /></label>
                <label className="text-sm text-slate-300">Misc marketplace %<input name="miscMarketplacePct" defaultValue={preset.miscMarketplacePct ?? 0} className={textInputClass()} /></label>
              </div>
              <button type="submit" disabled={busy} className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60">
                Update fee preset
              </button>
            </form>
          ))
        )}
      </div>
    </section>
  );
}
