import { marketingUrl } from "../site-config";
import { getStorefrontProductDefinition } from "../storefront/products/registry";
import { resolveSeoMetadata, resolveSeoOverrides } from "./overrideResolver";
import { getSeoInventoryEntries, getSeoInventoryEntryByPath, type SeoInventoryEntry } from "./inventory";
import type { SeoPageKey } from "./overrides";
import type { SeoProductFamily } from "./productSeoConfig";

export type SeoSocialImageFormat = "og" | "pinterest";
export type SeoSocialImageRouteType =
  | "home"
  | "category"
  | "product"
  | "variant"
  | "guide"
  | "guide-index"
  | "static";

export type ResolvedSeoSocialImage = {
  pageKey: SeoPageKey;
  pageType: SeoInventoryEntry["pageType"];
  title: string;
  description: string;
  keywordHint: string | null;
  productFamily: SeoProductFamily | null;
  accentLabel: string;
  supportingLabel: string;
  slug: string;
};

function pageKeyFromPathname(pathname: string) {
  return getSeoInventoryEntryByPath(pathname)?.pageKey ?? null;
}

function findInventoryEntryByPageKey(pageKey: SeoPageKey) {
  return getSeoInventoryEntries().find((entry) => entry.pageKey === pageKey) ?? null;
}

function socialRouteForPageKey(pageKey: SeoPageKey): { type: SeoSocialImageRouteType; slug: string } {
  if (pageKey === "HOME") {
    return { type: "home", slug: "home" };
  }
  if (pageKey === "GUIDE_INDEX") {
    return { type: "guide-index", slug: "guides" };
  }
  if (pageKey.startsWith("CATEGORY:")) {
    return { type: "category", slug: pageKey.replace("CATEGORY:", "") };
  }
  if (pageKey.startsWith("PRODUCT:")) {
    return { type: "product", slug: pageKey.replace("PRODUCT:", "") };
  }
  if (pageKey.startsWith("GUIDE:")) {
    return { type: "guide", slug: pageKey.replace("GUIDE:", "") };
  }
  if (pageKey.startsWith("STATIC:")) {
    return { type: "static", slug: pageKey.replace("STATIC:", "") };
  }
  if (pageKey.startsWith("VARIANT_COMBO:")) {
    const [, family, slug] = pageKey.split(":");
    return { type: "variant", slug: `${family}-${slug}` };
  }
  if (pageKey.startsWith("VARIANT:")) {
    const [, family, slug] = pageKey.split(":");
    return { type: "variant", slug: `${family}-${slug}` };
  }

  return { type: "static", slug: "shop" };
}

function pageKeyFromRoute(type: SeoSocialImageRouteType, slug: string): SeoPageKey | null {
  switch (type) {
    case "home":
      return slug === "home" ? "HOME" : null;
    case "guide-index":
      return slug === "guides" ? "GUIDE_INDEX" : null;
    case "category":
      return `CATEGORY:${slug}` as SeoPageKey;
    case "product":
      return `PRODUCT:${slug}` as SeoPageKey;
    case "guide":
      return `GUIDE:${slug}` as SeoPageKey;
    case "static":
      return `STATIC:${slug}` as SeoPageKey;
    case "variant": {
      const normalizedFamily = slug.startsWith("floating-shelves-")
        ? "floating-shelves"
        : slug.startsWith("floating-mantels-")
          ? "floating-mantels"
          : null;

      if (!normalizedFamily) {
        return null;
      }

      const variantSlug = slug.replace(`${normalizedFamily}-`, "");
      const maybeCombo = `VARIANT_COMBO:${normalizedFamily}:${variantSlug}` as SeoPageKey;
      const maybeVariant = `VARIANT:${normalizedFamily}:${variantSlug}` as SeoPageKey;

      return findInventoryEntryByPageKey(maybeCombo)?.pageKey ?? findInventoryEntryByPageKey(maybeVariant)?.pageKey ?? null;
    }
  }
}

function accentLabelForEntry(entry: SeoInventoryEntry) {
  switch (entry.pageType) {
    case "HOME":
      return "Craft & Board";
    case "CATEGORY":
      if (entry.productFamily === "floating-shelves") {
        return "Floating Shelves Collection";
      }
      if (entry.productFamily === "floating-mantels") {
        return "Floating Mantels Collection";
      }
      return "Replacement Cabinet Shelves";
    case "PRODUCT":
      return "Made-to-Order Product";
    case "VARIANT":
      return "Search-Targeted Variant";
    case "VARIANT_COMBINATION":
      return "High-Intent Variant Combination";
    case "GUIDE_INDEX":
      return "Guides Hub";
    case "GUIDE_ARTICLE":
      return "Craft & Board Guide";
    case "STATIC_PAGE":
      return "Craft & Board";
  }
}

function supportingLabelForEntry(entry: SeoInventoryEntry) {
  if (entry.path === "/guides/how-to-measure-cabinet-shelves") {
    return "Cabinet Shelf Measurement Guide";
  }
  if (entry.pageType === "GUIDE_ARTICLE") {
    return "Pinterest-ready planning and design content";
  }
  if (entry.productFamily === "cabinet-shelves") {
    return "Measure carefully, then choose the melamine replacement shelf that fits";
  }
  if (entry.pageType === "PRODUCT") {
    return "Configure dimensions, material direction, and concealed support";
  }
  if (entry.pageType === "CATEGORY") {
    return "Browse the strongest commercial paths and flagship products";
  }
  if (entry.pageType === "VARIANT" || entry.pageType === "VARIANT_COMBINATION") {
    return "Long-tail landing page connected to the live configurator";
  }
  if (entry.pageType === "GUIDE_INDEX") {
    return "Authority content that routes research into product paths";
  }
  return "Custom floating shelves, mantels, and contractor-grade planning";
}

export function getSeoSocialImageUrls(input: { pageKey?: SeoPageKey | null; pathname: string }) {
  const pageKey = input.pageKey ?? pageKeyFromPathname(input.pathname);

  if (!pageKey) {
    return null;
  }

  const descriptor = socialRouteForPageKey(pageKey);

  return {
    og: marketingUrl(`/api/seo-image/${descriptor.type}/${descriptor.slug}?format=og`),
    pinterest: marketingUrl(`/api/seo-image/${descriptor.type}/${descriptor.slug}?format=pinterest`)
  };
}

export function resolveSeoSocialImageByRoute(input: {
  type: SeoSocialImageRouteType;
  slug: string;
}): ResolvedSeoSocialImage | null {
  const pageKey = pageKeyFromRoute(input.type, input.slug);

  if (!pageKey) {
    return null;
  }

  const entry = findInventoryEntryByPageKey(pageKey);

  if (!entry) {
    return null;
  }

  const resolved = resolveSeoMetadata({
    pageKey,
    title: entry.title,
    description: entry.description
  });
  const override = resolveSeoOverrides(pageKey);

  return {
    pageKey,
    pageType: entry.pageType,
    title: entry.path === "/guides/how-to-measure-cabinet-shelves" ? "How to Measure Cabinet Shelves" : resolved.ogTitle,
    description: resolved.ogDescription,
    keywordHint: override?.keywordTargetHint ?? null,
    productFamily: entry.productFamily,
    accentLabel: accentLabelForEntry(entry),
    supportingLabel: supportingLabelForEntry(entry),
    slug: input.slug
  };
}

export function getSeoSocialImageTheme(productFamily: SeoProductFamily | null) {
  if (productFamily === "floating-mantels") {
    return {
      gradientStart: "#2d1f17",
      gradientEnd: "#9a6f4e",
      cardBackground: "#f6ede2",
      accentBackground: "#e8d4be",
      accentText: "#5c3f2a"
    };
  }

  return {
    gradientStart: "#241811",
    gradientEnd: "#7f6149",
    cardBackground: "#f8efe4",
    accentBackground: "#e6d2bf",
    accentText: "#5d4332"
  };
}

export function getSeoSocialImageProductPublicId(pageKey: SeoPageKey) {
  if (pageKey === "HOME" || pageKey === "GUIDE_INDEX") {
    return getStorefrontProductDefinition({
      categorySlug: "floating-shelves",
      productSlug: "classic-floating-shelf"
    })?.imagePublicId ?? null;
  }

  if (pageKey.startsWith("CATEGORY:floating-mantels") || pageKey.startsWith("PRODUCT:classic-floating-mantel")) {
    return getStorefrontProductDefinition({
      categorySlug: "floating-mantels",
      productSlug: "classic-floating-mantel"
    })?.imagePublicId ?? null;
  }

  if (pageKey.startsWith("VARIANT:floating-mantels") || pageKey.startsWith("VARIANT_COMBO:floating-mantels")) {
    return getStorefrontProductDefinition({
      categorySlug: "floating-mantels",
      productSlug: "classic-floating-mantel"
    })?.imagePublicId ?? null;
  }

  if (
    pageKey.startsWith("CATEGORY:cabinet-shelves") ||
    pageKey.startsWith("PRODUCT:white-melamine-cabinet-shelf") ||
    pageKey.startsWith("PRODUCT:maple-melamine-cabinet-shelf") ||
    pageKey.startsWith("GUIDE:how-to-measure-cabinet-shelves")
  ) {
    return getStorefrontProductDefinition({
      categorySlug: "floating-shelves",
      productSlug: "classic-floating-shelf"
    })?.imagePublicId ?? null;
  }

  return getStorefrontProductDefinition({
    categorySlug: "floating-shelves",
    productSlug: "classic-floating-shelf"
  })?.imagePublicId ?? null;
}
