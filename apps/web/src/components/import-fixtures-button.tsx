"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { importAmazonFixtures, previewAmazonFixtures } from "../lib/api";

export function ImportFixturesButton() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  async function handlePreview() {
    setPreviewing(true);
    setMessage(null);
    setResponseBody(null);

    try {
      const payload = await previewAmazonFixtures();

      if (!payload) {
        setMessage("Preview failed.");
        return;
      }

      setMessage(
        `Previewed ${payload.preview.filesProcessed} files with ${payload.preview.previews.length} normalized records and ${payload.preview.errors.length} errors.`
      );
      setResponseBody(JSON.stringify(payload, null, 2));
    } catch {
      setMessage("API unavailable. Start the local API and database first.");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleImport() {
    setPending(true);
    setMessage(null);
    setResponseBody(null);

    try {
      const payload = await importAmazonFixtures();

      setMessage(
        `Imported ${payload.summary.ordersCreated} Amazon orders, created ${payload.summary.jobsCreated} manufacturing jobs, and created ${payload.summary.partsCreated} parts. Errors: ${payload.errors.length}.`
      );
      setResponseBody(JSON.stringify(payload, null, 2));
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "API unavailable. Start the local API and database first.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleImport}
          disabled={pending}
          className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-200"
        >
          {pending ? "Importing Amazon fixtures..." : "Import Amazon Fixtures"}
        </button>
        <button
          type="button"
          onClick={handlePreview}
          disabled={previewing}
          className="rounded-full border border-white/10 px-5 py-3 text-sm text-white transition hover:border-emerald-300/40"
        >
          {previewing ? "Previewing..." : "Preview Import"}
        </button>
      </div>
      {message ? <p className="text-sm text-emerald-100/80">{message}</p> : null}
      {responseBody ? (
        <pre className="overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-xs text-emerald-100">
          {responseBody}
        </pre>
      ) : null}
    </div>
  );
}
