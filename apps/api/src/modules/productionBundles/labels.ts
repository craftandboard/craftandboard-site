import type { LabelExportRow, ProductionBundleSummary } from "@craft-and-board/shared";
import { filterRecordsForBundle, loadBundleSourceRecords, summarizeRecord } from "./grouping.js";

export function buildBundleLabels(input: {
  bundle: ProductionBundleSummary;
  records: Awaited<ReturnType<typeof loadBundleSourceRecords>>;
}): LabelExportRow[] {
  const expanded: Array<LabelExportRow & { sortInstance: number }> = filterRecordsForBundle(
    input.records,
    input.bundle.bundleCode
  )
    .flatMap((record) => {
      const summary = summarizeRecord(record);

      return record.parts.map((part) => ({
        shipByDate: summary.shipByDate,
        productLabel: record.productLabel,
        quantityDisplay: `${part.instanceNumber} of ${record.quantity}`,
        customerLastName: summary.customerLastName,
        orderId: summary.orderId,
        boxCode: null,
        totalShelfLengthIn: summary.widthIn,
        totalShelfDepthIn: summary.depthIn,
        thicknessIn: summary.thicknessIn,
        materialCode: input.bundle.materialCode,
        jobNumber: 0,
        partCode: part.partCode,
        qrPayload: part.qrPayload,
        sortInstance: part.instanceNumber
      }));
    })
    .sort((left, right) =>
      left.customerLastName.localeCompare(right.customerLastName) ||
      left.orderId.localeCompare(right.orderId) ||
      left.sortInstance - right.sortInstance
    );

  return expanded.map(({ sortInstance: _sortInstance, ...row }, index) => ({
    ...row,
    jobNumber: index + 1
  }));
}
