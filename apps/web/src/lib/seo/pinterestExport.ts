import type { PinterestPublishingEntry } from "./pinterest";

export type PinterestExportFilters = {
  board?: string;
  productFamily?: string;
  priority?: string;
  pageType?: string;
  refresh?: string;
  campaignKey?: string;
};

export function filterPinterestEntries(entries: PinterestPublishingEntry[], filters: PinterestExportFilters) {
  return entries.filter((entry) => {
    if (filters.board && filters.board !== "all" && entry.boardKey !== filters.board) {
      return false;
    }
    if (filters.productFamily && filters.productFamily !== "all" && entry.productFamily !== filters.productFamily) {
      return false;
    }
    if (filters.priority && filters.priority !== "all" && entry.publishPriority !== filters.priority) {
      return false;
    }
    if (filters.pageType && filters.pageType !== "all" && entry.pageType !== filters.pageType) {
      return false;
    }
    if (filters.campaignKey && filters.campaignKey !== "all" && entry.campaignKey !== filters.campaignKey) {
      return false;
    }
    if (filters.refresh === "true" && !entry.isRefreshCandidate) {
      return false;
    }

    return true;
  });
}

function escapeCsv(value: string | null | undefined) {
  const stringValue = value ?? "";
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function buildPinterestCsv(entries: PinterestPublishingEntry[]) {
  const rows = [
    [
      "Board",
      "Title",
      "Description",
      "Image URL",
      "Destination URL",
      "Publish Priority",
      "Freshness Tag",
      "Page Type",
      "Product Family",
      "Path",
      "Campaign Key",
      "Publish Status"
    ].join(","),
    ...entries.map((entry) =>
      [
        entry.boardLabel,
        entry.pinTitle,
        entry.pinDescription,
        entry.imageUrl,
        entry.utmDestinationUrl,
        entry.publishPriority,
        entry.freshnessTag,
        entry.pageType,
        entry.productFamily,
        entry.path,
        entry.campaignKey,
        entry.publishStatus
      ]
        .map(escapeCsv)
        .join(",")
    )
  ];

  return rows.join("\n");
}
