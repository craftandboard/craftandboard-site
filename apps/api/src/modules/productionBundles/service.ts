import type { ProductionBundleSummary } from "@craft-and-board/shared";
import { buildBundleFiles, renderLabelsCsv, renderOptimizerCsv } from "./fileRenderers.js";
import { buildBundleSummaries, loadBundleSourceRecords } from "./grouping.js";
import { buildBundleLabels } from "./labels.js";
import { buildLegacyXmlBundle } from "./legacyXml.js";
import { buildOptimizerRows } from "./optimizer.js";
import { buildPickList } from "./pickList.js";
import type { ProductionBundleDetail } from "./types.js";

export async function listProductionBundles(): Promise<ProductionBundleSummary[]> {
  const records = await loadBundleSourceRecords();
  return buildBundleSummaries(records);
}

export async function rebuildProductionBundles(): Promise<ProductionBundleSummary[]> {
  return listProductionBundles();
}

export async function getBundlePickList(bundleCode: string) {
  const records = await loadBundleSourceRecords();
  const summary = buildBundleSummaries(records).find((bundle) => bundle.bundleCode === bundleCode);

  if (!summary) {
    throw new Error(`Production bundle not found: ${bundleCode}`);
  }

  return buildPickList({ bundle: summary, records });
}

export async function getBundleLabels(bundleCode: string) {
  const records = await loadBundleSourceRecords();
  const summary = buildBundleSummaries(records).find((bundle) => bundle.bundleCode === bundleCode);

  if (!summary) {
    throw new Error(`Production bundle not found: ${bundleCode}`);
  }

  const rows = buildBundleLabels({ bundle: summary, records });
  return { summary, rows, csv: renderLabelsCsv(rows) };
}

export async function getBundleOptimizer(bundleCode: string) {
  const records = await loadBundleSourceRecords();
  const summary = buildBundleSummaries(records).find((bundle) => bundle.bundleCode === bundleCode);

  if (!summary) {
    throw new Error(`Production bundle not found: ${bundleCode}`);
  }

  const rows = buildOptimizerRows({ bundle: summary, records });
  return { summary, rows, csv: renderOptimizerCsv(rows) };
}

export async function getBundleLegacyXml(bundleCode: string) {
  const records = await loadBundleSourceRecords();
  const summary = buildBundleSummaries(records).find((bundle) => bundle.bundleCode === bundleCode);

  if (!summary) {
    throw new Error(`Production bundle not found: ${bundleCode}`);
  }

  return buildLegacyXmlBundle({ bundle: summary, records });
}

export async function getProductionBundleDetail(bundleCode: string): Promise<ProductionBundleDetail> {
  const records = await loadBundleSourceRecords();
  const summary = buildBundleSummaries(records).find((bundle) => bundle.bundleCode === bundleCode);

  if (!summary) {
    throw new Error(`Production bundle not found: ${bundleCode}`);
  }

  const pickList = buildPickList({ bundle: summary, records });
  const labels = buildBundleLabels({ bundle: summary, records });
  const optimizer = buildOptimizerRows({ bundle: summary, records });
  const legacyXml = buildLegacyXmlBundle({ bundle: summary, records });

  return {
    summary,
    pickList,
    labels: {
      totalRows: labels.length,
      rows: labels,
      csv: buildBundleFiles({
        summary,
        pickList,
        labels,
        optimizer,
        legacyXml: legacyXml.xml,
        xmlProductCount: legacyXml.products.length
      }).labelsCsv
    },
    optimizer: {
      totalRows: optimizer.length,
      rows: optimizer,
      csv: buildBundleFiles({
        summary,
        pickList,
        labels,
        optimizer,
        legacyXml: legacyXml.xml,
        xmlProductCount: legacyXml.products.length
      }).optimizerCsv
    },
    legacyXml,
    files: buildBundleFiles({
      summary,
      pickList,
      labels,
      optimizer,
      legacyXml: legacyXml.xml,
      xmlProductCount: legacyXml.products.length
    })
  };
}
