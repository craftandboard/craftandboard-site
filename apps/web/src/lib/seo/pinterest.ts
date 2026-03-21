import { marketingUrl } from "../site-config";
import type { SeoOpportunity } from "./opportunities";
import { resolveSeoMetadata, resolveSeoOverrides } from "./overrideResolver";
import { resolveBoardForPage, type PinterestBoardDefinition, type PinterestBoardKey } from "./pinterestBoards";
import { getSeoSocialImageUrls } from "./socialImages";
import type { SeoInventoryEntry, SeoPageType } from "./inventory";

export type PinterestImageFormat = "PINTEREST_VERTICAL" | "OPEN_GRAPH_LANDSCAPE";
export type PinterestExportStatus = "READY" | "DEFERRED" | "SKIPPED";
export type PinterestPublishPriority = "HIGH" | "MEDIUM" | "LOW";
export type PinterestFreshnessTag = "EVERGREEN" | "SEASONAL" | "REFRESH_SOON" | "NEW";
export type PinterestPublishStatus = "NOT_PUBLISHED" | "EXPORTED" | "PUBLISHED" | "REFRESH_CANDIDATE" | "SKIPPED";
export type PinterestCadence = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "REFRESH_ONLY";

export type PinterestPublishingEntry = {
  pageKey: SeoInventoryEntry["pageKey"];
  pageType: SeoPageType;
  path: string;
  destinationUrl: string;
  utmDestinationUrl: string;
  pinTitle: string;
  pinDescription: string;
  imageUrl: string;
  imageFormat: PinterestImageFormat;
  boardKey: PinterestBoardKey;
  boardLabel: string;
  topicCluster: SeoInventoryEntry["topicCluster"];
  productFamily: SeoInventoryEntry["productFamily"];
  keywordHint: string | null;
  publishPriority: PinterestPublishPriority;
  freshnessTag: PinterestFreshnessTag | null;
  exportStatus: PinterestExportStatus;
  publishStatus: PinterestPublishStatus;
  cadence: PinterestCadence;
  lastExportedAt: string | null;
  lastPublishedAt: string | null;
  publishNotes: string | null;
  dedupeKey: string;
  isRefreshCandidate: boolean;
  campaignKey: string | null;
  notes: string | null;
};

function stripBrandSuffix(value: string) {
  return value.replace(/\s+\|\s+Craft & Board$/, "").trim();
}

function normalizePageKeyForUtm(pageKey: SeoInventoryEntry["pageKey"]) {
  return pageKey
    .toLowerCase()
    .replace(/:/g, "-")
    .replace(/[^a-z0-9-]+/g, "-");
}

export function buildPinterestDestinationUrl(path: string) {
  return marketingUrl(path);
}

export function buildPinterestUtmDestinationUrl(input: {
  path: string;
  pageKey: SeoInventoryEntry["pageKey"];
}) {
  const url = new URL(marketingUrl(input.path));
  url.searchParams.set("utm_source", "pinterest");
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", "organic-pin");
  url.searchParams.set("utm_content", normalizePageKeyForUtm(input.pageKey));
  return url.toString();
}

function resolveFreshnessTag(entry: SeoInventoryEntry, hasOverride: boolean): PinterestFreshnessTag | null {
  if (hasOverride) {
    return "NEW";
  }
  if (entry.pageType === "GUIDE_ARTICLE") {
    return entry.topicCluster === "styling-design" || entry.topicCluster === "design-ideas"
      ? "REFRESH_SOON"
      : "EVERGREEN";
  }
  if (entry.pageType === "VARIANT" || entry.pageType === "VARIANT_COMBINATION" || entry.pageType === "PRODUCT") {
    return "EVERGREEN";
  }
  return null;
}

function resolvePublishPriority(input: {
  entry: SeoInventoryEntry;
  opportunitiesByPath: Map<string, SeoOpportunity[]>;
}): PinterestPublishPriority {
  const opportunities = input.opportunitiesByPath.get(input.entry.path) ?? [];
  const highOpportunity = opportunities.some((opportunity) => opportunity.priorityScore >= 75);

  if (
    highOpportunity ||
    input.entry.pageType === "PRODUCT" ||
    input.entry.pageType === "VARIANT_COMBINATION" ||
    (input.entry.pageType === "GUIDE_ARTICLE" && input.entry.priority >= 0.72)
  ) {
    return "HIGH";
  }

  if (
    input.entry.pageType === "CATEGORY" ||
    input.entry.pageType === "VARIANT" ||
    input.entry.pageType === "GUIDE_INDEX" ||
    input.entry.priority >= 0.78
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

function resolveExportStatus(input: {
  entry: SeoInventoryEntry;
  priority: PinterestPublishPriority;
}): PinterestExportStatus {
  if (!input.entry.isIndexable) {
    return "SKIPPED";
  }

  if (input.entry.pageType === "HOME" || input.entry.pageType === "STATIC_PAGE") {
    return input.priority === "HIGH" ? "READY" : "DEFERRED";
  }

  return "READY";
}

function resolveCadence(entry: SeoInventoryEntry, freshnessTag: PinterestFreshnessTag | null): PinterestCadence {
  if (freshnessTag === "REFRESH_SOON") {
    return "REFRESH_ONLY";
  }
  if (entry.pageType === "PRODUCT" || entry.pageType === "VARIANT_COMBINATION") {
    return "WEEKLY";
  }
  if (entry.pageType === "VARIANT" || entry.pageType === "GUIDE_ARTICLE") {
    return entry.topicCluster === "installation" || entry.topicCluster === "weight-capacity" ? "BIWEEKLY" : "WEEKLY";
  }
  if (entry.pageType === "CATEGORY" || entry.pageType === "GUIDE_INDEX") {
    return "BIWEEKLY";
  }
  return "MONTHLY";
}

function resolveRefreshCandidate(input: {
  freshnessTag: PinterestFreshnessTag | null;
  hasOverride: boolean;
  priority: PinterestPublishPriority;
}) {
  return Boolean(
    input.freshnessTag === "REFRESH_SOON" ||
    input.freshnessTag === "NEW" ||
    (input.hasOverride && input.priority === "HIGH")
  );
}

function resolvePublishStatus(input: {
  exportStatus: PinterestExportStatus;
  isRefreshCandidate: boolean;
}) : PinterestPublishStatus {
  if (input.exportStatus === "SKIPPED") {
    return "SKIPPED";
  }
  if (input.isRefreshCandidate) {
    return "REFRESH_CANDIDATE";
  }
  return "NOT_PUBLISHED";
}

function dedupeKeyForEntry(entry: SeoInventoryEntry) {
  return `${entry.pageKey}:${entry.path}`;
}

function campaignKeyForEntry(input: {
  entry: SeoInventoryEntry;
  board: PinterestBoardDefinition;
  priority: PinterestPublishPriority;
}) {
  const family = input.entry.productFamily ?? "brand";
  const bucket =
    input.entry.pageType === "GUIDE_ARTICLE" || input.entry.pageType === "GUIDE_INDEX"
      ? "guides"
      : input.entry.pageType === "PRODUCT" || input.entry.pageType === "VARIANT" || input.entry.pageType === "VARIANT_COMBINATION"
        ? "commercial"
        : "broad";

  return `${bucket}:${family}:${input.board.key}:${input.priority.toLowerCase()}`;
}

function buildPinterestTitle(input: {
  entry: SeoInventoryEntry;
  title: string;
  keywordHint: string | null;
}) {
  if (input.entry.path === "/guides/how-to-measure-cabinet-shelves") {
    return "How to Measure Cabinet Shelves";
  }

  const title = stripBrandSuffix(input.title);

  if (input.entry.pageType === "GUIDE_ARTICLE" || input.entry.pageType === "GUIDE_INDEX") {
    return title;
  }

  if (input.entry.pageType === "CATEGORY" && input.entry.productFamily === "floating-shelves") {
    return "Custom Floating Shelves for Design-Led Rooms";
  }
  if (input.entry.pageType === "CATEGORY" && input.entry.productFamily === "floating-mantels") {
    return "Custom Floating Mantels for Modern Fireplace Walls";
  }
  if (input.entry.pageType === "HOME") {
    return "Custom Floating Shelves and Mantels";
  }
  if (input.entry.pageType === "STATIC_PAGE" && input.entry.path === "/gallery") {
    return "Floating Shelf and Mantel Inspiration";
  }
  if (
    (input.entry.pageType === "VARIANT" || input.entry.pageType === "VARIANT_COMBINATION") &&
    input.entry.topicCluster === "use-cases" &&
    !/ideas/i.test(title)
  ) {
    return `${title} Ideas`;
  }

  return input.keywordHint && input.keywordHint.length <= 80
    ? stripBrandSuffix(input.keywordHint.replace(/\b\w/g, (match) => match.toUpperCase()))
    : title;
}

function buildPinterestDescription(input: {
  entry: SeoInventoryEntry;
  description: string;
  keywordHint: string | null;
  board: PinterestBoardDefinition;
}) {
  if (input.entry.path === "/guides/how-to-measure-cabinet-shelves") {
    return "Learn how to measure your cabinet shelf the right way before ordering replacement shelves. Simple step-by-step guide for kitchen cabinets.";
  }

  const title = stripBrandSuffix(input.description);
  const keyword = input.keywordHint ?? stripBrandSuffix(input.entry.title).toLowerCase();

  if (input.entry.pageType === "GUIDE_ARTICLE") {
    return `Learn ${keyword}, get practical planning guidance, and move into the right Craft & Board shelf or mantel path when you're ready to design the real project.`;
  }

  if (input.entry.pageType === "CATEGORY" || input.entry.pageType === "HOME") {
    return `Explore ${keyword} from Craft & Board, including design-led product paths, material direction, and landing pages worth saving for later.`;
  }

  if (input.entry.pageType === "PRODUCT" || input.entry.pageType === "VARIANT" || input.entry.pageType === "VARIANT_COMBINATION") {
    return `Explore ${keyword} from Craft & Board, compare design direction, and move into a made-to-order configurator path with custom sizing and premium wood detail.`;
  }

  return `${title} Save this ${input.board.label.toLowerCase()} path from Craft & Board and click through for the full page when you're ready to explore more.`;
}

export function generatePinterestEntry(input: {
  entry: SeoInventoryEntry;
  opportunitiesByPath?: Map<string, SeoOpportunity[]>;
}) {
  const resolvedMetadata = resolveSeoMetadata({
    pageKey: input.entry.pageKey,
    title: input.entry.title,
    description: input.entry.description
  });
  const override = resolveSeoOverrides(input.entry.pageKey);
  const board = resolveBoardForPage(input.entry);
  const socialImages = getSeoSocialImageUrls({
    pageKey: input.entry.pageKey,
    pathname: input.entry.path
  });
  const opportunitiesByPath = input.opportunitiesByPath ?? new Map<string, SeoOpportunity[]>();
  const publishPriority = resolvePublishPriority({
    entry: input.entry,
    opportunitiesByPath
  });
  const exportStatus = resolveExportStatus({
    entry: input.entry,
    priority: publishPriority
  });
  const keywordHint = override?.keywordTargetHint ?? null;
  const freshnessTag = resolveFreshnessTag(input.entry, Boolean(override));
  const cadence = resolveCadence(input.entry, freshnessTag);
  const isRefreshCandidate = resolveRefreshCandidate({
    freshnessTag,
    hasOverride: Boolean(override),
    priority: publishPriority
  });
  const publishStatus = resolvePublishStatus({
    exportStatus,
    isRefreshCandidate
  });

  return {
    pageKey: input.entry.pageKey,
    pageType: input.entry.pageType,
    path: input.entry.path,
    destinationUrl: buildPinterestDestinationUrl(input.entry.path),
    utmDestinationUrl: buildPinterestUtmDestinationUrl({
      path: input.entry.path,
      pageKey: input.entry.pageKey
    }),
    pinTitle: buildPinterestTitle({
      entry: input.entry,
      title: String(resolvedMetadata.title),
      keywordHint
    }),
    pinDescription: buildPinterestDescription({
      entry: input.entry,
      description: String(resolvedMetadata.description),
      keywordHint,
      board
    }),
    imageUrl: socialImages?.pinterest ?? socialImages?.og ?? marketingUrl("/api/seo-image/home/home?format=pinterest"),
    imageFormat: "PINTEREST_VERTICAL" as const,
    boardKey: board.key,
    boardLabel: board.label,
    topicCluster: input.entry.topicCluster,
    productFamily: input.entry.productFamily,
    keywordHint,
    publishPriority,
    freshnessTag,
    exportStatus,
    publishStatus,
    cadence,
    lastExportedAt: null,
    lastPublishedAt: null,
    publishNotes: override?.refreshNote ?? null,
    dedupeKey: dedupeKeyForEntry(input.entry),
    isRefreshCandidate,
    campaignKey: campaignKeyForEntry({
      entry: input.entry,
      board,
      priority: publishPriority
    }),
    notes: override?.refreshNote ?? null
  } satisfies PinterestPublishingEntry;
}

export function generatePinterestEntries(input: {
  inventory: SeoInventoryEntry[];
  opportunities?: SeoOpportunity[];
}) {
  const opportunitiesByPath = (input.opportunities ?? []).reduce((accumulator, opportunity) => {
    const current = accumulator.get(opportunity.path) ?? [];
    current.push(opportunity);
    accumulator.set(opportunity.path, current);
    return accumulator;
  }, new Map<string, SeoOpportunity[]>());

  return input.inventory
    .filter((entry) => entry.isIndexable)
    .map((entry) =>
      generatePinterestEntry({
        entry,
        opportunitiesByPath
      })
    )
    .sort((left, right) => {
      const statusScore = { READY: 3, DEFERRED: 2, SKIPPED: 1 }[left.exportStatus] - { READY: 3, DEFERRED: 2, SKIPPED: 1 }[right.exportStatus];
      if (statusScore !== 0) {
        return statusScore < 0 ? 1 : -1;
      }
      const priorityScore = { HIGH: 3, MEDIUM: 2, LOW: 1 }[left.publishPriority] - { HIGH: 3, MEDIUM: 2, LOW: 1 }[right.publishPriority];
      if (priorityScore !== 0) {
        return priorityScore < 0 ? 1 : -1;
      }
      return left.path.localeCompare(right.path);
    });
}

export function getHighPriorityPinterestEntries(entries: PinterestPublishingEntry[]) {
  return entries.filter((entry) => entry.exportStatus === "READY" && entry.publishPriority === "HIGH");
}

export function getGuidePinterestEntries(entries: PinterestPublishingEntry[]) {
  return entries.filter((entry) => entry.pageType === "GUIDE_ARTICLE" || entry.pageType === "GUIDE_INDEX");
}

export function getProductAndVariantPinterestEntries(entries: PinterestPublishingEntry[]) {
  return entries.filter((entry) =>
    ["PRODUCT", "VARIANT", "VARIANT_COMBINATION", "CATEGORY"].includes(entry.pageType)
  );
}

export function getRefreshCandidatePinterestEntries(entries: PinterestPublishingEntry[]) {
  return entries.filter((entry) => entry.isRefreshCandidate || entry.publishStatus === "REFRESH_CANDIDATE");
}

export function getReadyToExportPinterestEntries(entries: PinterestPublishingEntry[]) {
  return entries.filter((entry) => entry.exportStatus === "READY");
}

export function summarizePinterestBoards(entries: PinterestPublishingEntry[]) {
  return Object.values(
    entries.reduce<Record<string, { boardKey: PinterestBoardKey; boardLabel: string; count: number; shelves: number; mantels: number; guides: number }>>(
      (accumulator, entry) => {
        const current = accumulator[entry.boardKey] ?? {
          boardKey: entry.boardKey,
          boardLabel: entry.boardLabel,
          count: 0,
          shelves: 0,
          mantels: 0,
          guides: 0
        };

        current.count += 1;
        if (entry.productFamily === "floating-shelves") {
          current.shelves += 1;
        }
        if (entry.productFamily === "floating-mantels") {
          current.mantels += 1;
        }
        if (entry.pageType === "GUIDE_ARTICLE" || entry.pageType === "GUIDE_INDEX") {
          current.guides += 1;
        }

        accumulator[entry.boardKey] = current;
        return accumulator;
      },
      {}
    )
  ).sort((left, right) => right.count - left.count);
}
