"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { generateBatchCnc, type BatchCncResponse } from "../lib/api";

export function GenerateCncButton(props: { batchId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<BatchCncResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setPending(true);
    setError(null);

    try {
      const payload = await generateBatchCnc(props.batchId);
      setResult(payload);
      startTransition(() => {
        router.refresh();
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "CNC generation failed.";
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
        onClick={handleGenerate}
        disabled={pending}
        className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-emerald-300/40 disabled:opacity-60"
      >
        {pending ? "Generating CNC..." : "Generate CNC"}
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
