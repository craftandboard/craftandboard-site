import { getGuideBySlug, guides } from "../../content/guides";
import { getStorefrontProductDefinition } from "../storefront/products/registry";
import {
  getCategoryPageKey,
  getGuideIndexPageKey,
  getGuidePageKey,
  getProductPageKey,
  getVariantComboPageKey,
  getVariantPageKey
} from "./overrides";
import { applyRelatedContentOverrides } from "./overrideResolver";
import {
  getSeoVariantBySlug,
  getSeoVariantComboBySlug,
  getSeoVariantsForFamily,
  type ProductSeoVariantKind,
  type SeoProductFamily
} from "./productSeoConfig";

export type RelatedLinkType = "GUIDE" | "CATEGORY" | "PRODUCT" | "VARIANT" | "CTA";

export type TopicTag =
  | "dimensions"
  | "materials"
  | "use-cases"
  | "installation"
  | "weight-capacity"
  | "styling-design"
  | "fireplace"
  | "design-ideas";

export type ResolvedRelatedLink = {
  href: string;
  title: string;
  description?: string;
  linkType: RelatedLinkType;
  productFamily: SeoProductFamily | null;
  topicTag: TopicTag | null;
  priority: number;
  anchorText?: string;
};

export type ResolvedRelatedContent = {
  guides: ResolvedRelatedLink[];
  variants: ResolvedRelatedLink[];
  productLinks: ResolvedRelatedLink[];
  categoryLinks: ResolvedRelatedLink[];
  ctas: ResolvedRelatedLink[];
};

const familyTitles: Record<SeoProductFamily, string> = {
  "cabinet-shelves": "Replacement Cabinet Shelves",
  "floating-shelves": "Floating Shelves",
  "floating-mantels": "Floating Mantels"
};

const flagshipProductSlugByFamily: Record<SeoProductFamily, string> = {
  "cabinet-shelves": "white-melamine-cabinet-shelf",
  "floating-shelves": "classic-floating-shelf",
  "floating-mantels": "classic-floating-mantel"
};

const guideMeta = {
  "how-to-measure-cabinet-shelves": {
    family: "cabinet-shelves",
    tags: ["installation"] as TopicTag[]
  },
  "install-floating-shelves": {
    family: "floating-shelves",
    tags: ["installation"] as TopicTag[]
  },
  "floating-shelf-weight-limits": {
    family: "floating-shelves",
    tags: ["weight-capacity", "installation"] as TopicTag[]
  },
  "best-wood-for-floating-shelves": {
    family: "floating-shelves",
    tags: ["materials", "styling-design"] as TopicTag[]
  },
  "floating-shelves-vs-brackets": {
    family: "floating-shelves",
    tags: ["installation", "styling-design"] as TopicTag[]
  },
  "how-to-style-floating-shelves": {
    family: "floating-shelves",
    tags: ["styling-design", "use-cases"] as TopicTag[]
  },
  "floating-mantel-design-ideas": {
    family: "floating-mantels",
    tags: ["design-ideas", "fireplace", "materials"] as TopicTag[]
  }
} as const satisfies Record<string, { family: SeoProductFamily; tags: TopicTag[] }>;

const guideRecommendations: Record<
  keyof typeof guideMeta,
  {
    variants: string[];
    products: string[];
    categories: string[];
    guides: string[];
    cta: { href: string; title: string; description: string; topicTag: TopicTag | null };
  }
> = {
  "how-to-measure-cabinet-shelves": {
    variants: [],
    products: [
      "/shop/cabinet-shelves/white-melamine-cabinet-shelf",
      "/shop/cabinet-shelves/maple-melamine-cabinet-shelf"
    ],
    categories: ["/shop/cabinet-shelves"],
    guides: [],
    cta: {
      href: "/shop/cabinet-shelves/white-melamine-cabinet-shelf",
      title: "Order Your Replacement Shelf",
      description: "Move from measuring into the white or maple melamine replacement shelf product path.",
      topicTag: "installation"
    }
  },
  "install-floating-shelves": {
    variants: ["72-inch", "kitchen", "white-oak"],
    products: ["/shop/floating-shelves/classic-floating-shelf"],
    categories: ["/shop/floating-shelves"],
    guides: ["floating-shelf-weight-limits", "best-wood-for-floating-shelves"],
    cta: {
      href: "/shop/floating-shelves/classic-floating-shelf",
      title: "Configure Your Floating Shelf",
      description: "Move from installation planning into the live floating shelf configurator.",
      topicTag: "installation"
    }
  },
  "floating-shelf-weight-limits": {
    variants: ["84-inch", "living-room", "72-inch"],
    products: ["/shop/floating-shelves/classic-floating-shelf"],
    categories: ["/shop/floating-shelves"],
    guides: ["install-floating-shelves", "floating-shelves-vs-brackets"],
    cta: {
      href: "/shop/floating-shelves/classic-floating-shelf",
      title: "Plan a Shelf Around Real Use",
      description: "Start the live shelf flow when the project needs specific span and mounting decisions.",
      topicTag: "weight-capacity"
    }
  },
  "best-wood-for-floating-shelves": {
    variants: ["white-oak", "walnut", "maple"],
    products: ["/shop/floating-shelves/classic-floating-shelf"],
    categories: ["/shop/floating-shelves"],
    guides: ["how-to-style-floating-shelves", "install-floating-shelves"],
    cta: {
      href: "/floating-shelves/white-oak",
      title: "Explore Shelf Wood Directions",
      description: "Compare shelf material directions before moving into the configurator.",
      topicTag: "materials"
    }
  },
  "floating-shelves-vs-brackets": {
    variants: ["living-room", "72-inch", "white-oak"],
    products: ["/shop/floating-shelves/classic-floating-shelf"],
    categories: ["/shop/floating-shelves"],
    guides: ["floating-shelf-weight-limits", "how-to-style-floating-shelves"],
    cta: {
      href: "/shop/floating-shelves/classic-floating-shelf",
      title: "Start a Floating Shelf Project",
      description: "Choose the concealed floating shelf path when the room needs a cleaner architectural line.",
      topicTag: "styling-design"
    }
  },
  "how-to-style-floating-shelves": {
    variants: ["living-room", "white-oak", "72-inch"],
    products: ["/shop/floating-shelves/classic-floating-shelf"],
    categories: ["/shop/floating-shelves"],
    guides: ["best-wood-for-floating-shelves", "install-floating-shelves"],
    cta: {
      href: "/floating-shelves/living-room",
      title: "Explore Styled Shelf Directions",
      description: "Move from styling ideas into living-room and material-specific shelf paths.",
      topicTag: "styling-design"
    }
  },
  "floating-mantel-design-ideas": {
    variants: ["fireplace", "white-oak", "72-inch"],
    products: ["/shop/floating-mantels/classic-floating-mantel"],
    categories: ["/shop/floating-mantels"],
    guides: ["best-wood-for-floating-shelves", "how-to-style-floating-shelves"],
    cta: {
      href: "/shop/floating-mantels/classic-floating-mantel",
      title: "Start Your Floating Mantel Design",
      description: "Move from mantel inspiration into the live floating mantel configurator.",
      topicTag: "design-ideas"
    }
  }
};

function stripBrandSuffix(title: string) {
  return title.replace(/\s+\|\s+Craft & Board$/, "");
}

function getVariantTopicTag(family: SeoProductFamily, kind: ProductSeoVariantKind, slug: string): TopicTag {
  if (kind === "dimension") {
    return "dimensions";
  }

  if (kind === "material") {
    return "materials";
  }

  if (family === "floating-mantels" && slug === "fireplace") {
    return "fireplace";
  }

  return "use-cases";
}

function dedupeLinks(items: ResolvedRelatedLink[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.href)) {
      return false;
    }

    seen.add(item.href);
    return true;
  });
}

function limitLinks(items: ResolvedRelatedLink[], max: number) {
  return dedupeLinks(items)
    .sort((left, right) => right.priority - left.priority)
    .slice(0, max);
}

function getFlagshipProduct(family: SeoProductFamily) {
  return getStorefrontProductDefinition({
    categorySlug: family,
    productSlug: flagshipProductSlugByFamily[family]
  });
}

function createGuideLink(slug: string, priority: number): ResolvedRelatedLink | null {
  const guide = getGuideBySlug(slug);
  const meta = guideMeta[slug as keyof typeof guideMeta];

  if (!guide || !meta) {
    return null;
  }

  return {
    href: `/guides/${guide.slug}`,
    title: stripBrandSuffix(guide.title),
    description: guide.summary,
    linkType: "GUIDE",
    productFamily: meta.family,
    topicTag: meta.tags[0] ?? null,
    priority,
    anchorText: stripBrandSuffix(guide.title)
  };
}

function createVariantLink(
  family: SeoProductFamily,
  slug: string,
  priority: number
): ResolvedRelatedLink | null {
  const variant = getSeoVariantsForFamily(family).find((item) => item.slug === slug);

  if (!variant) {
    return null;
  }

  return {
    href: `/${family}/${variant.slug}`,
    title: variant.label,
    description: variant.description,
    linkType: "VARIANT",
    productFamily: family,
    topicTag: getVariantTopicTag(family, variant.kind, variant.slug),
    priority,
    anchorText: variant.label.toLowerCase()
  };
}

function createCategoryLink(family: SeoProductFamily, priority: number): ResolvedRelatedLink {
  return {
    href: `/shop/${family}`,
    title: familyTitles[family],
    description:
      family === "cabinet-shelves"
        ? "Browse replacement cabinet shelves and move from measurement guidance into the correct melamine shelf product."
        : 
      family === "floating-shelves"
        ? "Browse the live floating shelf category and compare the flagship product with key SEO paths."
        : "Browse the live floating mantel category and compare the flagship product with key SEO paths.",
    linkType: "CATEGORY",
    productFamily: family,
    topicTag: null,
    priority,
    anchorText: familyTitles[family].toLowerCase()
  };
}

function createProductLink(family: SeoProductFamily, priority: number): ResolvedRelatedLink | null {
  if (family === "cabinet-shelves") {
    return {
      href: "/shop/cabinet-shelves/white-melamine-cabinet-shelf",
      title: "White Melamine Cabinet Shelf",
      description: "Start with the bright replacement-shelf option sized from the cabinet opening.",
      linkType: "PRODUCT",
      productFamily: family,
      topicTag: null,
      priority,
      anchorText: "white melamine cabinet shelf"
    };
  }

  const product = getFlagshipProduct(family);

  if (!product) {
    return null;
  }

  return {
    href: product.pdpPath,
    title: product.displayName,
    description: product.content.shortDescription,
    linkType: "PRODUCT",
    productFamily: family,
    topicTag: null,
    priority,
    anchorText: product.displayName.toLowerCase()
  };
}

function createCtaLink(input: {
  href: string;
  title: string;
  description: string;
  family: SeoProductFamily;
  topicTag: TopicTag | null;
}): ResolvedRelatedLink {
  return {
    href: input.href,
    title: input.title,
    description: input.description,
    linkType: "CTA",
    productFamily: input.family,
    topicTag: input.topicTag,
    priority: 100,
    anchorText: input.title
  };
}

function buildVariantGuideLinks(
  family: SeoProductFamily,
  topicTag: TopicTag,
  fallbackGuideSlugs: string[]
) {
  const matched = guides
    .filter((guide) => {
      const meta = guideMeta[guide.slug as keyof typeof guideMeta];
      return meta?.family === family && meta.tags.includes(topicTag);
    })
    .map((guide, index) => createGuideLink(guide.slug, 90 - index * 5))
    .filter((item): item is ResolvedRelatedLink => Boolean(item));

  const fallback = fallbackGuideSlugs
    .map((slug, index) => createGuideLink(slug, 75 - index * 5))
    .filter((item): item is ResolvedRelatedLink => Boolean(item));

  return limitLinks([...matched, ...fallback], 3);
}

function getCompanionVariantSlugs(
  family: SeoProductFamily,
  kind: ProductSeoVariantKind
) {
  if (kind === "dimension") {
    return family === "floating-shelves"
      ? ["white-oak", "fireplace", "living-room"]
      : ["white-oak", "fireplace", "walnut"];
  }

  if (kind === "material") {
    return family === "floating-shelves"
      ? ["72-inch", "fireplace", "living-room"]
      : ["72-inch", "fireplace", "84-inch"];
  }

  return family === "floating-shelves"
    ? ["72-inch", "white-oak", "walnut"]
    : ["72-inch", "white-oak", "walnut"];
}

export function resolveGuideRelatedContent(slug: string): ResolvedRelatedContent {
  const metaKey = slug as keyof typeof guideRecommendations;
  const config = guideRecommendations[metaKey];
  const guideMetaEntry = guideMeta[slug as keyof typeof guideMeta];

  if (!config || !guideMetaEntry) {
    return { guides: [], variants: [], productLinks: [], categoryLinks: [], ctas: [] };
  }

  const family = guideMetaEntry.family;

  return applyRelatedContentOverrides({
    pageKey: getGuidePageKey(slug),
    relatedContent: {
    guides: limitLinks(
      config.guides
        .map((guideSlug, index) => createGuideLink(guideSlug, 85 - index * 5))
        .filter((item): item is ResolvedRelatedLink => Boolean(item)),
      3
    ),
    variants: limitLinks(
      config.variants
        .map((variantSlug, index) => createVariantLink(family, variantSlug, 90 - index * 5))
        .filter((item): item is ResolvedRelatedLink => Boolean(item)),
      4
    ),
    productLinks: limitLinks(
      config.products
        .map((_, index) => createProductLink(family, 95 - index * 5))
        .filter((item): item is ResolvedRelatedLink => Boolean(item)),
      2
    ),
    categoryLinks: limitLinks(
      config.categories.map((_, index) => createCategoryLink(family, 88 - index * 5)),
      1
    ),
    ctas: [
      createCtaLink({
        href: config.cta.href,
        title: config.cta.title,
        description: config.cta.description,
        family,
        topicTag: config.cta.topicTag
      })
    ]
  }});
}

export function resolveVariantRelatedContent(
  family: SeoProductFamily,
  variantSlug: string
): ResolvedRelatedContent {
  const variant = getSeoVariantsForFamily(family).find((item) => item.slug === variantSlug);

  if (!variant) {
    return { guides: [], variants: [], productLinks: [], categoryLinks: [], ctas: [] };
  }

  const topicTag = getVariantTopicTag(family, variant.kind, variant.slug);
  const fallbackGuideSlugs =
    family === "floating-shelves"
      ? topicTag === "materials"
        ? ["best-wood-for-floating-shelves", "how-to-style-floating-shelves"]
        : topicTag === "dimensions"
          ? ["install-floating-shelves", "floating-shelf-weight-limits"]
          : ["how-to-style-floating-shelves", "install-floating-shelves"]
      : ["floating-mantel-design-ideas"];

  return applyRelatedContentOverrides({
    pageKey: getVariantPageKey(family, variantSlug),
    relatedContent: {
    guides: buildVariantGuideLinks(family, topicTag, fallbackGuideSlugs),
    variants: limitLinks(
      getCompanionVariantSlugs(family, variant.kind)
        .filter((slug) => slug !== variantSlug)
        .map((slug, index) => createVariantLink(family, slug, 90 - index * 5))
        .filter((item): item is ResolvedRelatedLink => Boolean(item)),
      4
    ),
    productLinks: limitLinks(
      [createProductLink(family, 98)].filter((item): item is ResolvedRelatedLink => Boolean(item)),
      1
    ),
    categoryLinks: [createCategoryLink(family, 92)],
    ctas: [
      createCtaLink({
        href: getFlagshipProduct(family)?.pdpPath ?? "/shop",
        title:
          family === "floating-shelves"
            ? "Use the Live Shelf Configurator"
            : "Use the Live Mantel Configurator",
        description:
          family === "floating-shelves"
            ? "Move from this SEO page into the live shelf product and pricing path."
            : "Move from this SEO page into the live mantel product and pricing path.",
        family,
        topicTag
      })
    ]
  }});
}

export function resolveVariantComboRelatedContent(
  family: SeoProductFamily,
  comboSlug: string
): ResolvedRelatedContent {
  const combo = getSeoVariantComboBySlug(family, comboSlug);

  if (!combo) {
    return { guides: [], variants: [], productLinks: [], categoryLinks: [], ctas: [] };
  }

  const componentVariants = [
    combo.componentSlugs.dimension
      ? getSeoVariantBySlug(family, combo.componentSlugs.dimension)
      : undefined,
    combo.componentSlugs.material
      ? getSeoVariantBySlug(family, combo.componentSlugs.material)
      : undefined,
    combo.componentSlugs.useCase
      ? getSeoVariantBySlug(family, combo.componentSlugs.useCase)
      : undefined
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  const guideSlugs =
    family === "floating-shelves"
      ? [
          combo.componentSlugs.material ? "best-wood-for-floating-shelves" : null,
          combo.componentSlugs.dimension ? "floating-shelf-weight-limits" : null,
          combo.componentSlugs.useCase ? "install-floating-shelves" : null,
          "how-to-style-floating-shelves"
        ].filter((item): item is string => Boolean(item))
      : ["floating-mantel-design-ideas"];

  return applyRelatedContentOverrides({
    pageKey: getVariantComboPageKey(family, comboSlug),
    relatedContent: {
    guides: limitLinks(
      guideSlugs
        .map((slug, index) => createGuideLink(slug, 92 - index * 5))
        .filter((item): item is ResolvedRelatedLink => Boolean(item)),
      3
    ),
    variants: limitLinks(
      componentVariants
        .map((variant, index) => createVariantLink(family, variant.slug, 98 - index * 5))
        .filter((item): item is ResolvedRelatedLink => Boolean(item)),
      4
    ),
    productLinks: limitLinks(
      [createProductLink(family, 96)].filter((item): item is ResolvedRelatedLink => Boolean(item)),
      1
    ),
    categoryLinks: [createCategoryLink(family, 92)],
    ctas: [
      createCtaLink({
        href: getFlagshipProduct(family)?.pdpPath ?? "/shop",
        title:
          family === "floating-shelves"
            ? "Use the Live Shelf Configurator"
            : "Use the Live Mantel Configurator",
        description:
          family === "floating-shelves"
            ? "Move from this combination page into the live shelf product and pricing path."
            : "Move from this combination page into the live mantel product and pricing path.",
        family,
        topicTag:
          combo.componentSlugs.material
            ? "materials"
            : combo.componentSlugs.dimension
              ? "dimensions"
              : combo.componentSlugs.useCase
                ? family === "floating-mantels" && combo.componentSlugs.useCase === "fireplace"
                  ? "fireplace"
                  : "use-cases"
                : null
      })
    ]
  }});
}

export function resolveCategoryRelatedContent(
  family: SeoProductFamily
): ResolvedRelatedContent {
  const guideSlugs =
    family === "floating-shelves"
      ? ["install-floating-shelves", "floating-shelf-weight-limits", "best-wood-for-floating-shelves"]
      : ["floating-mantel-design-ideas"];
  const variantSlugs =
    family === "floating-shelves"
      ? ["72-inch", "white-oak", "fireplace"]
      : ["72-inch", "white-oak", "fireplace"];

  return applyRelatedContentOverrides({
    pageKey: getCategoryPageKey(family),
    relatedContent: {
    guides: limitLinks(
      guideSlugs
        .map((slug, index) => createGuideLink(slug, 92 - index * 5))
        .filter((item): item is ResolvedRelatedLink => Boolean(item)),
      3
    ),
    variants: limitLinks(
      variantSlugs
        .map((slug, index) => createVariantLink(family, slug, 95 - index * 5))
        .filter((item): item is ResolvedRelatedLink => Boolean(item)),
      4
    ),
    productLinks: limitLinks(
      [createProductLink(family, 98)].filter((item): item is ResolvedRelatedLink => Boolean(item)),
      1
    ),
    categoryLinks: [],
    ctas: [
      createCtaLink({
        href: getFlagshipProduct(family)?.pdpPath ?? "/shop",
        title:
          family === "floating-shelves"
            ? "View the Classic Floating Shelf"
            : "View the Classic Floating Mantel",
        description:
          family === "floating-shelves"
            ? "Use the flagship shelf product page as the main configurator entry point."
            : "Use the flagship mantel product page as the main configurator entry point.",
        family,
        topicTag: null
      })
    ]
  }});
}

export function resolveProductRelatedContent(
  family: SeoProductFamily
): ResolvedRelatedContent {
  const guideSlugs =
    family === "floating-shelves"
      ? ["install-floating-shelves", "floating-shelf-weight-limits", "how-to-style-floating-shelves"]
      : ["floating-mantel-design-ideas"];
  const variantSlugs =
    family === "floating-shelves"
      ? ["72-inch", "white-oak", "living-room"]
      : ["72-inch", "white-oak", "fireplace"];

  return applyRelatedContentOverrides({
    pageKey: getProductPageKey(
      family === "floating-shelves" ? "classic-floating-shelf" : "classic-floating-mantel"
    ),
    relatedContent: {
    guides: limitLinks(
      guideSlugs
        .map((slug, index) => createGuideLink(slug, 92 - index * 5))
        .filter((item): item is ResolvedRelatedLink => Boolean(item)),
      3
    ),
    variants: limitLinks(
      variantSlugs
        .map((slug, index) => createVariantLink(family, slug, 94 - index * 5))
        .filter((item): item is ResolvedRelatedLink => Boolean(item)),
      4
    ),
    productLinks: [],
    categoryLinks: [createCategoryLink(family, 90)],
    ctas: [
      createCtaLink({
        href:
          family === "floating-shelves"
            ? "/order/floating-shelves/classic-floating-shelf"
            : "/order/floating-mantels/classic-floating-mantel",
        title:
          family === "floating-shelves"
            ? "Start Shelf Checkout"
            : "Start Mantel Checkout",
        description:
          family === "floating-shelves"
            ? "Move into the live shelf order flow when the configuration is ready."
            : "Move into the live mantel order flow when the configuration is ready.",
        family,
        topicTag: null
      })
    ]
  }});
}

export function resolveGuidesHubContent() {
  const featuredGuides = [
    createGuideLink("install-floating-shelves", 98),
    createGuideLink("best-wood-for-floating-shelves", 94),
    createGuideLink("floating-mantel-design-ideas", 92)
  ].filter((item): item is ResolvedRelatedLink => Boolean(item));

  const familyRoutes = [
    createCategoryLink("floating-shelves", 95),
    createCategoryLink("floating-mantels", 92)
  ];

  const productLinks = [
    createProductLink("floating-shelves", 96),
    createProductLink("floating-mantels", 93)
  ].filter((item): item is ResolvedRelatedLink => Boolean(item));

  return {
    featuredGuides,
    familyRoutes: applyRelatedContentOverrides({
      pageKey: getGuideIndexPageKey(),
      relatedContent: {
        guides: [],
        variants: [],
        productLinks: [],
        categoryLinks: familyRoutes,
        ctas: []
      }
    }).categoryLinks,
    productLinks: applyRelatedContentOverrides({
      pageKey: getGuideIndexPageKey(),
      relatedContent: {
        guides: [],
        variants: [],
        productLinks,
        categoryLinks: [],
        ctas: []
      }
    }).productLinks
  };
}
