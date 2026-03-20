import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductSeoLandingPage } from "../../../../components/storefront/ProductSeoLandingPage";
import { getSeoPageDefinition, getSeoStaticParams } from "../../../../lib/seo/generateSeoPage";

export function generateStaticParams() {
  return getSeoStaticParams("floating-mantels");
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ variant: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const page = getSeoPageDefinition("floating-mantels", resolved.variant);

  if (!page) {
    return {};
  }

  return page.metadata;
}

export default async function FloatingMantelsSeoVariantPage({
  params
}: {
  params: Promise<{ variant: string }>;
}) {
  const resolved = await params;
  const page = getSeoPageDefinition("floating-mantels", resolved.variant);

  if (!page) {
    notFound();
  }

  return (
    <ProductSeoLandingPage
      eyebrow={page.familyTitle}
      title={page.variant.label}
      intro={page.variant.intro}
      guidanceTitle={page.variant.guidanceTitle}
      guidanceBody={page.variant.guidanceBody}
      configuratorHref={page.configuratorHref}
      configuratorLabel={page.variant.ctaLabel}
      related={page.related}
      relatedContent={page.relatedContent}
      breadcrumbSchema={page.breadcrumbSchema}
      productSchema={page.productSchema}
    />
  );
}
