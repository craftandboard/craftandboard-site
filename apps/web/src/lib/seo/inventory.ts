import { guides } from "../../content/guides";
import { cabinetShelfCategory, cabinetShelfProducts } from "../../content/cabinetShelves";
import { marketingUrl } from "../site-config";
import { getLiveStorefrontProducts } from "../storefront/products/registry";
import {
  getCategoryPageKey,
  getGuideIndexPageKey,
  getGuidePageKey,
  getHomePageKey,
  getProductPageKey,
  getStaticPageKey,
  getVariantComboPageKey,
  getVariantPageKey,
  type SeoPageKey
} from "./overrides";
import {
  SEO_PROGRAMMATIC_CONTENT_LAST_UPDATED,
  getAllSeoEntriesForFamily,
  type SeoProductFamily,
  type SeoVariantEntry
} from "./productSeoConfig";

export type SeoPageType =
  | "HOME"
  | "CATEGORY"
  | "PRODUCT"
  | "VARIANT"
  | "VARIANT_COMBINATION"
  | "GUIDE_INDEX"
  | "GUIDE_ARTICLE"
  | "STATIC_PAGE";

export type SeoInventoryTopicCluster =
  | "brand"
  | "dimensions"
  | "materials"
  | "use-cases"
  | "installation"
  | "weight-capacity"
  | "styling-design"
  | "design-ideas"
  | "shopping";

export type SeoInventoryEntry = {
  id: string;
  pageKey: SeoPageKey;
  pageType: SeoPageType;
  path: string;
  canonicalUrl: string;
  title: string;
  description: string;
  isIndexable: boolean;
  hasStructuredData: boolean;
  hasOpenGraph: boolean;
  inSitemap: boolean;
  priority: number;
  lastModified: string | null;
  productFamily: SeoProductFamily | null;
  topicCluster: SeoInventoryTopicCluster | null;
  seoSlugType: string | null;
  sourceKey: string | null;
};

export const SEO_SITE_CONTENT_LAST_UPDATED = "2026-03-14";

const STATIC_PAGES: Array<{
  path: string;
  title: string;
  description: string;
  topicCluster: SeoInventoryTopicCluster;
  priority: number;
}> = [
  {
    path: "/shop",
    title: "Shop Replacement Cabinet Shelves and Custom Shelving | Craft & Board",
    description:
      "Browse Craft & Board replacement cabinet shelves and the broader made-to-order shelving collections.",
    topicCluster: "shopping",
    priority: 0.9
  },
  {
    path: "/faq",
    title: "Craft & Board FAQ",
    description:
      "Answers to common Craft & Board questions about custom floating shelves, ordering, shipping, and project planning.",
    topicCluster: "shopping",
    priority: 0.72
  },
  {
    path: "/gallery",
    title: "Craft & Board Gallery",
    description:
      "View Craft & Board floating shelf inspiration and architectural wood product gallery examples.",
    topicCluster: "styling-design",
    priority: 0.72
  },
  {
    path: "/about",
    title: "About Craft & Board",
    description:
      "Learn how Craft & Board approaches custom floating shelves and architectural wood products with a premium made-to-order process.",
    topicCluster: "brand",
    priority: 0.68
  }
];

function buildInventoryEntry(input: Omit<SeoInventoryEntry, "canonicalUrl" | "isIndexable" | "inSitemap" | "hasOpenGraph"> & {
  isIndexable?: boolean;
  inSitemap?: boolean;
  hasOpenGraph?: boolean;
}) {
  return {
    canonicalUrl: marketingUrl(input.path),
    isIndexable: input.isIndexable ?? true,
    hasOpenGraph: input.hasOpenGraph ?? true,
    inSitemap: input.inSitemap ?? true,
    ...input
  } satisfies SeoInventoryEntry;
}

function getTopicClusterForVariant(entry: SeoVariantEntry): SeoInventoryTopicCluster {
  if ("componentSlugs" in entry) {
    if (entry.kind === "dimension-material") {
      return "materials";
    }
    if (entry.kind === "dimension-use-case" || entry.kind === "material-use-case") {
      return "use-cases";
    }
  }

  if ("kind" in entry && entry.kind === "dimension") {
    return "dimensions";
  }
  if ("kind" in entry && entry.kind === "material") {
    return "materials";
  }
  return "use-cases";
}

function getProgrammaticPriority(entry: SeoVariantEntry) {
  if ("componentSlugs" in entry) {
    return 0.8;
  }
  if (entry.kind === "dimension") {
    return 0.82;
  }
  return 0.78;
}

function getGuideTopicCluster(slug: string): SeoInventoryTopicCluster {
  if (slug === "how-to-measure-cabinet-shelves") {
    return "installation";
  }
  if (slug === "install-floating-shelves") {
    return "installation";
  }
  if (slug === "floating-shelf-weight-limits") {
    return "weight-capacity";
  }
  if (slug === "best-wood-for-floating-shelves") {
    return "materials";
  }
  if (slug === "floating-mantel-design-ideas" || slug === "how-to-style-floating-shelves") {
    return "styling-design";
  }
  return "shopping";
}

export function normalizeSeoPath(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return "/";
  }

  try {
    const url = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? new URL(trimmed)
      : new URL(trimmed, marketingUrl("/"));
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    return pathname === "" ? "/" : pathname;
  } catch {
    const pathOnly = trimmed.split(/[?#]/)[0] ?? "/";
    const normalized = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
    return normalized.replace(/\/+$/, "") || "/";
  }
}

export function isPrivateSeoPath(pathname: string) {
  const normalized = normalizeSeoPath(pathname);
  return [
    "/admin",
    "/api",
    "/order",
    "/proposal",
    "/deposit"
  ].some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

export function isEligibleOrganicLandingPath(pathname: string) {
  const normalized = normalizeSeoPath(pathname);

  if (isPrivateSeoPath(normalized)) {
    return false;
  }

  if (
    normalized === "/" ||
    normalized === "/shop" ||
    normalized === "/guides" ||
    normalized === "/faq" ||
    normalized === "/gallery" ||
    normalized === "/about"
  ) {
    return true;
  }

  return [
    "/guides/",
    "/shop/cabinet-shelves",
    "/shop/floating-shelves",
    "/shop/floating-mantels",
    "/floating-shelves/",
    "/floating-mantels/"
  ].some((prefix) => normalized.startsWith(prefix));
}

export function getSeoInventoryEntries() {
  const entries: SeoInventoryEntry[] = [
    buildInventoryEntry({
      id: "home",
      pageKey: getHomePageKey(),
      pageType: "HOME",
      path: "/",
      title: "Craft & Board",
      description:
        "Craft & Board creates custom floating shelves and made-to-order architectural wood products.",
      hasStructuredData: true,
      priority: 1,
      lastModified: SEO_SITE_CONTENT_LAST_UPDATED,
      productFamily: null,
      topicCluster: "brand",
      seoSlugType: null,
      sourceKey: "home"
    }),
    ...STATIC_PAGES.map((page) =>
      buildInventoryEntry({
        id: page.path,
        pageKey: getStaticPageKey(page.path.replace(/^\//, "") || "root"),
        pageType: "STATIC_PAGE",
        path: page.path,
        title: page.title,
        description: page.description,
        hasStructuredData: false,
        priority: page.priority,
        lastModified: SEO_SITE_CONTENT_LAST_UPDATED,
        productFamily: null,
        topicCluster: page.topicCluster,
        seoSlugType: null,
        sourceKey: `static:${page.path}`
      })
    ),
    buildInventoryEntry({
      id: "guide-index",
      pageKey: getGuideIndexPageKey(),
      pageType: "GUIDE_INDEX",
      path: "/guides",
      title: "Floating Shelf and Mantel Guides | Craft & Board",
      description:
        "Browse Craft & Board guides covering floating shelf installation, wood selection, styling, weight planning, and mantel design.",
      hasStructuredData: true,
      priority: 0.8,
      lastModified: SEO_SITE_CONTENT_LAST_UPDATED,
      productFamily: null,
      topicCluster: "shopping",
      seoSlugType: null,
      sourceKey: "guides:index"
    }),
    ...guides.map((guide) =>
      buildInventoryEntry({
        id: `guide:${guide.slug}`,
        pageKey: getGuidePageKey(guide.slug),
        pageType: "GUIDE_ARTICLE",
        path: `/guides/${guide.slug}`,
        title: guide.title,
        description: guide.description,
        hasStructuredData: true,
        priority: 0.72,
        lastModified: guide.lastUpdated ?? SEO_SITE_CONTENT_LAST_UPDATED,
        productFamily:
          guide.slug === "how-to-measure-cabinet-shelves"
            ? "cabinet-shelves"
            : guide.slug === "floating-mantel-design-ideas"
              ? "floating-mantels"
              : "floating-shelves",
        topicCluster: getGuideTopicCluster(guide.slug),
        seoSlugType: null,
        sourceKey: `guide:${guide.slug}`
      })
    ),
    buildInventoryEntry({
      id: "category:cabinet-shelves",
      pageKey: getCategoryPageKey("cabinet-shelves"),
      pageType: "CATEGORY",
      path: "/shop/cabinet-shelves",
      title: `${cabinetShelfCategory.title} | Craft & Board`,
      description: cabinetShelfCategory.description,
      hasStructuredData: true,
      priority: 0.88,
      lastModified: SEO_SITE_CONTENT_LAST_UPDATED,
      productFamily: "cabinet-shelves",
      topicCluster: "shopping",
      seoSlugType: null,
      sourceKey: "category:cabinet-shelves"
    }),
    ...cabinetShelfProducts.map((product) =>
      buildInventoryEntry({
        id: `product:cabinet-shelves:${product.slug}`,
        pageKey: getProductPageKey(product.slug),
        pageType: "PRODUCT",
        path: product.href,
        title: `${product.title} | Craft & Board`,
        description: product.description,
        hasStructuredData: true,
        priority: 0.83,
        lastModified: SEO_SITE_CONTENT_LAST_UPDATED,
        productFamily: "cabinet-shelves",
        topicCluster: "shopping",
        seoSlugType: null,
        sourceKey: `product:cabinet-shelves:${product.slug}`
      })
    )
  ];

  for (const product of getLiveStorefrontProducts()) {
    entries.push(
      buildInventoryEntry({
        id: `category:${product.categorySlug}`,
        pageKey: getCategoryPageKey(product.categorySlug as SeoProductFamily),
        pageType: "CATEGORY",
        path: `/shop/${product.categorySlug}`,
        title: `${product.category.title} | Craft & Board`,
        description: product.category.description,
        hasStructuredData: true,
        priority: 0.9,
        lastModified: SEO_SITE_CONTENT_LAST_UPDATED,
        productFamily: product.categorySlug as SeoProductFamily,
        topicCluster: "shopping",
        seoSlugType: null,
        sourceKey: `category:${product.categorySlug}`
      })
    );

    entries.push(
      buildInventoryEntry({
        id: `product:${product.categorySlug}:${product.productSlug}`,
        pageKey: getProductPageKey(product.productSlug),
        pageType: "PRODUCT",
        path: product.pdpPath,
        title:
          product.categorySlug === "floating-shelves"
            ? "Floating Shelf – Custom Solid Wood Shelves | Craft & Board"
            : "Floating Mantel – Custom Wood Mantels | Craft & Board",
        description: product.content.description,
        hasStructuredData: true,
        priority: 0.85,
        lastModified: SEO_SITE_CONTENT_LAST_UPDATED,
        productFamily: product.categorySlug as SeoProductFamily,
        topicCluster: "shopping",
        seoSlugType: null,
        sourceKey: `product:${product.categorySlug}:${product.productSlug}`
      })
    );
  }

  for (const family of ["floating-shelves", "floating-mantels"] as const) {
    for (const entry of getAllSeoEntriesForFamily(family)) {
      entries.push(
        buildInventoryEntry({
          id: `${family}:${entry.slug}`,
          pageKey: "componentSlugs" in entry
            ? getVariantComboPageKey(family, entry.slug)
            : getVariantPageKey(family, entry.slug),
          pageType: "componentSlugs" in entry ? "VARIANT_COMBINATION" : "VARIANT",
          path: `/${family}/${entry.slug}`,
          title: entry.title,
          description: entry.description,
          hasStructuredData: true,
          priority: getProgrammaticPriority(entry),
          lastModified: SEO_PROGRAMMATIC_CONTENT_LAST_UPDATED,
          productFamily: family,
          topicCluster: getTopicClusterForVariant(entry),
          seoSlugType: entry.kind,
          sourceKey: `variant:${family}:${entry.slug}`
        })
      );
    }
  }

  return entries
    .filter((entry, index, array) => array.findIndex((candidate) => candidate.path === entry.path) === index)
    .sort((left, right) => left.path.localeCompare(right.path));
}

export function getSeoInventoryEntryByPath(pathname: string) {
  const normalized = normalizeSeoPath(pathname);
  return getSeoInventoryEntries().find((entry) => entry.path === normalized) ?? null;
}

export function getSeoInventoryEntriesByType() {
  return getSeoInventoryEntries().reduce<Record<SeoPageType, SeoInventoryEntry[]>>(
    (accumulator, entry) => {
      accumulator[entry.pageType].push(entry);
      return accumulator;
    },
    {
      HOME: [],
      CATEGORY: [],
      PRODUCT: [],
      VARIANT: [],
      VARIANT_COMBINATION: [],
      GUIDE_INDEX: [],
      GUIDE_ARTICLE: [],
      STATIC_PAGE: []
    }
  );
}
