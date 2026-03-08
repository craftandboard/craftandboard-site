"use client";

import { useMemo, useState } from "react";
import {
  transitionPartStatusByScanCode,
  type PartStatusTransitionResponse,
  type StationQueueSuccessResponse
} from "../lib/api";

type StationQueuePart = StationQueueSuccessResponse["parts"][number];

export function StationQueue(props: {
  station: StationQueueSuccessResponse["station"];
  nextStatus: StationQueueSuccessResponse["nextStatus"];
  initialParts: StationQueuePart[];
}) {
  const [scanCode, setScanCode] = useState("");
  const [parts, setParts] = useState(props.initialParts);
  const [result, setResult] = useState<PartStatusTransitionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const queuedCount = parts.length;
  const previewScanCode = useMemo(() => parts[0]?.scanCode ?? "", [parts]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!scanCode.trim()) {
      setError("Scan code is required.");
      setResult(null);
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      const payload = await transitionPartStatusByScanCode(scanCode.trim(), props.nextStatus);
      setResult(payload);
      setParts((current) => current.filter((part) => part.scanCode !== scanCode.trim()));
      setScanCode("");
    } catch (caughtError) {
      setResult(null);
      setError(caughtError instanceof Error ? caughtError.message : "Scan failed.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">{props.station}</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">{queuedCount} parts in queue</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Scan a part to move it to <span className="font-medium text-white">{props.nextStatus}</span>.
          </p>
        </div>
        {previewScanCode ? (
          <p className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-slate-300">
            Next queued scan: <span className="font-mono text-emerald-200">{previewScanCode}</span>
          </p>
        ) : null}
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/20 p-4">
        <label className="text-xs uppercase tracking-[0.3em] text-slate-400" htmlFor={`${props.station}-scan`}>
          Scan Code
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            id={`${props.station}-scan`}
            value={scanCode}
            onChange={(event) => setScanCode(event.target.value)}
            placeholder={previewScanCode || "PART-..."}
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-2xl border border-emerald-300/40 bg-emerald-300/10 px-5 py-3 text-sm font-medium text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Processing..." : `Mark ${props.nextStatus}`}
          </button>
        </div>
      </form>

      {result ? (
        <pre className="overflow-x-auto rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-xs text-emerald-50">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}

      {error ? (
        <pre className="overflow-x-auto rounded-3xl border border-rose-400/30 bg-rose-500/10 p-4 text-xs text-rose-100">
          {JSON.stringify({ ok: false, error }, null, 2)}
        </pre>
      ) : null}

      <div className="space-y-3">
        {parts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-slate-400">
            No parts are currently queued for this station.
          </div>
        ) : (
          parts.map((part) => (
            <article
              key={part.partId}
              className="grid gap-3 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-slate-300 md:grid-cols-[1.3fr_1fr_1fr_1fr]"
            >
              <div className="space-y-1">
                <p className="font-medium text-white">{part.labelCode}</p>
                <p className="font-mono text-xs text-emerald-200">{part.scanCode}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Batch</p>
                <p className="mt-1 text-white">{part.batchCode}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Material</p>
                <p className="mt-1 text-white">{part.material}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Dimensions</p>
                <p className="mt-1 text-white">
                  {part.width}&quot; x {part.depth}&quot;
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
