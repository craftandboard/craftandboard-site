import type { PinterestPublishingEntry, PinterestFreshnessTag, PinterestPublishPriority } from "./pinterest";
import type { PinterestBoardKey } from "./pinterestBoards";

export type PinterestPublishingPacket = {
  batchKey: string;
  batchLabel: string;
  createdAt: string;
  publishWindowLabel: string;
  boardKey: PinterestBoardKey | null;
  boardLabel: string | null;
  productFamily: string | null;
  topicCluster: string | null;
  publishPriority: PinterestPublishPriority;
  freshnessTag: PinterestFreshnessTag | null;
  entryCount: number;
  entries: PinterestPublishingEntry[];
};

function dedupe(entries: PinterestPublishingEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.dedupeKey)) {
      return false;
    }
    seen.add(entry.dedupeKey);
    return true;
  });
}

function buildPacket(input: {
  batchKey: string;
  batchLabel: string;
  publishWindowLabel: string;
  boardKey?: PinterestBoardKey | null;
  boardLabel?: string | null;
  productFamily?: string | null;
  topicCluster?: string | null;
  publishPriority: PinterestPublishPriority;
  freshnessTag?: PinterestFreshnessTag | null;
  entries: PinterestPublishingEntry[];
}) {
  const entries = dedupe(input.entries);

  return {
    batchKey: input.batchKey,
    batchLabel: input.batchLabel,
    createdAt: new Date().toISOString(),
    publishWindowLabel: input.publishWindowLabel,
    boardKey: input.boardKey ?? null,
    boardLabel: input.boardLabel ?? null,
    productFamily: input.productFamily ?? null,
    topicCluster: input.topicCluster ?? null,
    publishPriority: input.publishPriority,
    freshnessTag: input.freshnessTag ?? null,
    entryCount: entries.length,
    entries
  } satisfies PinterestPublishingPacket;
}

export function buildPinterestPublishingPackets(entries: PinterestPublishingEntry[]) {
  const ready = entries.filter((entry) => entry.exportStatus === "READY");
  const shelvesCommercial = ready.filter((entry) =>
    entry.productFamily === "floating-shelves" &&
    ["PRODUCT", "VARIANT", "VARIANT_COMBINATION", "CATEGORY"].includes(entry.pageType)
  );
  const mantelsCommercial = ready.filter((entry) =>
    entry.productFamily === "floating-mantels" &&
    ["PRODUCT", "VARIANT", "VARIANT_COMBINATION", "CATEGORY"].includes(entry.pageType)
  );
  const guidePins = ready.filter((entry) => entry.pageType === "GUIDE_ARTICLE" || entry.pageType === "GUIDE_INDEX");
  const refreshCandidates = entries.filter((entry) => entry.isRefreshCandidate);
  const newOrOptimized = ready.filter((entry) => entry.freshnessTag === "NEW");

  return [
    buildPacket({
      batchKey: "weekly-shelves-commercial",
      batchLabel: "Weekly Shelves Commercial Pins",
      publishWindowLabel: "This Week",
      boardKey: "floating-shelves",
      boardLabel: "Floating Shelves",
      productFamily: "floating-shelves",
      publishPriority: "HIGH",
      freshnessTag: "EVERGREEN",
      entries: shelvesCommercial
    }),
    buildPacket({
      batchKey: "weekly-mantels-commercial",
      batchLabel: "Weekly Mantels Commercial Pins",
      publishWindowLabel: "This Week",
      boardKey: "floating-mantels",
      boardLabel: "Floating Mantels",
      productFamily: "floating-mantels",
      publishPriority: "HIGH",
      freshnessTag: "EVERGREEN",
      entries: mantelsCommercial
    }),
    buildPacket({
      batchKey: "weekly-guides-authority",
      batchLabel: "Weekly Guides / Authority Pins",
      publishWindowLabel: "This Week",
      publishPriority: "MEDIUM",
      freshnessTag: "EVERGREEN",
      entries: guidePins
    }),
    buildPacket({
      batchKey: "refresh-candidates",
      batchLabel: "Refresh Candidates",
      publishWindowLabel: "Refresh Queue",
      publishPriority: "HIGH",
      freshnessTag: "REFRESH_SOON",
      entries: refreshCandidates
    }),
    buildPacket({
      batchKey: "new-optimized-pages",
      batchLabel: "New / Recently Optimized Pages",
      publishWindowLabel: "Publish Soon",
      publishPriority: "HIGH",
      freshnessTag: "NEW",
      entries: newOrOptimized
    })
  ].filter((packet) => packet.entryCount > 0);
}
