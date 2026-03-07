"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

export function ImportFixturesButton() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  async function handlePreview() {
    setPreviewing(true);
    setMessage(null);

    try {
      const response = await fetch("http://localhost:4000/orders/import/amazon-fixtures/preview");
      const payload = (await response.json()) as {
        preview?: { filesProcessed: number; previews: unknown[]; errors: unknown[] };
        message?: string;
      };

      if (!response.ok) {
        setMessage(payload.message ?? "Preview failed.");
        return;
      }

      setMessage(
        `Previewed ${payload.preview?.filesProcessed ?? 0} files with ${
          payload.preview?.previews.length ?? 0
        } normalized records and ${payload.preview?.errors.length ?? 0} errors.`
      );
    } catch {
      setMessage("API unavailable. Start the local API and database first.");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleImport() {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("http://localhost:4000/orders/import/amazon-fixtures", {
        method: "POST"
      });
      const payload = (await response.json()) as {
        ordersCreated?: number;
        partInstancesCreated?: number;
        errors?: unknown[];
        message?: string;
      };

      if (!response.ok) {
        setMessage(payload.message ?? "Import failed.");
        return;
      }

      setMessage(
        `Imported ${payload.ordersCreated ?? 0} Amazon orders and created ${
          payload.partInstancesCreated ?? 0
        } physical parts. Errors: ${payload.errors?.length ?? 0}.`
      );
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setMessage("API unavailable. Start the local API and database first.");
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
    </div>
  );
}
