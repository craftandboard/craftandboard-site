function csvCell(value: string | number | boolean | undefined) {
  const text = value === undefined ? "" : String(value);
  const escaped = text.replaceAll('"', '""');
  return `"${escaped}"`;
}

function csvRow(values: Array<string | number | boolean | undefined>) {
  return `${values.map(csvCell).join(",")}\n`;
}

export interface CncExportInput {
  batchId: string;
  batchCode: string;
  sheets: Array<{
    sheetIndex: number;
    material: string;
    sheetWidth: number;
    sheetHeight: number;
    placements: Array<{
      partId: string;
      labelCode: string;
      scanCode: string;
      x: number;
      y: number;
      width: number;
      depth: number;
      thickness: number;
      material: string;
      cutMethod: string;
      partType: string;
      quantity: number;
      grain: "WIDTH";
      edgeBandPattern: string;
      edgeBandTop: boolean;
      edgeBandBottom: boolean;
      edgeBandLeft: boolean;
      edgeBandRight: boolean;
      source: "CONFIGURATOR" | "AMAZON";
    }>;
  }>;
}

export interface CncExportAdapter {
  artifactType: "batch-cnc-csv" | "batch-cnc-mosaic" | "batch-cnc-json";
  fileName(version: number): string;
  mimeType: string;
  generatedFromPrefix: string;
  generate(input: CncExportInput): Buffer;
}

export function generateCsv(input: CncExportInput) {
  const header = csvRow([
    "batchCode",
    "sheetIndex",
    "material",
    "sheetWidth",
    "sheetHeight",
    "partId",
    "labelCode",
    "scanCode",
    "x",
    "y",
    "width",
    "depth",
    "cutMethod",
    "partType"
  ]);

  const rows = input.sheets.flatMap((sheet) =>
    sheet.placements.map((placement) =>
      csvRow([
        input.batchCode,
        sheet.sheetIndex,
        sheet.material,
        sheet.sheetWidth,
        sheet.sheetHeight,
        placement.partId,
        placement.labelCode,
        placement.scanCode,
        placement.x,
        placement.y,
        placement.width,
        placement.depth,
        placement.cutMethod,
        placement.partType
      ])
    )
  );

  return Buffer.from(`${header}${rows.join("")}`, "utf8");
}

export function generateMosaicCsv(input: CncExportInput) {
  const header = csvRow([
    "batchCode",
    "sheetIndex",
    "partId",
    "labelCode",
    "material",
    "quantity",
    "width",
    "depth",
    "thickness",
    "grain",
    "edgeBandTop",
    "edgeBandBottom",
    "edgeBandLeft",
    "edgeBandRight"
  ]);

  const rows = input.sheets.flatMap((sheet) =>
    sheet.placements.map((placement) =>
      csvRow([
        input.batchCode,
        sheet.sheetIndex,
        placement.partId,
        placement.labelCode,
        placement.material,
        placement.quantity,
        placement.width,
        placement.depth,
        placement.thickness,
        placement.grain,
        placement.edgeBandTop,
        placement.edgeBandBottom,
        placement.edgeBandLeft,
        placement.edgeBandRight
      ])
    )
  );

  return Buffer.from(`${header}${rows.join("")}`, "utf8");
}

export function generateJson(input: CncExportInput) {
  return Buffer.from(
    JSON.stringify(
      {
        batchId: input.batchId,
        batchCode: input.batchCode,
        format: "FOUNDATION_JSON_EXPORT",
        sheetCount: input.sheets.length,
        partCount: input.sheets.reduce((sum, sheet) => sum + sheet.placements.length, 0),
        sheets: input.sheets
      },
      null,
      2
    ),
    "utf8"
  );
}

export const defaultCncCsvAdapter: CncExportAdapter = {
  artifactType: "batch-cnc-csv",
  fileName(version) {
    return `cnc-export-v${version}.csv`;
  },
  mimeType: "text/csv",
  generatedFromPrefix: "CNC",
  generate: generateCsv
};

export const mosaicCncAdapter: CncExportAdapter = {
  artifactType: "batch-cnc-mosaic",
  fileName(version) {
    return `cnc-mosaic-v${version}.csv`;
  },
  mimeType: "text/csv",
  generatedFromPrefix: "MOSAIC",
  generate: generateMosaicCsv
};

export const cncJsonAdapter: CncExportAdapter = {
  artifactType: "batch-cnc-json",
  fileName(version) {
    return `cnc-export-v${version}.json`;
  },
  mimeType: "application/json",
  generatedFromPrefix: "CNC_JSON",
  generate: generateJson
};
