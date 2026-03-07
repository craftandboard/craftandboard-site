import type { ShelfLabelBatch } from "@craft-and-board/shared";
import { getBundleLabels, listProductionBundles } from "../productionBundles/service.js";
import { renderOrderBarcodeSvg } from "./barcode.js";
import { mapBundleLabelRowToShelfLabel } from "./shelfLabelMapper.js";
import type { RenderedShelfLabelBatch, RenderedShelfLabelData } from "./types.js";

export async function listLabelBundleSummaries() {
  const bundles = await listProductionBundles();

  return bundles.map((bundle) => ({
    bundleCode: bundle.bundleCode,
    shipByDate: bundle.shipByDate,
    materialCode: bundle.materialCode,
    productLabel: bundle.productLabel,
    labelCount: bundle.totalPhysicalParts
  }));
}

export async function getShelfLabelBatch(bundleCode: string): Promise<ShelfLabelBatch> {
  const labelBundle = await getBundleLabels(bundleCode);
  const labels = labelBundle.rows.map((row) =>
    mapBundleLabelRowToShelfLabel({
      bundleCode,
      row
    })
  );

  return {
    bundleCode,
    labelCount: labels.length,
    labels
  };
}

export async function getRenderedShelfLabelBatch(
  bundleCode: string
): Promise<RenderedShelfLabelBatch> {
  const batch = await getShelfLabelBatch(bundleCode);
  const labels: RenderedShelfLabelData[] = await Promise.all(
    batch.labels.map(async (label) => ({
      ...label,
      barcodeSvg: await renderOrderBarcodeSvg(label.barcodeValue)
    }))
  );

  return {
    bundleCode: batch.bundleCode,
    labelCount: batch.labelCount,
    labels
  };
}

export async function getSingleShelfLabel(bundleCode: string, partCode: string) {
  const batch = await getRenderedShelfLabelBatch(bundleCode);
  return batch.labels.find((label) => label.partCode === partCode) ?? null;
}
