"use client";

import type { CostProfileDetail, PackagingCostRuleItem, ShippingCostRuleItem } from "../lib/api";
import { formatMoney, formatPercent } from "../lib/cost-engine";

function textInputClass() {
  return "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40";
}

function actionButtonClass() {
  return "mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60";
}

function PackagingRuleEditor({
  rule,
  onUpdate,
  busy
}: {
  rule: PackagingCostRuleItem;
  onUpdate: (ruleId: string, form: FormData) => void;
  busy: boolean;
}) {
  return (
    <form
      action={(formData) => onUpdate(rule.id, formData)}
      className="rounded-2xl border border-white/10 bg-slate-950/25 p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">{rule.packagingName}</p>
          <p className="mt-1 text-xs text-slate-400">{rule.packagingCode}</p>
        </div>
        <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
          {rule.active ? "Active" : "Inactive"}
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="text-sm text-slate-300">Box<input name="boxCostCents" defaultValue={rule.boxCostCents ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Bubble<input name="bubbleWrapCostCents" defaultValue={rule.bubbleWrapCostCents ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Foam<input name="foamCostCents" defaultValue={rule.foamCostCents ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Corner protectors<input name="cornerProtectorCostCents" defaultValue={rule.cornerProtectorCostCents ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Tape<input name="tapeCostCents" defaultValue={rule.tapeCostCents ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Label<input name="labelCostCents" defaultValue={rule.labelCostCents ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Insert<input name="insertFlyerCostCents" defaultValue={rule.insertFlyerCostCents ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Shrink wrap<input name="shrinkWrapCostCents" defaultValue={rule.shrinkWrapCostCents ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Other<input name="otherPackagingCostCents" defaultValue={rule.otherPackagingCostCents ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Packing minutes<input name="packingMinutes" defaultValue={rule.packingMinutes ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Packing labor override<input name="packingLaborOverrideCents" defaultValue={rule.packingLaborOverrideCents ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Packaging overhead<input name="packagingOverheadCents" defaultValue={rule.packagingOverheadCents ?? 0} className={textInputClass()} /></label>
      </div>

      <button type="submit" disabled={busy} className={actionButtonClass()}>
        Update packaging rule
      </button>
    </form>
  );
}

function ShippingRuleEditor({
  rule,
  onUpdate,
  busy
}: {
  rule: ShippingCostRuleItem;
  onUpdate: (ruleId: string, form: FormData) => void;
  busy: boolean;
}) {
  return (
    <form
      action={(formData) => onUpdate(rule.id, formData)}
      className="rounded-2xl border border-white/10 bg-slate-950/25 p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">{rule.shippingName}</p>
          <p className="mt-1 text-xs text-slate-400">{rule.shippingCode}</p>
        </div>
        <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
          {rule.active ? "Active" : "Inactive"}
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="text-sm text-slate-300">Base cost<input name="baseCostCents" defaultValue={rule.baseCostCents} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Per pound<input name="costPerPoundCents" defaultValue={rule.costPerPoundCents ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Per cubic inch<input name="costPerCubicInchCents" defaultValue={rule.costPerCubicInchCents ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Dimensional divisor<input name="dimensionalDivisor" defaultValue={rule.dimensionalDivisor ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Dimensional rate<input name="dimensionalRateCents" defaultValue={rule.dimensionalRateCents ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Shipping buffer %<input name="shippingBufferPct" defaultValue={rule.shippingBufferPct ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Shipping buffer cents<input name="shippingBufferCents" defaultValue={rule.shippingBufferCents ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Marketplace handling<input name="marketplaceHandlingCents" defaultValue={rule.marketplaceHandlingCents ?? 0} className={textInputClass()} /></label>
        <label className="text-sm text-slate-300">Flat override<input name="flatOverride" defaultValue={rule.flatOverride ?? 0} className={textInputClass()} /></label>
      </div>

      <button type="submit" disabled={busy} className={actionButtonClass()}>
        Update shipping rule
      </button>
    </form>
  );
}

export function CostProfileEditor({
  profile,
  onCreateProfile,
  onUpdateProfile,
  onCreateMaterialRule,
  onCreateEdgeBandRule,
  onCreatePackagingRule,
  onUpdatePackagingRule,
  onCreateShippingRule,
  onUpdateShippingRule,
  busy
}: {
  profile: CostProfileDetail | null;
  onCreateProfile: (form: FormData) => void;
  onUpdateProfile: (form: FormData) => void;
  onCreateMaterialRule: (form: FormData) => void;
  onCreateEdgeBandRule: (form: FormData) => void;
  onCreatePackagingRule: (form: FormData) => void;
  onUpdatePackagingRule: (ruleId: string, form: FormData) => void;
  onCreateShippingRule: (form: FormData) => void;
  onUpdateShippingRule: (ruleId: string, form: FormData) => void;
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

      <form action={onCreateProfile} className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
        <p className="text-sm font-medium text-white">Create cost profile</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-300">Name<input name="name" className={textInputClass()} placeholder="Hugo Shelf Base" /></label>
          <label className="text-sm text-slate-300">Target margin %<input name="targetMarginPct" className={textInputClass()} defaultValue="20" /></label>
          <label className="text-sm text-slate-300">Growth margin %<input name="growthMarginPct" className={textInputClass()} defaultValue="10" /></label>
          <label className="text-sm text-slate-300">Minimum sell margin %<input name="defaultRecommendedMinMarginPct" className={textInputClass()} defaultValue="10" /></label>
          <label className="text-sm text-slate-300">Target sell margin %<input name="defaultRecommendedTargetMarginPct" className={textInputClass()} defaultValue="20" /></label>
          <label className="text-sm text-slate-300">Labor rate cents/hr<input name="defaultLaborRateCentsPerHour" className={textInputClass()} defaultValue="4500" /></label>
          <label className="text-sm text-slate-300">Machine rate cents/hr<input name="defaultMachineRateCentsPerHour" className={textInputClass()} defaultValue="7200" /></label>
          <label className="text-sm text-slate-300">Overhead rate cents/hr<input name="defaultOverheadRateCentsPerHour" className={textInputClass()} defaultValue="1800" /></label>
          <label className="text-sm text-slate-300">Packing labor rate cents/hr<input name="defaultPackingLaborRateCentsPerHour" className={textInputClass()} defaultValue="4200" /></label>
          <label className="text-sm text-slate-300">Default packing minutes<input name="defaultPackingMinutes" className={textInputClass()} defaultValue="6" /></label>
          <label className="text-sm text-slate-300">Marketplace fee %<input name="defaultMarketplaceFeePct" className={textInputClass()} defaultValue="15" /></label>
          <label className="text-sm text-slate-300">Return reserve %<input name="defaultReturnReservePct" className={textInputClass()} defaultValue="2" /></label>
          <label className="text-sm text-slate-300">Damage reserve %<input name="defaultDamageReservePct" className={textInputClass()} defaultValue="1" /></label>
          <label className="text-sm text-slate-300">Shipping buffer %<input name="defaultShippingBufferPct" className={textInputClass()} defaultValue="5" /></label>
          <label className="text-sm text-slate-300">Shipping buffer cents<input name="defaultShippingBufferCents" className={textInputClass()} defaultValue="0" /></label>
          <label className="text-sm text-slate-300">Packaging overhead cents<input name="defaultPackagingOverheadCents" className={textInputClass()} defaultValue="0" /></label>
        </div>
        <button type="submit" disabled={busy} className="mt-4 rounded-full border border-emerald-300/30 bg-emerald-300/15 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          Create profile
        </button>
      </form>

      {profile ? (
        <>
          <form action={onUpdateProfile} className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="text-sm font-medium text-white">Update active profile defaults</p>
            <p className="mt-1 text-xs text-emerald-100">
              {profile.name} · Target {formatPercent(profile.targetMarginPct)} · Marketplace fee {formatPercent(profile.defaultMarketplaceFeePct)}
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <label className="text-sm text-slate-100">Target margin %<input name="targetMarginPct" defaultValue={profile.targetMarginPct ?? ""} className={textInputClass()} /></label>
              <label className="text-sm text-slate-100">Growth margin %<input name="growthMarginPct" defaultValue={profile.growthMarginPct ?? ""} className={textInputClass()} /></label>
              <label className="text-sm text-slate-100">Minimum sell margin %<input name="defaultRecommendedMinMarginPct" defaultValue={profile.defaultRecommendedMinMarginPct ?? ""} className={textInputClass()} /></label>
              <label className="text-sm text-slate-100">Target sell margin %<input name="defaultRecommendedTargetMarginPct" defaultValue={profile.defaultRecommendedTargetMarginPct ?? ""} className={textInputClass()} /></label>
              <label className="text-sm text-slate-100">Packing labor cents/hr<input name="defaultPackingLaborRateCentsPerHour" defaultValue={profile.defaultPackingLaborRateCentsPerHour ?? ""} className={textInputClass()} /></label>
              <label className="text-sm text-slate-100">Default packing minutes<input name="defaultPackingMinutes" defaultValue={profile.defaultPackingMinutes ?? ""} className={textInputClass()} /></label>
              <label className="text-sm text-slate-100">Marketplace fee %<input name="defaultMarketplaceFeePct" defaultValue={profile.defaultMarketplaceFeePct ?? ""} className={textInputClass()} /></label>
              <label className="text-sm text-slate-100">Return reserve %<input name="defaultReturnReservePct" defaultValue={profile.defaultReturnReservePct ?? ""} className={textInputClass()} /></label>
              <label className="text-sm text-slate-100">Damage reserve %<input name="defaultDamageReservePct" defaultValue={profile.defaultDamageReservePct ?? ""} className={textInputClass()} /></label>
              <label className="text-sm text-slate-100">Shipping buffer %<input name="defaultShippingBufferPct" defaultValue={profile.defaultShippingBufferPct ?? ""} className={textInputClass()} /></label>
              <label className="text-sm text-slate-100">Shipping buffer cents<input name="defaultShippingBufferCents" defaultValue={profile.defaultShippingBufferCents ?? ""} className={textInputClass()} /></label>
              <label className="text-sm text-slate-100">Packaging overhead cents<input name="defaultPackagingOverheadCents" defaultValue={profile.defaultPackagingOverheadCents ?? ""} className={textInputClass()} /></label>
            </div>
            <button type="submit" disabled={busy} className={actionButtonClass()}>
              Save profile defaults
            </button>
          </form>

          <form action={onCreateMaterialRule} className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
            <p className="text-sm font-medium text-white">Add material rule</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-300">Material code<input name="materialCode" className={textInputClass()} placeholder="WHITE_MELAMINE_075" /></label>
              <label className="text-sm text-slate-300">Material name<input name="materialName" className={textInputClass()} placeholder='White Melamine 3/4"' /></label>
              <label className="text-sm text-slate-300">Sheet length in<input name="sheetLengthIn" className={textInputClass()} defaultValue="96" /></label>
              <label className="text-sm text-slate-300">Sheet width in<input name="sheetWidthIn" className={textInputClass()} defaultValue="48" /></label>
              <label className="text-sm text-slate-300">Sheet cost cents<input name="sheetCostCents" className={textInputClass()} defaultValue="6500" /></label>
              <label className="text-sm text-slate-300">Waste %<input name="wastePct" className={textInputClass()} defaultValue={String(profile.defaultMaterialWastePct)} /></label>
            </div>
            <button type="submit" disabled={busy} className={actionButtonClass()}>Add material rule</button>
          </form>

          <form action={onCreateEdgeBandRule} className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
            <p className="text-sm font-medium text-white">Add edge band rule</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-300">Edge band code<input name="edgeBandCode" className={textInputClass()} placeholder="PVC_WHITE" /></label>
              <label className="text-sm text-slate-300">Edge band name<input name="edgeBandName" className={textInputClass()} placeholder="White PVC" /></label>
              <label className="text-sm text-slate-300">Cost cents / linear ft<input name="costCentsPerLinearFoot" className={textInputClass()} defaultValue="45" /></label>
              <label className="text-sm text-slate-300">Setup allowance linear ft<input name="setupAllowanceLinearFt" className={textInputClass()} defaultValue="1" /></label>
            </div>
            <button type="submit" disabled={busy} className={actionButtonClass()}>Add edge band rule</button>
          </form>

          <form action={onCreatePackagingRule} className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
            <p className="text-sm font-medium text-white">Add packaging rule</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <label className="text-sm text-slate-300">Packaging code<input name="packagingCode" className={textInputClass()} placeholder="STANDARD" /></label>
              <label className="text-sm text-slate-300">Packaging name<input name="packagingName" className={textInputClass()} placeholder="Standard carton" /></label>
              <label className="text-sm text-slate-300">Box cost cents<input name="boxCostCents" className={textInputClass()} defaultValue="140" /></label>
              <label className="text-sm text-slate-300">Bubble wrap cents<input name="bubbleWrapCostCents" className={textInputClass()} defaultValue="55" /></label>
              <label className="text-sm text-slate-300">Foam cents<input name="foamCostCents" className={textInputClass()} defaultValue="0" /></label>
              <label className="text-sm text-slate-300">Corner protectors cents<input name="cornerProtectorCostCents" className={textInputClass()} defaultValue="0" /></label>
              <label className="text-sm text-slate-300">Tape cents<input name="tapeCostCents" className={textInputClass()} defaultValue="20" /></label>
              <label className="text-sm text-slate-300">Label cents<input name="labelCostCents" className={textInputClass()} defaultValue="10" /></label>
              <label className="text-sm text-slate-300">Packing minutes<input name="packingMinutes" className={textInputClass()} defaultValue={profile.defaultPackingMinutes ?? 6} /></label>
              <label className="text-sm text-slate-300">Packaging overhead cents<input name="packagingOverheadCents" className={textInputClass()} defaultValue={profile.defaultPackagingOverheadCents ?? 0} /></label>
            </div>
            <button type="submit" disabled={busy} className={actionButtonClass()}>Add packaging rule</button>
          </form>

          {profile.packagingRules.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active packaging rules</p>
              {profile.packagingRules.map((rule) => (
                <PackagingRuleEditor key={rule.id} rule={rule} onUpdate={onUpdatePackagingRule} busy={busy} />
              ))}
            </div>
          ) : null}

          <form action={onCreateShippingRule} className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
            <p className="text-sm font-medium text-white">Add shipping rule</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <label className="text-sm text-slate-300">Shipping code<input name="shippingCode" className={textInputClass()} placeholder="GROUND" /></label>
              <label className="text-sm text-slate-300">Shipping name<input name="shippingName" className={textInputClass()} placeholder="Ground parcel" /></label>
              <label className="text-sm text-slate-300">Base cost cents<input name="baseCostCents" className={textInputClass()} defaultValue="1295" /></label>
              <label className="text-sm text-slate-300">Per pound cents<input name="costPerPoundCents" className={textInputClass()} defaultValue="0" /></label>
              <label className="text-sm text-slate-300">Per cubic inch cents<input name="costPerCubicInchCents" className={textInputClass()} defaultValue="0" /></label>
              <label className="text-sm text-slate-300">Dimensional divisor<input name="dimensionalDivisor" className={textInputClass()} defaultValue="139" /></label>
              <label className="text-sm text-slate-300">Dimensional rate cents<input name="dimensionalRateCents" className={textInputClass()} defaultValue="0" /></label>
              <label className="text-sm text-slate-300">Shipping buffer %<input name="shippingBufferPct" className={textInputClass()} defaultValue={profile.defaultShippingBufferPct ?? 5} /></label>
              <label className="text-sm text-slate-300">Shipping buffer cents<input name="shippingBufferCents" className={textInputClass()} defaultValue={profile.defaultShippingBufferCents ?? 0} /></label>
              <label className="text-sm text-slate-300">Marketplace handling cents<input name="marketplaceHandlingCents" className={textInputClass()} defaultValue="0" /></label>
            </div>
            <button type="submit" disabled={busy} className={actionButtonClass()}>Add shipping rule</button>
          </form>

          {profile.shippingRules.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active shipping rules</p>
              {profile.shippingRules.map((rule) => (
                <ShippingRuleEditor key={rule.id} rule={rule} onUpdate={onUpdateShippingRule} busy={busy} />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
