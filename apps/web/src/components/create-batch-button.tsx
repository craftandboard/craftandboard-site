"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { createBatch, type BatchActionResponse } from "../lib/api";

export function CreateBatchButton(props: { material: "WHITE_MELAMINE" | "MAPLE_MELAMINE"; label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<BatchActionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setPending(true);
    setError(null);

    try {
      const payload = await createBatch(props.material);
      setResult(payload);
      startTransition(() => {
        router.refresh();
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Batch creation failed.";
      setError(message);
      setResult({
        ok: false,
        error: message
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
        disabled={pending}
        className="rounded-full border border-white/10 px-5 py-3 text-sm text-white transition hover:border-emerald-300/40 disabled:opacity-60"
      >
        {pending ? `Creating ${props.label} Batch...` : `Create ${props.label} Batch`}
      </button>
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      {result ? (
        <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-emerald-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
