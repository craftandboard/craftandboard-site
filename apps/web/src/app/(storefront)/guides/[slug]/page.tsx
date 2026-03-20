import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGuideBySlug, guides } from "../../../../content/guides";
import { GuidePage } from "../../../../components/storefront/guides/GuidePage";
import { getBreadcrumbSchema } from "../../../../lib/seo/breadcrumbSchema";
import {
  generateGuideMetadata,
  getArticleSchema,
  getFaqSchema,
  getGuidePath
} from "../../../../lib/seo/guides";
import { resolveGuideContent } from "../../../../lib/seo/overrideResolver";
import { resolveGuideRelatedContent } from "../../../../lib/seo/relatedContent";

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const guide = getGuideBySlug(resolved.slug);

  if (!guide) {
    return {};
  }

  return generateGuideMetadata({
    slug: guide.slug,
    title: guide.title,
    description: guide.description
  });
}

export default async function GuideDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const guide = getGuideBySlug(resolved.slug);

  if (!guide) {
    notFound();
  }
  const resolvedGuide = resolveGuideContent(guide);

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: resolvedGuide.guide.heroHeading, path: getGuidePath(guide.slug) }
  ]);
  const articleSchema = getArticleSchema({
    title: resolvedGuide.guide.title,
    description: resolvedGuide.guide.description,
    path: getGuidePath(guide.slug),
    dateModified: resolvedGuide.guide.lastUpdated
  });
  const faqSchema = resolvedGuide.guide.faqItems.length > 0 ? getFaqSchema(resolvedGuide.guide.faqItems) : undefined;
  const relatedGuides = resolvedGuide.guide.relatedGuides
    .map((slug) => getGuideBySlug(slug))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const relatedContent = resolveGuideRelatedContent(guide.slug);

  return (
    <GuidePage
      guide={resolvedGuide.guide}
      articleSchema={articleSchema}
      breadcrumbSchema={breadcrumbSchema}
      faqSchema={faqSchema}
      relatedGuides={relatedGuides}
      relatedContent={relatedContent}
    />
  );
}
