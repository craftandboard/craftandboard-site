import type { RenderedShelfLabelBatch, RenderedShelfLabelData } from "./types.js";
import { SHELF_LABEL_PRINT_CSS } from "./templates/shelfLabelTemplate.js";

function renderSingleLabelHtml(label: RenderedShelfLabelData): string {
  return `<article class="shelf-label">
  <div class="shelf-label__row shelf-label__row--top">
    <section class="label-cell">
      <div class="meta-label">Shelf QTY</div>
      <div class="meta-value">${label.quantityDisplay}</div>
    </section>
    <section class="label-cell">
      <div class="meta-label">Customer Name</div>
      <div class="meta-value name-value">${label.customerLastName}</div>
    </section>
    <section class="label-cell">
      <div class="meta-label">Box Code</div>
      <div class="meta-value ${label.boxCode ? "" : "muted-empty"}">${label.boxCode ?? ""}</div>
    </section>
    <section class="label-cell no-right">
      <div class="meta-label">Job #</div>
      <div class="meta-value">${label.jobNumber}</div>
    </section>
  </div>
  <div class="shelf-label__row shelf-label__row--middle">
    <section class="label-cell vertical-shelf">SHELF</section>
    <section class="label-cell">
      <div class="meta-label">Product SKU</div>
      <div class="meta-value">${label.productLabel}</div>
    </section>
    <section class="label-cell">
      <div class="meta-label">Shelf Length</div>
      <div class="meta-value dim-value">${label.shelfLengthIn}</div>
    </section>
    <section class="label-cell no-right">
      <div class="meta-label">Shelf Depth</div>
      <div class="meta-value dim-value">${label.shelfDepthIn}</div>
    </section>
  </div>
  <div class="shelf-label__row shelf-label__row--bottom">
    <section class="label-cell row-bottom">
      <div class="meta-label">Order ID</div>
      <div class="barcode-wrap">
        <div class="barcode-svg">${label.barcodeSvg}</div>
        <div class="barcode-text">${label.orderId}</div>
      </div>
    </section>
    <section class="label-cell row-bottom no-right">
      <div class="meta-label">Ship By Date</div>
      <div class="meta-value ship-value">${label.shipByDate}</div>
    </section>
  </div>
</article>`;
}

export function renderShelfLabelBatchHtml(batch: RenderedShelfLabelBatch): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${batch.bundleCode} Shelf Labels</title>
  <style>${SHELF_LABEL_PRINT_CSS}</style>
</head>
<body>
  <div class="print-toolbar">
    <button onclick="window.print()">Print Labels</button>
  </div>
  <div class="shelf-label-batch">
    ${batch.labels.map(renderSingleLabelHtml).join("\n")}
  </div>
</body>
</html>`;
}
