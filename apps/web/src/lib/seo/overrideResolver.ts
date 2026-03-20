import type { GuideContentEntry } from "../../content/guides";
import type { ResolvedRelatedContent, ResolvedRelatedLink } from "./relatedContent";
import {
  getCategoryPageKey,
  getGuideIndexPageKey,
  getGuidePageKey,
  getHomePageKey,
  getProductPageKey,
  getVariantComboPageKey,
  getVariantPageKey,
  seoOverrides,
  type SeoPageKey,
  type SeoPageOverride
} from "./overrides";
import type { SeoProductFamily } from "./productSeoConfig";

export function resolveSeoOverrides(pageKey: SeoPageKey): SeoPageOverride | null {
  return seoOverrides.find((override) => override.pageKey === pageKey) ?? null;
}

export function hasActiveSeoOverride(pageKey: SeoPageKey) {
  return Boolean(resolveSeoOverrides(pageKey));
}

export function resolveSeoMetadata(input: {
  pageKey?: SeoPageKey | null;
  title: string;
  description: string;
}) {
  const override = input.pageKey ? resolveSeoOverrides(input.pageKey) : null;
  const title = override?.titleOverride ?? input.title;
  const description = override?.descriptionOverride ?? input.description;
  const ogTitle = override?.ogTitleOverride ?? title;
  const ogDescription = override?.ogDescriptionOverride ?? description;

  return {
    title,
    description,
    ogTitle,
    ogDescription
  };
}

function pageKeyForHref(href: string): SeoPageKey | null {
  if (href === "/") {
    return getHomePageKey();
  }
  if (href === "/guides") {
    return getGuideIndexPageKey();
  }
  if (href.startsWith("/guides/")) {
    return getGuidePageKey(href.replace(/^\/guides\//, ""));
  }
  if (href === "/shop/floating-shelves") {
    return getCategoryPageKey("floating-shelves");
  }
  if (href === "/shop/floating-mantels") {
    return getCategoryPageKey("floating-mantels");
  }
  if (href === "/shop/cabinet-shelves") {
    return getCategoryPageKey("cabinet-shelves");
  }
  if (href === "/shop/floating-shelves/classic-floating-shelf") {
    return getProductPageKey("classic-floating-shelf");
  }
  if (href === "/shop/floating-mantels/classic-floating-mantel") {
    return getProductPageKey("classic-floating-mantel");
  }
  if (href === "/shop/cabinet-shelves/white-melamine-cabinet-shelf") {
    return getProductPageKey("white-melamine-cabinet-shelf");
  }
  if (href === "/shop/cabinet-shelves/maple-melamine-cabinet-shelf") {
    return getProductPageKey("maple-melamine-cabinet-shelf");
  }
  if (href.startsWith("/floating-shelves/")) {
    const slug = href.replace(/^\/floating-shelves\//, "");
    return slug.split("-").length >= 3
      ? getVariantComboPageKey("floating-shelves", slug)
      : getVariantPageKey("floating-shelves", slug);
  }
  if (href.startsWith("/floating-mantels/")) {
    const slug = href.replace(/^\/floating-mantels\//, "");
    return slug.split("-").length >= 3
      ? getVariantComboPageKey("floating-mantels", slug)
      : getVariantPageKey("floating-mantels", slug);
  }

  return null;
}

function applyLinkPriorityOverrides(input: {
  links: ResolvedRelatedLink[];
  override: SeoPageOverride | null;
}) {
  const suppress = new Set(input.override?.suppressRelatedPageKeys ?? []);
  const priorityList = input.override?.priorityRelatedPageKeys ?? [];

  return input.links
    .filter((link) => {
      const key = pageKeyForHref(link.href);
      return key ? !suppress.has(key) : true;
    })
    .map((link) => {
      const key = pageKeyForHref(link.href);
      const priorityBoost = key ? Math.max(0, 30 - priorityList.indexOf(key) * 5) : 0;
      return {
        ...link,
        priority: priorityList.includes(key as SeoPageKey) ? link.priority + priorityBoost : link.priority
      };
    })
    .sort((left, right) => right.priority - left.priority);
}

export function applyRelatedContentOverrides(input: {
  pageKey: SeoPageKey;
  relatedContent: ResolvedRelatedContent;
}) {
  const override = resolveSeoOverrides(input.pageKey);
  const ctas = [...input.relatedContent.ctas];

  if (override?.ctaLabelOverride || override?.ctaHrefOverride) {
    const baseCta = ctas[0] ?? {
      href: override.ctaHrefOverride ?? "/shop",
      title: override.ctaLabelOverride ?? "Explore Craft & Board",
      description: "Move into the strongest product path for this page.",
      linkType: "CTA" as const,
      productFamily: null,
      topicTag: null,
      priority: 100,
      anchorText: override.ctaLabelOverride ?? "Explore Craft & Board"
    };

    ctas[0] = {
      ...baseCta,
      href: override.ctaHrefOverride ?? baseCta.href,
      title: override.ctaLabelOverride ?? baseCta.title,
      anchorText: override.ctaLabelOverride ?? baseCta.anchorText
    };
  }

  return {
    guides: applyLinkPriorityOverrides({ links: input.relatedContent.guides, override }),
    variants: applyLinkPriorityOverrides({ links: input.relatedContent.variants, override }),
    productLinks: applyLinkPriorityOverrides({ links: input.relatedContent.productLinks, override }),
    categoryLinks: applyLinkPriorityOverrides({ links: input.relatedContent.categoryLinks, override }),
    ctas: applyLinkPriorityOverrides({ links: ctas, override })
  } satisfies ResolvedRelatedContent;
}

export function applySimpleRelatedPageOverrides(input: {
  pageKey: SeoPageKey;
  links: Array<{ title: string; href: string }>;
}) {
  const override = resolveSeoOverrides(input.pageKey);
  const suppress = new Set(override?.suppressRelatedPageKeys ?? []);
  const priorityList = override?.priorityRelatedPageKeys ?? [];

  return input.links
    .filter((link) => {
      const key = pageKeyForHref(link.href);
      return key ? !suppress.has(key) : true;
    })
    .sort((left, right) => {
      const leftKey = pageKeyForHref(left.href);
      const rightKey = pageKeyForHref(right.href);
      const leftPriority = leftKey ? priorityList.indexOf(leftKey) : -1;
      const rightPriority = rightKey ? priorityList.indexOf(rightKey) : -1;

      if (leftPriority === -1 && rightPriority === -1) {
        return 0;
      }
      if (leftPriority === -1) {
        return 1;
      }
      if (rightPriority === -1) {
        return -1;
      }

      return leftPriority - rightPriority;
    });
}

export function resolveGuideContent(guide: GuideContentEntry) {
  const pageKey = getGuidePageKey(guide.slug);
  const override = resolveSeoOverrides(pageKey);

  return {
    pageKey,
    override,
    guide: {
      ...guide,
      title: override?.titleOverride ?? guide.title,
      description: override?.descriptionOverride ?? guide.description,
      heroHeading: override?.heroHeadingOverride ?? guide.heroHeading,
      intro: override?.introOverride ?? guide.intro,
      primaryCta: {
        ...guide.primaryCta,
        href: override?.ctaHrefOverride ?? guide.primaryCta.href,
        label: override?.ctaLabelOverride ?? guide.primaryCta.label
      },
      lastUpdated: override?.lastUpdated ?? guide.lastUpdated
    }
  };
}

export function resolveGuideIndexContent() {
  const pageKey = getGuideIndexPageKey();
  const override = resolveSeoOverrides(pageKey);

  return {
    pageKey,
    override,
    heroHeading: override?.heroHeadingOverride ?? "Authority content built around the real questions customers search first.",
    intro:
      override?.introOverride ??
      "These guides cover installation, wood selection, styling, weight planning, and mantel design so research-driven traffic has a clear path into the live product and configurator pages.",
    primaryCtaLabel: override?.ctaLabelOverride ?? "Browse the Collection",
    primaryCtaHref: override?.ctaHrefOverride ?? "/shop"
  };
}

export function resolveHomePageContent(input: {
  heroTitle: string;
  heroBody: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
}) {
  const pageKey = getHomePageKey();
  const override = resolveSeoOverrides(pageKey);

  return {
    pageKey,
    override,
    heroTitle: override?.heroHeadingOverride ?? input.heroTitle,
    heroBody: override?.introOverride ?? input.heroBody,
    primaryCtaLabel: override?.ctaLabelOverride ?? input.primaryCtaLabel,
    primaryCtaHref: override?.ctaHrefOverride ?? input.primaryCtaHref
  };
}

export function resolveCategoryPageContent(input: {
  family: SeoProductFamily;
  heroTitle: string;
  heroBody: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  metadataTitle: string;
  metadataDescription: string;
}) {
  const pageKey = getCategoryPageKey(input.family);
  const override = resolveSeoOverrides(pageKey);

  return {
    pageKey,
    override,
    heroTitle: override?.heroHeadingOverride ?? input.heroTitle,
    heroBody: override?.introOverride ?? input.heroBody,
    primaryCtaLabel: override?.ctaLabelOverride ?? input.primaryCtaLabel,
    primaryCtaHref: override?.ctaHrefOverride ?? input.primaryCtaHref,
    metadataTitle: override?.titleOverride ?? input.metadataTitle,
    metadataDescription: override?.descriptionOverride ?? input.metadataDescription
  };
}

export function resolveProductPageContent(input: {
  productSlug: string;
  metadataTitle: string;
  metadataDescription: string;
  intro: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  const pageKey = getProductPageKey(input.productSlug);
  const override = resolveSeoOverrides(pageKey);

  return {
    pageKey,
    override,
    metadataTitle: override?.titleOverride ?? input.metadataTitle,
    metadataDescription: override?.descriptionOverride ?? input.metadataDescription,
    intro: override?.introOverride ?? input.intro,
    ctaLabel: override?.ctaLabelOverride ?? input.ctaLabel,
    ctaHref: override?.ctaHrefOverride ?? input.ctaHref
  };
}

export function resolveVariantLandingContent(input: {
  family: SeoProductFamily;
  slug: string;
  isCombo: boolean;
  label: string;
  intro: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  const pageKey = input.isCombo
    ? getVariantComboPageKey(input.family, input.slug)
    : getVariantPageKey(input.family, input.slug);
  const override = resolveSeoOverrides(pageKey);

  return {
    pageKey,
    override,
    title: override?.heroHeadingOverride ?? input.label,
    intro: override?.introOverride ?? input.intro,
    ctaLabel: override?.ctaLabelOverride ?? input.ctaLabel,
    ctaHref: override?.ctaHrefOverride ?? input.ctaHref
  };
}

export function getSeoOverrideSummary(pageKey: SeoPageKey) {
  const override = resolveSeoOverrides(pageKey);

  return {
    hasOverride: Boolean(override),
    keywordTargetHint: override?.keywordTargetHint ?? null,
    refreshNote: override?.refreshNote ?? null,
    lastUpdated: override?.lastUpdated ?? null
  };
}
