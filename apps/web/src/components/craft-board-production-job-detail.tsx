"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getCraftBoardProductionJob,
  updateCraftBoardProductionJob,
  type CraftBoardProductionJobItem
} from "../lib/api";
import { formatDate, formatDateTime, humanizeToken } from "../lib/mvp";

const statusOptions = [
  "RELEASED",
  "PREP_IN_PROGRESS",
  "READY_FOR_BUILD",
  "IN_BUILD",
  "BUILD_COMPLETE",
  "READY_FOR_FULFILLMENT",
  "FULFILLED",
  "CANCELLED"
] as const;

function statusToStage(status: (typeof statusOptions)[number]): CraftBoardProductionJobItem["stage"] {
  switch (status) {
    case "RELEASED":
    case "PREP_IN_PROGRESS":
      return "PREP";
    case "READY_FOR_BUILD":
      return "READY_TO_BUILD";
    case "IN_BUILD":
      return "IN_BUILD";
    case "BUILD_COMPLETE":
      return "BUILD_COMPLETE";
    case "READY_FOR_FULFILLMENT":
      return "READY_TO_FULFILL";
    case "FULFILLED":
      return "FULFILLED";
    case "CANCELLED":
      return "CANCELLED";
  }
}

function stageToStatus(stage: CraftBoardProductionJobItem["stage"]): (typeof statusOptions)[number] {
  switch (stage) {
    case "PREP":
      return "PREP_IN_PROGRESS";
    case "READY_TO_BUILD":
      return "READY_FOR_BUILD";
    case "IN_BUILD":
      return "IN_BUILD";
    case "BUILD_COMPLETE":
      return "BUILD_COMPLETE";
    case "READY_TO_FULFILL":
      return "READY_FOR_FULFILLMENT";
    case "FULFILLED":
      return "FULFILLED";
    case "CANCELLED":
      return "CANCELLED";
  }
}

type FormState = {
  status: (typeof statusOptions)[number];
  stage: CraftBoardProductionJobItem["stage"];
  targetCompletionDate: string;
  requestedShipDate: string;
  productionPrepNotes: string;
  shopNotes: string;
  fulfillmentNotes: string;
  cutPrepNotes: string;
  materialPrepNotes: string;
  packagingPrepNotes: string;
  checklistDimensionsConfirmed: boolean;
  checklistMaterialConfirmed: boolean;
  checklistMountingConfirmed: boolean;
  checklistDepositVerified: boolean;
  checklistScopeConfirmed: boolean;
  checklistReadyForBuild: boolean;
};

function buildFormState(job: CraftBoardProductionJobItem): FormState {
  return {
    status: job.status,
    stage: job.stage,
    targetCompletionDate: job.targetCompletionDate ? job.targetCompletionDate.slice(0, 10) : "",
    requestedShipDate: job.requestedShipDate ? job.requestedShipDate.slice(0, 10) : "",
    productionPrepNotes: job.productionPrepNotes ?? "",
    shopNotes: job.shopNotes ?? "",
    fulfillmentNotes: job.fulfillmentNotes ?? "",
    cutPrepNotes: job.cutPrepNotes ?? "",
    materialPrepNotes: job.materialPrepNotes ?? "",
    packagingPrepNotes: job.packagingPrepNotes ?? "",
    checklistDimensionsConfirmed: job.checklistDimensionsConfirmed,
    checklistMaterialConfirmed: job.checklistMaterialConfirmed,
    checklistMountingConfirmed: job.checklistMountingConfirmed,
    checklistDepositVerified: job.checklistDepositVerified,
    checklistScopeConfirmed: job.checklistScopeConfirmed,
    checklistReadyForBuild: job.checklistReadyForBuild
  };
}

export function CraftBoardProductionJobDetail({ productionJobId }: { productionJobId: string }) {
  const [job, setJob] = useState<CraftBoardProductionJobItem | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await getCraftBoardProductionJob(productionJobId);
      if (!payload?.productionJob) {
        setError("Production job not found.");
        return;
      }
      setJob(payload.productionJob);
      setForm(buildFormState(payload.productionJob));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load production job.");
    } finally {
      setLoading(false);
    }
  }, [productionJobId]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setMessage(null);
  }

  function save(nextStatus?: (typeof statusOptions)[number]) {
    if (!form) {
      return;
    }

    const effectiveStatus = nextStatus ?? form.status;
    const effectiveStage = nextStatus ? statusToStage(nextStatus) : form.stage;

    startTransition(() => {
      void (async () => {
        try {
          const payload = await updateCraftBoardProductionJob(productionJobId, {
            status: effectiveStatus,
            stage: effectiveStage,
            targetCompletionDate: form.targetCompletionDate
              ? new Date(`${form.targetCompletionDate}T00:00:00.000Z`).toISOString()
              : null,
            requestedShipDate: form.requestedShipDate
              ? new Date(`${form.requestedShipDate}T00:00:00.000Z`).toISOString()
              : null,
            productionPrepNotes: form.productionPrepNotes || null,
            shopNotes: form.shopNotes || null,
            fulfillmentNotes: form.fulfillmentNotes || null,
            cutPrepNotes: form.cutPrepNotes || null,
            materialPrepNotes: form.materialPrepNotes || null,
            packagingPrepNotes: form.packagingPrepNotes || null,
            checklistDimensionsConfirmed: form.checklistDimensionsConfirmed,
            checklistMaterialConfirmed: form.checklistMaterialConfirmed,
            checklistMountingConfirmed: form.checklistMountingConfirmed,
            checklistDepositVerified: form.checklistDepositVerified,
            checklistScopeConfirmed: form.checklistScopeConfirmed,
            checklistReadyForBuild: form.checklistReadyForBuild
          });

          setJob(payload.productionJob);
          setForm(buildFormState(payload.productionJob));
          setMessage("Production job updated.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to update production job.");
        }
      })();
    });
  }

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Loading production job...
      </div>
    );
  }

  if (error || !job || !form) {
    return (
      <div className="rounded-[1.5rem] border border-rose-300/30 bg-rose-500/10 p-6 text-sm text-rose-100">
        {error ?? "Production job not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board Production Job</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{job.productionJobNumber}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Linked order{" "}
            <Link className="text-emerald-300" href={`/admin/craft-board/orders/${job.orderId}`}>
              {job.order?.orderNumber ?? job.orderId}
            </Link>
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {job.productionJobCode} · {job.productionJobScanCode}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => save("READY_FOR_BUILD")}
            disabled={isPending}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            Mark Ready
          </button>
          <button
            type="button"
            onClick={() => save("IN_BUILD")}
            disabled={isPending}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            Start Build
          </button>
          <button
            type="button"
            onClick={() => save()}
            disabled={isPending}
            className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-emerald-950 disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Job"}
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-[1.5rem] border border-emerald-300/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">1. Job Header</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
                <p className="mt-2">{humanizeToken(job.status)}</p>
                <p className="mt-1 text-slate-400">{humanizeToken(job.stage)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Created</p>
                <p className="mt-2">{formatDateTime(job.createdAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Released From Order</p>
                <p className="mt-2">{formatDateTime(job.releasedFromOrderAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Updated</p>
                <p className="mt-2">{formatDateTime(job.updatedAt)}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              <p>Ready for build {job.readyForBuildAt ? formatDateTime(job.readyForBuildAt) : "Not marked"}</p>
              <p className="mt-1">Build started {job.buildStartedAt ? formatDateTime(job.buildStartedAt) : "Not marked"}</p>
              <p className="mt-1">Build complete {job.buildCompletedAt ? formatDateTime(job.buildCompletedAt) : "Not marked"}</p>
              <p className="mt-1">Ready for fulfillment {job.readyForFulfillmentAt ? formatDateTime(job.readyForFulfillmentAt) : "Not marked"}</p>
              <p className="mt-1">Fulfilled {job.fulfilledAt ? formatDateTime(job.fulfilledAt) : "Not fulfilled"}</p>
              <p className="mt-1">Last stage change {job.lastStageChangedAt ? formatDateTime(job.lastStageChangedAt) : "Not recorded"}</p>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">2. Lineage / Linked Records</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <Link href={`/admin/craft-board/orders/${job.orderId}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-emerald-200/30">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Order</p>
                <p className="mt-2">{job.order?.orderNumber ?? job.orderId}</p>
                <p className="mt-1 text-slate-400">{job.order ? humanizeToken(job.order.status) : "Order link"}</p>
              </Link>
              <Link href={`/admin/craft-board/proposals/${job.proposalId}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-emerald-200/30">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Proposal</p>
                <p className="mt-2">{job.proposal?.proposalNumber ?? job.proposalId}</p>
                <p className="mt-1 text-slate-400">{job.proposal ? humanizeToken(job.proposal.status) : "Proposal link"}</p>
              </Link>
              <Link href={`/admin/craft-board/deposits/${job.depositRequestId}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-emerald-200/30">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Deposit</p>
                <p className="mt-2">{job.depositRequest?.depositNumber ?? job.depositRequestId}</p>
                <p className="mt-1 text-slate-400">{job.depositRequest ? humanizeToken(job.depositRequest.status) : "Deposit link"}</p>
              </Link>
              <Link href={`/admin/craft-board/inquiries/${job.inquiryId}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-emerald-200/30">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Inquiry</p>
                <p className="mt-2">{job.inquiry?.id ?? job.inquiryId}</p>
                <p className="mt-1 text-slate-400">{job.inquiry ? humanizeToken(job.inquiry.status) : "Inquiry link"}</p>
              </Link>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">3. Product Configuration Snapshot</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p>{job.customerNameSnapshot}</p>
                <p className="mt-1">{job.productName}</p>
                <p className="mt-1">
                  {job.reviewedWidthValue ?? "?"} {job.reviewedWidthUnit} x {job.reviewedDepthValue ?? "?"} {job.reviewedDepthUnit} x {job.reviewedThicknessValue ?? "?"} {job.reviewedThicknessUnit}
                </p>
                <p className="mt-1">Qty {job.reviewedQuantity}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p>{job.reviewedMaterialLabel ?? "Material not recorded"}</p>
                <p className="mt-1">{job.reviewedMountingLabel ?? "Mounting not recorded"}</p>
                <p className="mt-1">{job.leadTimeText ?? "Lead time not recorded"}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">4. Prep Checklist</p>
            <div className="mt-5 grid gap-3 text-sm text-slate-200">
              {[
                ["checklistDimensionsConfirmed", "Dimensions confirmed"],
                ["checklistMaterialConfirmed", "Material confirmed"],
                ["checklistMountingConfirmed", "Mounting confirmed"],
                ["checklistDepositVerified", "Deposit verified"],
                ["checklistScopeConfirmed", "Scope confirmed"],
                ["checklistReadyForBuild", "Ready for build"]
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <input
                    type="checkbox"
                    checked={form[key as keyof FormState] as boolean}
                    onChange={(event) => updateField(key as keyof FormState, event.target.checked as never)}
                    className="h-4 w-4"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">5. Shop Prep Notes</p>
            <div className="mt-5 space-y-4">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Production Prep Notes</span>
                <textarea value={form.productionPrepNotes} onChange={(event) => updateField("productionPrepNotes", event.target.value)} rows={4} className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Cut Prep Notes</span>
                <textarea value={form.cutPrepNotes} onChange={(event) => updateField("cutPrepNotes", event.target.value)} rows={4} className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Material Prep Notes</span>
                <textarea value={form.materialPrepNotes} onChange={(event) => updateField("materialPrepNotes", event.target.value)} rows={4} className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Packaging Prep Notes</span>
                <textarea value={form.packagingPrepNotes} onChange={(event) => updateField("packagingPrepNotes", event.target.value)} rows={4} className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Shop Notes</span>
                <textarea value={form.shopNotes} onChange={(event) => updateField("shopNotes", event.target.value)} rows={4} className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">6. Execution Workflow</p>
            <div className="mt-5 space-y-4">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Status</span>
                <select value={form.status} onChange={(event) => {
                  const nextStatus = event.target.value as FormState["status"];
                  updateField("status", nextStatus);
                  updateField("stage", statusToStage(nextStatus));
                }} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white">
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>{humanizeToken(option)}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Board Stage</span>
                <select value={form.stage} onChange={(event) => {
                  const nextStage = event.target.value as FormState["stage"];
                  updateField("stage", nextStage);
                  updateField("status", stageToStatus(nextStage));
                }} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white">
                  {[
                    "PREP",
                    "READY_TO_BUILD",
                    "IN_BUILD",
                    "BUILD_COMPLETE",
                    "READY_TO_FULFILL",
                    "FULFILLED",
                    "CANCELLED"
                  ].map((option) => (
                    <option key={option} value={option}>{humanizeToken(option)}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Target Completion Date</span>
                <input type="date" value={form.targetCompletionDate} onChange={(event) => updateField("targetCompletionDate", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Requested Ship Date</span>
                <input type="date" value={form.requestedShipDate} onChange={(event) => updateField("requestedShipDate", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">7. Fulfillment Readiness</p>
            <label className="mt-5 block space-y-2 text-sm text-slate-200">
              <span>Fulfillment Notes</span>
              <textarea value={form.fulfillmentNotes} onChange={(event) => updateField("fulfillmentNotes", event.target.value)} rows={7} className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white" />
            </label>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              <p>Requested ship date {formatDate(job.requestedShipDate)}</p>
              <p className="mt-1">Ready for fulfillment {job.readyForFulfillmentAt ? formatDateTime(job.readyForFulfillmentAt) : "Not marked"}</p>
              <p className="mt-1">Fulfilled {job.fulfilledAt ? formatDateTime(job.fulfilledAt) : "Not fulfilled"}</p>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">8. Internal Summary Panel</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p>{humanizeToken(job.status)}</p>
                <p className="mt-1">{humanizeToken(job.stage)}</p>
                <p className="mt-1">{job.productionJobNumber}</p>
                <p className="mt-1">{job.order?.orderNumber ?? "No linked order"}</p>
                <p className="mt-1">{job.proposal?.proposalNumber ?? "No linked proposal"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p>
                  {job.reviewedWidthValue ?? "?"} {job.reviewedWidthUnit} x {job.reviewedDepthValue ?? "?"} {job.reviewedDepthUnit} x {job.reviewedThicknessValue ?? "?"} {job.reviewedThicknessUnit}
                </p>
                <p className="mt-1">Qty {job.reviewedQuantity}</p>
                <p className="mt-1">{job.reviewedMaterialLabel ?? "Material not recorded"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-slate-300">
                <p>Target completion {formatDate(job.targetCompletionDate)}</p>
                <p className="mt-1">Requested ship date {formatDate(job.requestedShipDate)}</p>
                <p className="mt-1">Checklist ready {form.checklistReadyForBuild ? "Yes" : "No"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-slate-300">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Label / Scan Foundation</p>
                <p className="mt-2">{job.productionJobCode}</p>
                <p className="mt-1 break-all">{job.productionJobScanCode}</p>
                <p className="mt-1">Printed {job.barcodeLabelPrintedAt ? formatDateTime(job.barcodeLabelPrintedAt) : "Not printed"}</p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
