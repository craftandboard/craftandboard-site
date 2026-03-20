import type { Metadata } from "next";
import { guides } from "../../../content/guides";
import { GuidesIndexPage } from "../../../components/storefront/guides/GuidesIndexPage";
import { StructuredDataScript } from "../../../components/storefront/StructuredDataScript";
import { getBreadcrumbSchema } from "../../../lib/seo/breadcrumbSchema";
import { generateGuidesIndexMetadata } from "../../../lib/seo/guides";
import { resolveGuideIndexContent } from "../../../lib/seo/overrideResolver";
import { resolveGuidesHubContent } from "../../../lib/seo/relatedContent";

export const metadata: Metadata = generateGuidesIndexMetadata();

export default function GuidesPage() {
  const resolved = resolveGuideIndexContent();
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" }
  ]);
  const relatedContent = resolveGuidesHubContent();

  return (
    <>
      <StructuredDataScript data={breadcrumbSchema} />
      <GuidesIndexPage
        guides={guides}
        featuredGuides={relatedContent.featuredGuides}
        familyRoutes={relatedContent.familyRoutes}
        productLinks={relatedContent.productLinks}
        heroTitle={resolved.heroHeading}
        heroBody={resolved.intro}
        primaryCtaLabel={resolved.primaryCtaLabel}
        primaryCtaHref={resolved.primaryCtaHref}
      />
    </>
  );
}
