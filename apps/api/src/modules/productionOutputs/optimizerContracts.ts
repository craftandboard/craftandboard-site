import type { OptimizerRow } from "@craft-and-board/shared";

export type { OptimizerRow };

export function renderOptimizerCsv(rows: OptimizerRow[]): string {
  const header = [
    "shipByDate",
    "partCode",
    "materialCode",
    "customerLastName",
    "widthMm",
    "depthMm",
    "edgeBandPattern"
  ];

  const lines = rows.map((row) =>
    [
      row.shipByDate,
      row.partCode,
      row.materialCode,
      row.customerLastName,
      row.widthMm,
      row.depthMm,
      row.edgeBandPattern
    ].join(",")
  );

  return [header.join(","), ...lines].join("\n");
}
