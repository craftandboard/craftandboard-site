"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { transitionPartStatus, type PartStatusTransitionResponse } from "../lib/api";

const LABELS: Record<string, string> = {
  cut: "Mark Cut",
  edgebanded: "Mark Edgebanded",
  packed: "Mark Packed"
};

export function PartStatusActions(props: {
  partId: string;
  availableNextActions: Array<"cut" | "edgebanded" | "packed">;
}) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [result, setResult] = useState<PartStatusTransitionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTransition(nextStatus: "cut" | "edgebanded" | "packed") {
    setPendingStatus(nextStatus);
    setError(null);

    try {
      const payload = await transitionPartStatus(
        props.partId,
        nextStatus.toUpperCase() as "CUT" | "EDGEBANDED" | "PACKED"
      );
      setResult(payload);
      startTransition(() => {
        router.refresh();
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Part transition failed.";
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
    return <span className="text-xs text-slate-400">No further actions</span>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {props.availableNextActions.map((nextStatus) => (
          <button
            key={nextStatus}
            type="button"
            onClick={() => handleTransition(nextStatus)}
            disabled={pendingStatus !== null}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white transition hover:border-emerald-300/40 disabled:opacity-60"
          >
            {pendingStatus === nextStatus ? "Updating..." : LABELS[nextStatus]}
          </button>
        ))}
      </div>
      {error ? <p className="text-xs text-red-200">{error}</p> : null}
      {result ? (
        <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-[11px] text-emerald-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
