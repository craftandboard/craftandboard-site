import { renderShelfLabelBatchHtml } from "./htmlRenderer.js";
import type { RenderedShelfLabelBatch } from "./types.js";

export function buildShelfLabelBatchResponse(batch: RenderedShelfLabelBatch) {
  return {
    bundleCode: batch.bundleCode,
    labelCount: batch.labelCount,
    labels: batch.labels,
    html: renderShelfLabelBatchHtml(batch)
  };
}
