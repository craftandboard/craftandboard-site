"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  assignPartToContainer,
  createContainer,
  getBatchSortingView,
  removePartFromContainer,
  scanPartToContainer,
  type BatchSortingResponse,
  type ContainerMutationResponse
} from "../lib/api";

export function BatchSortingWorkspace(props: {
  batchId: string;
  initialView: BatchSortingResponse;
}) {
  const [view, setView] = useState(props.initialView);
  const [activeContainerId, setActiveContainerId] = useState(props.initialView.containers[0]?.id ?? "");
  const [scanCode, setScanCode] = useState("");
  const [createForm, setCreateForm] = useState({
    type: "BIN" as "CONTAINER" | "BIN",
    label: "",
    code: "",
    notes: ""
  });
  const [feedback, setFeedback] = useState<ContainerMutationResponse | { ok: false; error: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const scanInputRef = useRef<HTMLInputElement | null>(null);

  const activeContainer = view.containers.find((container) => container.id === activeContainerId) ?? null;

  useEffect(() => {
    if (!activeContainerId && view.containers[0]?.id) {
      setActiveContainerId(view.containers[0].id);
    }
  }, [activeContainerId, view.containers]);

  async function refreshView(nextContainerId?: string) {
    const payload = await getBatchSortingView(props.batchId);
    if (!payload) {
      throw new Error("Failed to refresh batch sorting view.");
    }
    setView(payload);
    if (nextContainerId) {
      setActiveContainerId(nextContainerId);
    } else if (payload.containers.length > 0 && !payload.containers.some((container) => container.id === activeContainerId)) {
      setActiveContainerId(payload.containers[0].id);
    }
  }

  async function handleCreateContainer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("create");
    setFeedback(null);

    try {
      const payload = await createContainer({
        batchId: props.batchId,
        type: createForm.type,
        label: createForm.label || undefined,
        code: createForm.code || undefined,
        notes: createForm.notes || undefined
      });
      setFeedback(payload);
      if (payload.ok) {
        await refreshView(payload.container.id);
        setCreateForm({
          type: "BIN",
          label: "",
          code: "",
          notes: ""
        });
      }
    } catch (error) {
      setFeedback({
        ok: false,
        error: error instanceof Error ? error.message : "Container creation failed."
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleScanAssign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeContainerId || !scanCode.trim()) {
      setFeedback({ ok: false, error: "Select a container and scan a part." });
      return;
    }

    setPendingAction("scan");
    setFeedback(null);

    try {
      const payload = await scanPartToContainer({
        containerId: activeContainerId,
        scanCode: scanCode.trim()
      });
      setFeedback(payload);
      await refreshView(activeContainerId);
      setScanCode("");
      scanInputRef.current?.focus();
    } catch (error) {
      setFeedback({
        ok: false,
        error: error instanceof Error ? error.message : "Scan assignment failed."
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleManualAssign(partId: string) {
    if (!activeContainerId) {
      setFeedback({ ok: false, error: "Select a container before assigning parts." });
      return;
    }

    setPendingAction(`assign:${partId}`);
    setFeedback(null);

    try {
      const payload = await assignPartToContainer({
        containerId: activeContainerId,
        partId
      });
      setFeedback(payload);
      await refreshView(activeContainerId);
    } catch (error) {
      setFeedback({
        ok: false,
        error: error instanceof Error ? error.message : "Manual assignment failed."
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRemove(partId: string) {
    if (!activeContainerId) {
      return;
    }

    setPendingAction(`remove:${partId}`);
    setFeedback(null);

    try {
      const payload = await removePartFromContainer({
        containerId: activeContainerId,
        partId
      });
      setFeedback(payload);
      await refreshView(activeContainerId);
    } catch (error) {
      setFeedback({
        ok: false,
        error: error instanceof Error ? error.message : "Remove failed."
      });
    } finally {
      setPendingAction(null);
    }
  }

  const previewScanCode = useMemo(() => view.unassignedParts[0]?.scanCode ?? "", [view.unassignedParts]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Containers</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Batch bins and containers</h3>
            </div>
            <Link
              href={`/batches/${props.batchId}`}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-300/40 hover:text-white"
            >
              Back to Batch
            </Link>
          </div>

          <form onSubmit={handleCreateContainer} className="space-y-3 rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Create Container</p>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={createForm.type}
                onChange={(event) => setCreateForm((current) => ({ ...current, type: event.target.value as "CONTAINER" | "BIN" }))}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white"
              >
                <option value="BIN">Bin</option>
                <option value="CONTAINER">Container</option>
              </select>
              <input
                value={createForm.label}
                onChange={(event) => setCreateForm((current) => ({ ...current, label: event.target.value }))}
                placeholder="Cut Bin - Tyler"
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              />
              <input
                value={createForm.code}
                onChange={(event) => setCreateForm((current) => ({ ...current, code: event.target.value }))}
                placeholder="Optional code"
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              />
              <input
                value={createForm.notes}
                onChange={(event) => setCreateForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Notes"
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={pendingAction === "create"}
              className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:border-emerald-300/70 disabled:opacity-50"
            >
              {pendingAction === "create" ? "Creating..." : "Create Container"}
            </button>
          </form>

          <div className="space-y-3">
            {view.containers.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/30 p-4 text-sm text-slate-400">
                No containers exist for this batch yet.
              </div>
            ) : (
              view.containers.map((container) => {
                const active = container.id === activeContainerId;

                return (
                  <button
                    key={container.id}
                    type="button"
                    onClick={() => setActiveContainerId(container.id)}
                    className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                      active
                        ? "border-emerald-300/50 bg-emerald-300/10"
                        : "border-white/10 bg-slate-950/30 hover:border-emerald-300/30"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">{container.code}</p>
                        <h4 className="mt-2 text-lg font-semibold text-white">{container.label}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-200">
                        <span className="rounded-full border border-white/10 px-3 py-1">{container.type}</span>
                        <span className="rounded-full border border-white/10 px-3 py-1">{container.status}</span>
                        <span className="rounded-full border border-white/10 px-3 py-1">{container.partCount} parts</span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">
                      {container.orderId ? `Order ${container.orderId}` : "Batch-scoped"} ·{" "}
                      {container.manufacturingJobId ? `Job ${container.manufacturingJobId}` : "Any eligible job"} ·{" "}
                      {container.completionPct}% complete
                    </p>
                    {container.mixed ? (
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-amber-200">Mixed contents</p>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Active Container</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              {activeContainer ? `${activeContainer.label} · ${activeContainer.code}` : "Select a container"}
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Scan parts into the active container or use the manual assign list below.
            </p>
          </div>

          <form onSubmit={handleScanAssign} className="space-y-3 rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
            <label htmlFor="sorting-scan" className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Scan Code
            </label>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                ref={scanInputRef}
                id="sorting-scan"
                value={scanCode}
                onChange={(event) => setScanCode(event.target.value)}
                placeholder={previewScanCode || "PART-..."}
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!activeContainerId || pendingAction === "scan"}
                className="rounded-2xl border border-emerald-300/40 bg-emerald-300/10 px-5 py-3 text-sm font-medium text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-300/20 disabled:opacity-50"
              >
                {pendingAction === "scan" ? "Assigning..." : "Assign Scan"}
              </button>
            </div>
          </form>

          {feedback ? (
            <pre className={`overflow-x-auto rounded-3xl border p-4 text-xs ${
              feedback.ok
                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-50"
                : "border-rose-400/30 bg-rose-500/10 text-rose-100"
            }`}>
              {JSON.stringify(feedback, null, 2)}
            </pre>
          ) : null}

          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Container Contents</p>
            {activeContainer ? (
              activeContainer.parts.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">No parts assigned yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {activeContainer.parts.map((part) => (
                    <article key={part.partId} className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="font-medium text-white">{part.labelCode}</p>
                          <p className="mt-1 font-mono text-xs text-emerald-200">{part.scanCode}</p>
                          <p className="mt-2 text-sm text-slate-300">
                            {part.material} · {part.width}&quot; × {part.depth}&quot; × {part.thickness}&quot; · {part.status}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(part.partId)}
                          disabled={pendingAction === `remove:${part.partId}`}
                          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-rose-300/40 hover:text-white disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )
            ) : (
              <p className="mt-3 text-sm text-slate-400">Create or select a container to start sorting.</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Unassigned Parts</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{view.unassignedParts.length} waiting to be sorted</h3>
          </div>
          <p className="text-sm text-slate-400">
            Manual fallback: select an active container, then assign from this list.
          </p>
        </div>
        <div className="mt-4 space-y-3">
          {view.unassignedParts.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/30 p-4 text-sm text-slate-400">
              All eligible batch parts are currently assigned to containers.
            </div>
          ) : (
            view.unassignedParts.map((part) => (
              <article key={part.partId} className="rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium text-white">{part.labelCode}</p>
                    <p className="mt-1 font-mono text-xs text-emerald-200">{part.scanCode}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {part.material} · {part.width}&quot; × {part.depth}&quot; × {part.thickness}&quot; · {part.status}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleManualAssign(part.partId)}
                    disabled={!activeContainerId || pendingAction === `assign:${part.partId}`}
                    className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:border-emerald-300/70 disabled:opacity-50"
                  >
                    Assign To Active Container
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
