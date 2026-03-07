import type { LegacyXmlExportResult } from "@craft-and-board/shared";

export type { LegacyXmlExportResult };

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

export function renderLegacyXml(input: {
  shipByDate: string;
  rows: Array<{
    partCode: string;
    materialCode: string;
    widthMm: number;
    depthMm: number;
    customerLastName: string;
  }>;
}): LegacyXmlExportResult {
  const xmlRows = input.rows
    .map(
      (row) => `  <Part code="${escapeXml(row.partCode)}" material="${escapeXml(
        row.materialCode
      )}" widthMm="${row.widthMm}" depthMm="${row.depthMm}" customer="${escapeXml(
        row.customerLastName
      )}" />`
    )
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<MZKORDPlaceholder shipByDate="${escapeXml(input.shipByDate)}">`,
    xmlRows,
    "</MZKORDPlaceholder>"
  ].join("\n");

  return {
    shipByDate: input.shipByDate,
    partCount: input.rows.length,
    xml,
    warning: "Legacy XML export is a migration bridge only and is not production-ready."
  };
}
