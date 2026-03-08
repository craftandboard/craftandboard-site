"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { transitionBatchStatus, type BatchStatusTransitionResponse } from "../lib/api";

const STATUS_LABELS: Record<string, string> = {
  planned: "Move To Planned",
  released: "Release Batch",
  cutting: "Start Cutting",
  cut_complete: "Mark Cut Complete",
  ready_for_next_stage: "Ready For Next Stage",
  complete: "Complete Batch"
};

export function BatchStatusActions(props: { batchId: string; availableNextActions: string[] }) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [result, setResult] = useState<BatchStatusTransitionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTransition(nextStatus: string) {
    setPendingStatus(nextStatus);
    setError(null);

    try {
      const payload = await transitionBatchStatus(
        props.batchId,
        nextStatus.toUpperCase() as
          | "PLANNED"
          | "RELEASED"
          | "CUTTING"
          | "CUT_COMPLETE"
          | "READY_FOR_NEXT_STAGE"
      );
      setResult(payload);
      startTransition(() => {
        router.refresh();
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Batch transition failed.";
      setError(message);
      setResult({
        ok: false,
        error: message
      });
    } finally {
      setPendingStatus(null);
    }
  }

  if (props.availableNextActions.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-300">No further batch status actions available.</p>
        {result ? (
          <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-emerald-100">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {props.availableNextActions.map((nextStatus) => (
          <button
            key={nextStatus}
            type="button"
            onClick={() => handleTransition(nextStatus)}
            disabled={pendingStatus !== null}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-emerald-300/40 disabled:opacity-60"
          >
            {pendingStatus === nextStatus ? "Updating..." : STATUS_LABELS[nextStatus] ?? nextStatus}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      {result ? (
        <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-emerald-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
