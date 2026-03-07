import type { PickListRow, ProductionPickList, ProductionBundleSummary } from "@craft-and-board/shared";
import { filterRecordsForBundle, loadBundleSourceRecords, summarizeRecord } from "./grouping.js";

export function buildPickList(input: {
  bundle: ProductionBundleSummary;
  records: Awaited<ReturnType<typeof loadBundleSourceRecords>>;
}): ProductionPickList {
  const rows: PickListRow[] = filterRecordsForBundle(input.records, input.bundle.bundleCode)
    .map((record) => {
      const summary = summarizeRecord(record);

      return {
        shipByDate: summary.shipByDate,
        productLabel: record.productLabel,
        quantity: record.quantity,
        customerLastName: summary.customerLastName,
        orderId: summary.orderId,
        boxCode: null,
        totalShelfLengthIn: summary.widthIn,
        totalShelfDepthIn: summary.depthIn,
        materialCode: input.bundle.materialCode,
        orderItemId: record.id
      };
    })
    .sort((left, right) =>
      left.customerLastName.localeCompare(right.customerLastName) ||
      left.orderId.localeCompare(right.orderId)
    );

  return {
    bundleCode: input.bundle.bundleCode,
    shipByDate: input.bundle.shipByDate,
    materialCode: input.bundle.materialCode,
    productLabel: input.bundle.productLabel,
    totalLineItems: rows.length,
    totalQuantity: rows.reduce((sum, row) => sum + row.quantity, 0),
    rows
  };
}
