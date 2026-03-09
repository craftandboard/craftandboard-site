"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { recomputeSalesOrderEstimate, recomputeShelfJobEstimate } from "../lib/api";

export function RecomputeEstimateButton(props: {
  targetType: "order" | "shelfJob";
  targetId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);

    try {
      if (props.targetType === "order") {
        await recomputeSalesOrderEstimate(props.targetId);
      } else {
        await recomputeShelfJobEstimate(props.targetId);
      }

      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Estimate recompute failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-emerald-950 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Recomputing..." : "Recompute Estimate"}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
