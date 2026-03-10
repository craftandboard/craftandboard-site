"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { generatePackingSlip, type PackingSlipArtifactResponse } from "../lib/api";
import { API_BASE_URL } from "../lib/site-config";

export function GeneratePackingSlipButton(props: { orderId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<PackingSlipArtifactResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setPending(true);
    setError(null);

    try {
      const payload = await generatePackingSlip(props.orderId);
      setResult(payload);
      startTransition(() => router.refresh());
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Packing slip generation failed.";
      setError(message);
      setResult({ ok: false, error: message });
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
        {pending ? "Generating Slip..." : "Generate Packing Slip"}
      </button>
      {result && result.ok ? (
        <a
          href={`${API_BASE_URL}${result.artifact.uri}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100 transition hover:border-emerald-200/50"
        >
          Open Packing Slip PDF
        </a>
      ) : null}
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      {result ? (
        <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-emerald-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
