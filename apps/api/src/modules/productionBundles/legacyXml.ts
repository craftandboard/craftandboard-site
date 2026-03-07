import type { LegacyXmlBundleExport, LegacyXmlProductRow, ProductionBundleSummary } from "@craft-and-board/shared";
import { filterRecordsForBundle, loadBundleSourceRecords, summarizeRecord } from "./grouping.js";
import { isSupportedBundleMaterial, legacyXmlName } from "./naming.js";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildLegacyXmlBundle(input: {
  bundle: ProductionBundleSummary;
  records: Awaited<ReturnType<typeof loadBundleSourceRecords>>;
}): LegacyXmlBundleExport {
  if (!isSupportedBundleMaterial(input.bundle.materialCode)) {
    throw new Error(`Unsupported material for legacy XML bundle: ${input.bundle.materialCode}`);
  }

  const supportedMaterial = input.bundle.materialCode;

  const products: LegacyXmlProductRow[] = filterRecordsForBundle(input.records, input.bundle.bundleCode)
    .map((record) => {
      const summary = summarizeRecord(record);

      return {
        quantity: record.quantity,
        name: legacyXmlName(supportedMaterial),
        library: "#1 Craft & Board Products",
        description: summary.customerLastName,
        depthIn: summary.depthIn,
        heightIn: summary.thicknessIn,
        widthIn: summary.widthIn
      };
    })
    .sort((left, right) => left.description.localeCompare(right.description));

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<Order>",
    ...products.map(
      (product) =>
        `  <Product QTY="${product.quantity}" Name="${escapeXml(product.name)}" Library="${escapeXml(
          product.library
        )}" Description="${escapeXml(product.description)}" Depth="${product.depthIn}" Height="${product.heightIn}" Width="${product.widthIn}" />`
    ),
    "</Order>"
  ].join("\n");

  return {
    bundleCode: input.bundle.bundleCode,
    shipByDate: input.bundle.shipByDate,
    materialCode: supportedMaterial,
    products,
    xml,
    warning: "Legacy XML export is a migration bridge and is not production-final."
  };
}
