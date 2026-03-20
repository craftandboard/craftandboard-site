import { getCloudinaryImageUrl } from "../media/cloudinary";
import { getStorefrontProductDefinition } from "../storefront/products/registry";
import { absoluteMarketingUrl, generatePageSEO } from "./metadata";
import { resolveGuideContent, resolveGuideIndexContent } from "./overrideResolver";

const guideOgBySlug: Record<string, string> = {
  "how-to-measure-cabinet-shelves": "craft-board/built-ins-category",
  "floating-mantel-design-ideas": "craft-board/classic-floating-mantel"
};

export function getGuidePath(slug: string) {
  return `/guides/${slug}`;
}

export function generateGuidesIndexMetadata() {
  const resolved = resolveGuideIndexContent();

  return generatePageSEO({
    title: "Floating Shelf & Mantel Guides | Craft & Board",
    description:
      "Explore floating shelf and mantel guides covering installation, wood selection, styling, weight planning, and design direction.",
    pathname: "/guides",
    pageKey: resolved.pageKey
  });
}

export function generateGuideMetadata(input: {
  slug: string;
  title: string;
  description: string;
}) {
  const resolvedGuide = resolveGuideContent({
    slug: input.slug,
    title: input.title,
    description: input.description,
    summary: "",
    heroHeading: "",
    intro: "",
    sections: [],
    faqItems: [],
    relatedProducts: [],
    relatedSeoVariants: [],
    relatedGuides: [],
    targetKeywords: [],
    primaryCta: {
      href: "/guides",
      label: "Browse Guides",
      body: ""
    }
  });
  const imagePublicId =
    guideOgBySlug[input.slug] ??
    getStorefrontProductDefinition({
      categorySlug: "floating-shelves",
      productSlug: "classic-floating-shelf"
    })?.imagePublicId;
  const imageUrl = imagePublicId
    ? getCloudinaryImageUrl(imagePublicId, { width: 1200, height: 630 })
    : undefined;

  return generatePageSEO({
    title: resolvedGuide.guide.title,
    description: resolvedGuide.guide.description,
    pathname: getGuidePath(input.slug),
    type: "article",
    imageUrl,
    imageAlt: resolvedGuide.guide.title,
    pageKey: resolvedGuide.pageKey
  });
}

export function getArticleSchema(input: {
  title: string;
  description: string;
  path: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    mainEntityOfPage: absoluteMarketingUrl(input.path),
    dateModified: input.dateModified,
    author: {
      "@type": "Organization",
      name: "Craft & Board"
    },
    publisher: {
      "@type": "Organization",
      name: "Craft & Board",
      logo: {
        "@type": "ImageObject",
        url: absoluteMarketingUrl("/logo.png")
      }
    }
  };
}

export function getFaqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}
