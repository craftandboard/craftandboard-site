"use client";

import { useState } from "react";

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-emerald-300/40"
    >
      {copied ? "Copied" : "Copy Link"}
    </button>
  );
}
