import type { ManufacturingPartLabelPayload } from "./contracts.js";
import type { RenderedShelfLabelBatch } from "./types.js";
import { SHELF_LABEL_PRINT_CSS } from "./templates/shelfLabelTemplate.js";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderList(items: string[]) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

export function renderManufacturingPartLabelHtml(input: {
  label: ManufacturingPartLabelPayload;
  templateName?: string;
}) {
  const { label } = input;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(label.partNumber)} Label</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 24px; background: #fff; color: #111827; }
      .label { width: 4in; min-height: 2.6in; border: 2px solid #111827; padding: 16px; display: grid; gap: 12px; }
      .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 12px; font-size: 12px; }
      .meta-block { border: 1px solid #d1d5db; padding: 8px; }
      .meta-label { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; }
      .meta-value { font-weight: 700; margin-top: 4px; }
      .code { font-size: 22px; font-weight: 800; letter-spacing: 0.04em; }
      .scan { font-family: monospace; font-size: 14px; }
      ul { margin: 0; padding-left: 18px; font-size: 12px; }
      .footer { font-size: 10px; color: #6b7280; }
    </style>
  </head>
  <body>
    <article class="label">
      <header>
        <div class="code">${escapeHtml(label.partNumber)}</div>
        <div class="scan">BARCODE: ${escapeHtml(label.barcodeValue)}</div>
        <div class="scan">QR: ${escapeHtml(label.qrValue)}</div>
      </header>
      <section class="meta">
        <div class="meta-block"><div class="meta-label">Packet</div><div class="meta-value">${escapeHtml(label.packetNumber)}</div></div>
        <div class="meta-block"><div class="meta-label">Batch</div><div class="meta-value">${escapeHtml(label.batchNumber ?? "UNASSIGNED")}</div></div>
        <div class="meta-block"><div class="meta-label">Material</div><div class="meta-value">${escapeHtml(label.materialType)}</div></div>
        <div class="meta-block"><div class="meta-label">Status</div><div class="meta-value">${escapeHtml(label.currentStatus)}</div></div>
        <div class="meta-block"><div class="meta-label">Size</div><div class="meta-value">${escapeHtml(`${label.lengthIn}" x ${label.depthIn}" x ${label.thicknessIn}"`)}</div></div>
        <div class="meta-block"><div class="meta-label">Edge Band</div><div class="meta-value">${escapeHtml(label.edgeBandPattern)}</div></div>
      </section>
      <section>
        <div class="meta-label">Human Readable</div>
        <ul>${renderList(label.humanReadableText)}</ul>
      </section>
      <footer class="footer">
        Template: ${escapeHtml(input.templateName ?? "Manufacturing Part Label")}
      </footer>
    </article>
  </body>
</html>`;
}

function renderLegacyShelfLabel(label: RenderedShelfLabelBatch["labels"][number]) {
  return `<article class="shelf-label">
  <div class="shelf-label__row shelf-label__row--top">
    <section class="label-cell">
      <div class="meta-label">Shelf QTY</div>
      <div class="meta-value">${escapeHtml(label.quantityDisplay)}</div>
    </section>
    <section class="label-cell">
      <div class="meta-label">Customer Name</div>
      <div class="meta-value name-value">${escapeHtml(label.customerLastName)}</div>
    </section>
    <section class="label-cell">
      <div class="meta-label">Box Code</div>
      <div class="meta-value ${label.boxCode ? "" : "muted-empty"}">${escapeHtml(label.boxCode ?? "")}</div>
    </section>
    <section class="label-cell no-right">
      <div class="meta-label">Job #</div>
      <div class="meta-value">${escapeHtml(String(label.jobNumber))}</div>
    </section>
  </div>
  <div class="shelf-label__row shelf-label__row--middle">
    <section class="label-cell vertical-shelf">SHELF</section>
    <section class="label-cell">
      <div class="meta-label">Product SKU</div>
      <div class="meta-value">${escapeHtml(label.productLabel)}</div>
    </section>
    <section class="label-cell">
      <div class="meta-label">Shelf Length</div>
      <div class="meta-value dim-value">${escapeHtml(label.shelfLengthIn)}</div>
    </section>
    <section class="label-cell no-right">
      <div class="meta-label">Shelf Depth</div>
      <div class="meta-value dim-value">${escapeHtml(label.shelfDepthIn)}</div>
    </section>
  </div>
  <div class="shelf-label__row shelf-label__row--bottom">
    <section class="label-cell row-bottom">
      <div class="meta-label">Order ID</div>
      <div class="barcode-wrap">
        <div class="barcode-svg">${label.barcodeSvg}</div>
        <div class="barcode-text">${escapeHtml(label.orderId)}</div>
      </div>
    </section>
    <section class="label-cell row-bottom no-right">
      <div class="meta-label">Ship By Date</div>
      <div class="meta-value ship-value">${escapeHtml(label.shipByDate)}</div>
    </section>
  </div>
</article>`;
}

export function renderShelfLabelBatchHtml(batch: RenderedShelfLabelBatch) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(batch.bundleCode)} Labels</title>
    <style>${SHELF_LABEL_PRINT_CSS}</style>
  </head>
  <body>
    <div class="print-toolbar">
      <button onclick="window.print()">Print Labels</button>
      <span>${escapeHtml(batch.bundleCode)} (${String(batch.labelCount)} labels)</span>
    </div>
    <div class="shelf-label-batch">
      ${batch.labels.map(renderLegacyShelfLabel).join("\n")}
    </div>
  </body>
</html>`;
}
