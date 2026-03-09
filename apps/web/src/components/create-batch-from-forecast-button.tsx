"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { createForecastBatch, type CreateForecastBatchResponse } from "../lib/api";

export function CreateBatchFromForecastButton(props: {
  materialCode: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
  jobIds: string[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<CreateForecastBatchResponse | { ok: false; error: string } | null>(null);

  async function handleCreate() {
    if (props.jobIds.length === 0 || pending) {
      return;
    }

    setPending(true);
    try {
      const payload = await createForecastBatch({
        materialCode: props.materialCode,
        jobIds: props.jobIds
      });
      setResult(payload);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : "Forecast batch creation failed."
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleCreate}
        disabled={pending || props.disabled || props.jobIds.length === 0}
        className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:border-emerald-300/70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Creating Batch..." : `Create Batch From Selection (${props.jobIds.length})`}
      </button>
      {result ? (
        <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-emerald-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
