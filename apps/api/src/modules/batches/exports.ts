function csvCell(value: string | number | undefined) {
  const text = value === undefined ? "" : String(value);
  const escaped = text.replaceAll('"', '""');
  return `"${escaped}"`;
}

function csvRow(values: Array<string | number | undefined>) {
  return `${values.map(csvCell).join(",")}\n`;
}

export function buildBatchLabelCsv(input: {
  batchCode: string;
  labels: Array<{
    partId: string;
    jobId?: string;
    labelCode: string;
    scanCode: string;
    partType: string;
    material: string;
    width: number;
    depth: number;
    thickness: number;
    edgeBandPattern: string;
    source: string;
    currentStatus?: string;
  }>;
}) {
  const header = csvRow([
    "batchCode",
    "partId",
    "jobId",
    "labelCode",
    "scanCode",
    "partType",
    "material",
    "width",
    "depth",
    "thickness",
    "edgeBandPattern",
    "source",
    "currentStatus"
  ]);

  const rows = input.labels.map((label) =>
    csvRow([
      input.batchCode,
      label.partId,
      label.jobId,
      label.labelCode,
      label.scanCode,
      label.partType,
      label.material,
      label.width,
      label.depth,
      label.thickness,
      label.edgeBandPattern,
      label.source,
      label.currentStatus
    ])
  );

  return Buffer.from(`${header}${rows.join("")}`, "utf8");
}
