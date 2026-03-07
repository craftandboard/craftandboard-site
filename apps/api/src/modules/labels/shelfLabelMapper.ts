import type { ShelfLabelData } from "@craft-and-board/shared";
import type { LabelExportRow } from "../../modules/productionBundles/types.js";

function formatInches(value: number): string {
  return `${Number(value.toFixed(3)).toString()}"`;
}

export function mapBundleLabelRowToShelfLabel(input: {
  bundleCode: string;
  row: LabelExportRow;
}): ShelfLabelData {
  return {
    bundleCode: input.bundleCode,
    shipByDate: input.row.shipByDate,
    productLabel: input.row.productLabel,
    quantityDisplay: input.row.quantityDisplay,
    customerLastName: input.row.customerLastName,
    orderId: input.row.orderId,
    boxCode: input.row.boxCode,
    shelfLengthIn: formatInches(input.row.totalShelfLengthIn),
    shelfDepthIn: formatInches(input.row.totalShelfDepthIn),
    jobNumber: input.row.jobNumber,
    partCode: input.row.partCode,
    barcodeValue: input.row.orderId,
    materialCode: input.row.materialCode
  };
}
