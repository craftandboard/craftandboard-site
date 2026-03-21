import { resolveCategoryRelatedContent, resolveGuideRelatedContent, resolveGuidesHubContent, resolveProductRelatedContent, resolveVariantComboRelatedContent, resolveVariantRelatedContent } from "./relatedContent";
import { getSeoInventoryEntryByPath, type SeoInventoryEntry, type SeoPageType } from "./inventory";
import type { SearchConsolePageMetric } from "./searchConsole";

export type SeoInternalLinkSupportLevel = "LOW" | "NORMAL" | "STRONG";

export type SeoHealthReport = {
  path: string;
  pageType: SeoPageType;
  isIndexable: boolean;
  inSitemap: boolean;
  hasCanonical: boolean;
  hasOpenGraph: boolean;
  hasStructuredData: boolean;
  hasTitle: boolean;
  hasDescription: boolean;
  titleLengthOk: boolean;
  descriptionLengthOk: boolean;
  internalLinkSupportLevel: SeoInternalLinkSupportLevel;
  impressions: number | null;
  clicks: number | null;
  ctr: number | null;
  averagePosition: number | null;
  healthWarnings: string[];
  optimizationOpportunities: string[];
};

function getLinkCount(entry: SeoInventoryEntry) {
  if (entry.pageType === "GUIDE_ARTICLE") {
    const slug = entry.path.replace(/^\/guides\//, "");
    const resolved = resolveGuideRelatedContent(slug);
    return resolved.guides.length + resolved.variants.length + resolved.productLinks.length + resolved.categoryLinks.length;
  }

  if (entry.pageType === "GUIDE_INDEX") {
    const resolved = resolveGuidesHubContent();
    return resolved.featuredGuides.length + resolved.familyRoutes.length + resolved.productLinks.length;
  }

  if (entry.pageType === "CATEGORY" && entry.productFamily) {
    const resolved = resolveCategoryRelatedContent(entry.productFamily);
    return resolved.guides.length + resolved.variants.length + resolved.productLinks.length + resolved.ctas.length;
  }

  if (entry.pageType === "PRODUCT" && entry.productFamily) {
    const resolved = resolveProductRelatedContent(entry.productFamily);
    return resolved.guides.length + resolved.variants.length + resolved.categoryLinks.length + resolved.ctas.length;
  }

  if (entry.pageType === "VARIANT" && entry.productFamily) {
    const slug = entry.path.split("/").pop() ?? "";
    const resolved = resolveVariantRelatedContent(entry.productFamily, slug);
    return resolved.guides.length + resolved.variants.length + resolved.productLinks.length + resolved.categoryLinks.length + resolved.ctas.length;
  }

  if (entry.pageType === "VARIANT_COMBINATION" && entry.productFamily) {
    const slug = entry.path.split("/").pop() ?? "";
    const resolved = resolveVariantComboRelatedContent(entry.productFamily, slug);
    return resolved.guides.length + resolved.variants.length + resolved.productLinks.length + resolved.categoryLinks.length + resolved.ctas.length;
  }

  if (entry.pageType === "HOME") {
    return 4;
  }

  return 2;
}

function getInternalLinkSupportLevel(entry: SeoInventoryEntry): SeoInternalLinkSupportLevel {
  const count = getLinkCount(entry);

  if (count >= 7) {
    return "STRONG";
  }
  if (count >= 4) {
    return "NORMAL";
  }
  return "LOW";
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

export function buildSeoHealthReports(input: {
  inventory: SeoInventoryEntry[];
  metrics: SearchConsolePageMetric[];
}) {
  const metricByPath = new Map(input.metrics.map((metric) => [metric.matchedPath, metric]));

  return input.inventory.map<SeoHealthReport>((entry) => {
    const metric = metricByPath.get(entry.path) ?? null;
    const titleLength = entry.title.trim().length;
    const descriptionLength = entry.description.trim().length;
    const titleLengthOk = titleLength >= 25 && titleLength <= 70;
    const descriptionLengthOk = descriptionLength >= 70 && descriptionLength <= 180;
    const internalLinkSupportLevel = getInternalLinkSupportLevel(entry);
    const healthWarnings: string[] = [];
    const optimizationOpportunities: string[] = [];

    if (!entry.inSitemap) {
      healthWarnings.push("Missing from sitemap");
    }
    if (!entry.isIndexable) {
      healthWarnings.push("Unexpectedly non-indexable public page");
    }
    if (!entry.hasStructuredData && entry.pageType !== "STATIC_PAGE") {
      healthWarnings.push("Missing structured data");
    }
    if (!titleLengthOk) {
      healthWarnings.push("Title length needs review");
      optimizationOpportunities.push("Adjust the title toward a 25-70 character range.");
    }
    if (!descriptionLengthOk) {
      healthWarnings.push("Description length needs review");
      optimizationOpportunities.push("Tighten the meta description toward a 70-180 character range.");
    }
    if (internalLinkSupportLevel === "LOW") {
      healthWarnings.push("Low internal link support");
      optimizationOpportunities.push("Add stronger contextual links from related guides, variants, or category pages.");
    }
    if (!entry.lastModified && (entry.pageType === "GUIDE_ARTICLE" || entry.pageType === "VARIANT" || entry.pageType === "VARIANT_COMBINATION")) {
      healthWarnings.push("Freshness timestamp missing");
    }

    if (metric) {
      if (metric.impressions >= 100 && metric.ctr < 0.02) {
        healthWarnings.push("High impressions with weak CTR");
        optimizationOpportunities.push("Test a sharper title and description for the search intent this page targets.");
      }
      if (metric.impressions >= 50 && metric.clicks === 0) {
        healthWarnings.push("Visible in search but earning no clicks");
        optimizationOpportunities.push("Improve snippet appeal and reinforce internal links into this page.");
      }
      if (metric.impressions >= 100 && metric.averagePosition > 8 && metric.averagePosition <= 20) {
        healthWarnings.push("High-opportunity page sitting below top positions");
        optimizationOpportunities.push("Strengthen internal linking and tighten keyword alignment to push this page upward.");
      }
    }

    return {
      path: entry.path,
      pageType: entry.pageType,
      isIndexable: entry.isIndexable,
      inSitemap: entry.inSitemap,
      hasCanonical: Boolean(entry.canonicalUrl),
      hasOpenGraph: entry.hasOpenGraph,
      hasStructuredData: entry.hasStructuredData,
      hasTitle: Boolean(entry.title.trim()),
      hasDescription: Boolean(entry.description.trim()),
      titleLengthOk,
      descriptionLengthOk,
      internalLinkSupportLevel,
      impressions: metric?.impressions ?? null,
      clicks: metric?.clicks ?? null,
      ctr: metric ? roundToTwo(metric.ctr) : null,
      averagePosition: metric ? roundToTwo(metric.averagePosition) : null,
      healthWarnings,
      optimizationOpportunities
    };
  });
}

export function getHighOpportunityHealthReports(reports: SeoHealthReport[]) {
  return [...reports]
    .filter((report) => (report.impressions ?? 0) >= 100 && (report.ctr ?? 1) < 0.03)
    .sort((left, right) => (right.impressions ?? 0) - (left.impressions ?? 0))
    .slice(0, 10);
}

export function getLowCtrHealthReports(reports: SeoHealthReport[]) {
  return [...reports]
    .filter((report) => (report.impressions ?? 0) >= 50 && (report.ctr ?? 1) < 0.025)
    .sort((left, right) => (right.impressions ?? 0) - (left.impressions ?? 0))
    .slice(0, 10);
}

export function summarizeAttributionByInventoryPath(rows: Array<{
  sourcePath: string;
  productFamily: string;
  paymentStatus: string;
}>) {
  const totals = new Map<string, {
    path: string;
    pageType: SeoPageType | "UNMATCHED";
    productFamily: string | null;
    checkoutStarts: number;
    reachedPayment: number;
    paid: number;
  }>();

  for (const row of rows) {
    const entry = getSeoInventoryEntryByPath(row.sourcePath);
    const path = entry?.path ?? row.sourcePath;
    const current = totals.get(path) ?? {
      path,
      pageType: entry?.pageType ?? "UNMATCHED",
      productFamily: entry?.productFamily ?? (row.productFamily === "floating-shelves" || row.productFamily === "floating-mantels" ? row.productFamily : null),
      checkoutStarts: 0,
      reachedPayment: 0,
      paid: 0
    };

    current.checkoutStarts += 1;
    if (["SESSION_CREATED", "PAYMENT_IN_PROGRESS", "PAID"].includes(row.paymentStatus)) {
      current.reachedPayment += 1;
    }
    if (row.paymentStatus === "PAID") {
      current.paid += 1;
    }

    totals.set(path, current);
  }

  return [...totals.values()].sort((left, right) => right.checkoutStarts - left.checkoutStarts);
}
