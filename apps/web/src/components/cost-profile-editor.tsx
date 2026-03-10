"use client";

import type { CostProfileDetail } from "../lib/api";

function textInputClass() {
  return "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40";
}

export function CostProfileEditor({
  profile,
  onCreateProfile,
  onCreateMaterialRule,
  onCreateEdgeBandRule,
  onCreatePackagingRule,
  onCreateShippingRule,
  busy
}: {
  profile: CostProfileDetail | null;
  onCreateProfile: (form: FormData) => void;
  onCreateMaterialRule: (form: FormData) => void;
  onCreateEdgeBandRule: (form: FormData) => void;
  onCreatePackagingRule: (form: FormData) => void;
  onCreateShippingRule: (form: FormData) => void;
  busy: boolean;
}) {
  return (
    <section className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Profile Editor</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Assumption rules</h3>
        <p className="mt-1 text-sm text-slate-300">
          Keep Hugo’s numbers editable here instead of hardcoding them into formulas.
        </p>
      </div>

      <form
        action={onCreateProfile}
        className="rounded-2xl border border-white/10 bg-slate-950/25 p-4"
      >
        <p className="text-sm font-medium text-white">Create cost profile</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            Name
            <input name="name" className={textInputClass()} placeholder="Hugo Shelf Base" />
          </label>
          <label className="text-sm text-slate-300">
            Target margin %
            <input name="targetMarginPct" className={textInputClass()} defaultValue="20" />
          </label>
          <label className="text-sm text-slate-300">
            Growth margin %
            <input name="growthMarginPct" className={textInputClass()} defaultValue="10" />
          </label>
          <label className="text-sm text-slate-300">
            Labor rate cents/hr
            <input name="defaultLaborRateCentsPerHour" className={textInputClass()} defaultValue="4500" />
          </label>
          <label className="text-sm text-slate-300">
            Machine rate cents/hr
            <input name="defaultMachineRateCentsPerHour" className={textInputClass()} defaultValue="7200" />
          </label>
          <label className="text-sm text-slate-300">
            Overhead rate cents/hr
            <input name="defaultOverheadRateCentsPerHour" className={textInputClass()} defaultValue="1800" />
          </label>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 rounded-full border border-emerald-300/30 bg-emerald-300/15 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Create profile
        </button>
      </form>

      {profile ? (
        <>
          <form
            action={onCreateMaterialRule}
            className="rounded-2xl border border-white/10 bg-slate-950/25 p-4"
          >
            <p className="text-sm font-medium text-white">Add material rule</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                Material code
                <input name="materialCode" className={textInputClass()} placeholder="WHITE_MELAMINE_075" />
              </label>
              <label className="text-sm text-slate-300">
                Material name
                <input name="materialName" className={textInputClass()} placeholder='White Melamine 3/4"' />
              </label>
              <label className="text-sm text-slate-300">
                Sheet length in
                <input name="sheetLengthIn" className={textInputClass()} defaultValue="96" />
              </label>
              <label className="text-sm text-slate-300">
                Sheet width in
                <input name="sheetWidthIn" className={textInputClass()} defaultValue="48" />
              </label>
              <label className="text-sm text-slate-300">
                Sheet cost cents
                <input name="sheetCostCents" className={textInputClass()} defaultValue="6500" />
              </label>
              <label className="text-sm text-slate-300">
                Waste %
                <input name="wastePct" className={textInputClass()} defaultValue={String(profile.defaultMaterialWastePct)} />
              </label>
            </div>
            <button type="submit" disabled={busy} className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60">
              Add material rule
            </button>
          </form>

          <form
            action={onCreateEdgeBandRule}
            className="rounded-2xl border border-white/10 bg-slate-950/25 p-4"
          >
            <p className="text-sm font-medium text-white">Add edge band rule</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                Edge band code
                <input name="edgeBandCode" className={textInputClass()} placeholder="PVC_WHITE" />
              </label>
              <label className="text-sm text-slate-300">
                Edge band name
                <input name="edgeBandName" className={textInputClass()} placeholder="White PVC" />
              </label>
              <label className="text-sm text-slate-300">
                Cost cents / linear ft
                <input name="costCentsPerLinearFoot" className={textInputClass()} defaultValue="45" />
              </label>
              <label className="text-sm text-slate-300">
                Setup allowance linear ft
                <input name="setupAllowanceLinearFt" className={textInputClass()} defaultValue="1" />
              </label>
            </div>
            <button type="submit" disabled={busy} className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60">
              Add edge band rule
            </button>
          </form>

          <form
            action={onCreatePackagingRule}
            className="rounded-2xl border border-white/10 bg-slate-950/25 p-4"
          >
            <p className="text-sm font-medium text-white">Add packaging rule</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                Packaging code
                <input name="packagingCode" className={textInputClass()} placeholder="STANDARD" />
              </label>
              <label className="text-sm text-slate-300">
                Packaging name
                <input name="packagingName" className={textInputClass()} placeholder="Standard carton" />
              </label>
              <label className="text-sm text-slate-300">
                Box cost cents
                <input name="boxCostCents" className={textInputClass()} defaultValue="140" />
              </label>
              <label className="text-sm text-slate-300">
                Bubble wrap cents
                <input name="bubbleWrapCostCents" className={textInputClass()} defaultValue="55" />
              </label>
              <label className="text-sm text-slate-300">
                Tape cents
                <input name="tapeCostCents" className={textInputClass()} defaultValue="20" />
              </label>
              <label className="text-sm text-slate-300">
                Label cents
                <input name="labelCostCents" className={textInputClass()} defaultValue="10" />
              </label>
            </div>
            <button type="submit" disabled={busy} className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60">
              Add packaging rule
            </button>
          </form>

          <form
            action={onCreateShippingRule}
            className="rounded-2xl border border-white/10 bg-slate-950/25 p-4"
          >
            <p className="text-sm font-medium text-white">Add shipping rule</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                Shipping code
                <input name="shippingCode" className={textInputClass()} placeholder="GROUND" />
              </label>
              <label className="text-sm text-slate-300">
                Shipping name
                <input name="shippingName" className={textInputClass()} placeholder="Ground parcel" />
              </label>
              <label className="text-sm text-slate-300">
                Base cost cents
                <input name="baseCostCents" className={textInputClass()} defaultValue="1295" />
              </label>
              <label className="text-sm text-slate-300">
                Cost per cubic inch cents
                <input name="costPerCubicInchCents" className={textInputClass()} defaultValue="0" />
              </label>
            </div>
            <button type="submit" disabled={busy} className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60">
              Add shipping rule
            </button>
          </form>
        </>
      ) : null}
    </section>
  );
}
