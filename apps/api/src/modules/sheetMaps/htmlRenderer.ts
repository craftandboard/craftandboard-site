import type { SheetMapArtifact, SheetSummary } from "@craft-and-board/shared";
import { renderSheetMapSvg } from "./svgRenderer.js";

export function renderSheetMapHtml(input: {
  bundleCode: string;
  sheet: SheetSummary;
}): SheetMapArtifact["html"] {
  const svg = renderSheetMapSvg(input);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${input.bundleCode} Sheet ${input.sheet.sheetNumber}</title>
    <style>
      body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; }
      .card { background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 20px; }
      .meta { margin-bottom: 16px; font-size: 14px; }
      svg { background: white; max-width: 100%; height: auto; border-radius: 12px; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="meta">
        <strong>${input.bundleCode}</strong> · Sheet ${input.sheet.sheetNumber} · Utilization ${input.sheet.utilizationPct}%
      </div>
      ${svg}
    </div>
  </body>
</html>`;
}
