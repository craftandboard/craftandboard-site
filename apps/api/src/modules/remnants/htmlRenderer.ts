type RemnantLabelHtmlInput = {
  templateName?: string;
  label: {
    remnantId: string;
    remnantCode: string;
    materialType: string;
    materialLabel: string;
    thicknessIn: number;
    lengthIn: number;
    widthIn: number;
    areaSqIn: number;
    usableAreaSqIn: number;
    status: string;
    grainDirection?: string;
    edgeCondition?: string;
    qualityGrade?: string;
    barcodeValue: string;
    qrValue: string;
    currentContainerCode?: string;
    currentLocationCode?: string;
    currentLocationName?: string;
    humanReadableText: string[];
  };
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderRemnantLabelHtml(input: RemnantLabelHtmlInput) {
  const details = input.label.humanReadableText.map((line) => `<li>${escapeHtml(line)}</li>`).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Remnant ${escapeHtml(input.label.remnantCode)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 16px; color: #111; }
      .label { width: 420px; border: 2px solid #111; padding: 16px; }
      .code { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
      .meta { font-size: 14px; margin: 2px 0; }
      .scan { margin-top: 12px; padding: 8px; background: #f2f2f2; font-family: monospace; font-size: 14px; }
      ul { padding-left: 18px; margin: 12px 0 0; }
      li { margin: 2px 0; font-size: 13px; }
    </style>
  </head>
  <body>
    <div class="label">
      <div class="code">${escapeHtml(input.label.remnantCode)}</div>
      <div class="meta">${escapeHtml(input.label.materialLabel)}</div>
      <div class="meta">Size: ${input.label.lengthIn}" x ${input.label.widthIn}" x ${input.label.thicknessIn}"</div>
      <div class="meta">Area: ${input.label.areaSqIn} sq in | Usable: ${input.label.usableAreaSqIn} sq in</div>
      <div class="meta">Status: ${escapeHtml(input.label.status)}</div>
      <div class="meta">Location: ${escapeHtml(input.label.currentLocationName ?? input.label.currentLocationCode ?? "Unassigned")}</div>
      <div class="meta">Container: ${escapeHtml(input.label.currentContainerCode ?? "Unassigned")}</div>
      <div class="meta">Template: ${escapeHtml(input.templateName ?? "Remnant Backbone")}</div>
      <div class="scan">BARCODE ${escapeHtml(input.label.barcodeValue)}</div>
      <div class="scan">QR ${escapeHtml(input.label.qrValue)}</div>
      <ul>${details}</ul>
    </div>
  </body>
</html>`;
}
