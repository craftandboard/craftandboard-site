import type { OptimizerExportRow, ProductionBundleSummary } from "@craft-and-board/shared";
import { inchesToMillimeters } from "../imports/dimension.js";
import { loadBundleSourceRecords } from "./grouping.js";
import { buildBundleLabels } from "./labels.js";

export function buildOptimizerRows(input: {
  bundle: ProductionBundleSummary;
  records: Awaited<ReturnType<typeof loadBundleSourceRecords>>;
}): OptimizerExportRow[] {
  const labels = buildBundleLabels(input);

  return labels.map((label, index) => ({
    rowType: "1",
    depthMm: inchesToMillimeters(label.totalShelfDepthIn),
    widthMm: inchesToMillimeters(label.totalShelfLengthIn),
    customerLastName: label.customerLastName,
    sequenceNumber: index + 1,
    field6: "None",
    field7: "None",
    field8: "None",
    field9: "None",
    partCode: label.partCode,
    materialCode: label.materialCode
  }));
}
