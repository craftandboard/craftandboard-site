import type {
  LabelExportRow,
  OptimizerExportRow,
  ProductionBundleSummary,
  ProductionPickList
} from "@craft-and-board/shared";
import type { ProductionBundleFiles } from "./types.js";

function csvEscape(value: string | number | null): string {
  if (value === null) {
    return "";
  }

  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes("\"")) {
    return `"${stringValue.replaceAll("\"", "\"\"")}"`;
  }

  return stringValue;
}

export function renderPickListCsv(pickList: ProductionPickList): string {
  const header = [
    "Ship By Date",
    "Product",
    "Qty",
    "Last Name",
    "Order ID",
    "Box Code",
    "Total Shelf Length",
    "Total Shelf Depth"
  ];

  const rows = pickList.rows.map((row) =>
    [
      row.shipByDate,
      row.productLabel,
      row.quantity,
      row.customerLastName,
      row.orderId,
      row.boxCode,
      row.totalShelfLengthIn,
      row.totalShelfDepthIn
    ]
      .map(csvEscape)
      .join(",")
  );

  return [header.join(","), ...rows].join("\n");
}

export function renderPickListHtml(pickList: ProductionPickList): string {
  const bodyRows = pickList.rows
    .map(
      (row) => `<tr>
  <td>${row.shipByDate}</td>
  <td>${row.productLabel}</td>
  <td>${row.quantity}</td>
  <td>${row.customerLastName}</td>
  <td>${row.orderId}</td>
  <td>${row.boxCode ?? ""}</td>
  <td>${row.totalShelfLengthIn}</td>
  <td>${row.totalShelfDepthIn}</td>
</tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${pickList.bundleCode} Pick List</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #d9d9d9; padding: 8px; text-align: left; }
    th { background: #f2f7f3; }
  </style>
</head>
<body>
  <h1>${pickList.bundleCode}</h1>
  <p>Ship By ${pickList.shipByDate} · ${pickList.productLabel}</p>
  <table>
    <thead>
      <tr>
        <th>Ship By Date</th>
        <th>Product</th>
        <th>Qty</th>
        <th>Last Name</th>
        <th>Order ID</th>
        <th>Box Code</th>
        <th>Total Shelf Length</th>
        <th>Total Shelf Depth</th>
      </tr>
    </thead>
    <tbody>
${bodyRows}
    </tbody>
  </table>
</body>
</html>`;
}

export function renderLabelsCsv(rows: LabelExportRow[]): string {
  const header = [
    "Ship By Date",
    "Product SKU",
    "Qty",
    "Last Name",
    "Order ID",
    "Box Code",
    "Total Shelf Length",
    "Total Shelf Depth",
    "Job#"
  ];

  const lines = rows.map((row) =>
    [
      row.shipByDate,
      row.productLabel,
      row.quantityDisplay,
      row.customerLastName,
      row.orderId,
      row.boxCode,
      row.totalShelfLengthIn,
      row.totalShelfDepthIn,
      row.jobNumber
    ]
      .map(csvEscape)
      .join(",")
  );

  return [header.join(","), ...lines].join("\n");
}

export function renderOptimizerCsv(rows: OptimizerExportRow[]): string {
  const header = ["1", "depthMm", "widthMm", "customerLastName", "sequenceNumber", "None", "None", "None", "None"];
  const lines = rows.map((row) =>
    [
      row.rowType,
      row.depthMm,
      row.widthMm,
      row.customerLastName,
      row.sequenceNumber,
      row.field6,
      row.field7,
      row.field8,
      row.field9
    ]
      .map(csvEscape)
      .join(",")
  );

  return [header.join(","), ...lines].join("\n");
}

export function renderBundleManifestJson(input: {
  summary: ProductionBundleSummary;
  pickList: ProductionPickList;
  labelCount: number;
  optimizerCount: number;
  xmlProductCount: number;
}): string {
  return JSON.stringify(
    {
      bundleCode: input.summary.bundleCode,
      shipByDate: input.summary.shipByDate,
      materialCode: input.summary.materialCode,
      productLabel: input.summary.productLabel,
      totalLineItems: input.summary.totalLineItems,
      totalPhysicalParts: input.summary.totalPhysicalParts,
      pickListRows: input.pickList.rows.length,
      labelRows: input.labelCount,
      optimizerRows: input.optimizerCount,
      xmlProducts: input.xmlProductCount
    },
    null,
    2
  );
}

export function buildBundleFiles(input: {
  summary: ProductionBundleSummary;
  pickList: ProductionPickList;
  labels: LabelExportRow[];
  optimizer: OptimizerExportRow[];
  legacyXml: string;
  xmlProductCount: number;
}): ProductionBundleFiles {
  return {
    manifestJson: renderBundleManifestJson({
      summary: input.summary,
      pickList: input.pickList,
      labelCount: input.labels.length,
      optimizerCount: input.optimizer.length,
      xmlProductCount: input.xmlProductCount
    }),
    pickListHtml: renderPickListHtml(input.pickList),
    pickListCsv: renderPickListCsv(input.pickList),
    labelsCsv: renderLabelsCsv(input.labels),
    optimizerCsv: renderOptimizerCsv(input.optimizer),
    legacyXml: input.legacyXml
  };
}
