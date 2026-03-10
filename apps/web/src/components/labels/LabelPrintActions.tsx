"use client";

import { apiUrl } from "../../lib/site-config";

export function LabelPrintActions({
  bundleCode
}: {
  bundleCode: string;
}) {
  const htmlUrl = apiUrl(`/labels/bundles/${bundleCode}/html`);

  return (
    <div className="label-print-toolbar">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-emerald-950"
      >
        Print Labels
      </button>
      <a
        href={htmlUrl}
        className="rounded-full border border-white/10 px-5 py-3 text-sm text-white"
        target="_blank"
        rel="noreferrer"
      >
        Open Print View
      </a>
    </div>
  );
}
