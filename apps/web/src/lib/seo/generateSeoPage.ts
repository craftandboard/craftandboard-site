import { getCloudinaryImageUrl } from "../media/cloudinary";
import { getStorefrontProductDefinition } from "../storefront/products/registry";
import type { ConfigurableProductDefinition } from "../storefront/products/types";
import { getBreadcrumbSchema } from "./breadcrumbSchema";
import { generatePageSEO } from "./metadata";
import { applySimpleRelatedPageOverrides, resolveVariantLandingContent } from "./overrideResolver";
import { getProductSchema } from "./productSchema";
import {
  resolveVariantComboRelatedContent,
  resolveVariantRelatedContent
} from "./relatedContent";
import {
  getAllSeoEntriesForFamily,
  getSeoVariantBySlug,
  getSeoVariantComboBySlug,
  getSeoVariantsForFamily,
  type SeoVariantEntry,
  type SeoProductFamily
} from "./productSeoConfig";

type VariantData = ReturnType<typeof getSeoVariantsForFamily>[number];
type SeoPageDefinition = {
  family: SeoProductFamily;
  familyTitle: string;
  variant: SeoVariantEntry;
  pathname: string;
  product: ConfigurableProductDefinition;
  related: Array<{ title: string; href: string }>;
  relatedContent: ReturnType<typeof resolveVariantRelatedContent>;
  configuratorHref: string;
  metadata: ReturnType<typeof generatePageSEO>;
  breadcrumbSchema: ReturnType<typeof getBreadcrumbSchema>;
  productSchema: ReturnType<typeof getProductSchema>;
};

const productSlugByFamily: Record<SeoProductFamily, string> = {
  "cabinet-shelves": "white-melamine-cabinet-shelf",
  "floating-shelves": "classic-floating-shelf",
  "floating-mantels": "classic-floating-mantel"
};

function familyLabel(family: SeoProductFamily) {
  if (family === "floating-shelves") {
    return "Floating Shelves";
  }
  if (family === "floating-mantels") {
    return "Floating Mantels";
  }
  return "Replacement Cabinet Shelves";
}

function familyPath(family: SeoProductFamily) {
  return `/${family}`;
}

function getProductForFamily(family: SeoProductFamily) {
  return getStorefrontProductDefinition({
    categorySlug: family,
    productSlug: productSlugByFamily[family]
  }) as ConfigurableProductDefinition | undefined;
}

function getVariantBySlug(family: SeoProductFamily, slug: string) {
  return getSeoVariantBySlug(family, slug);
}

function getRelatedVariants(family: SeoProductFamily, current: VariantData) {
  return getSeoVariantsForFamily(family)
    .filter((variant) => variant.slug !== current.slug)
    .slice(0, 3);
}

export function getSeoStaticParams(family: SeoProductFamily) {
  return getAllSeoEntriesForFamily(family).map((variant) => ({
    variant: variant.slug
  }));
}

export function getSeoPageDefinition(
  family: SeoProductFamily,
  variantSlug: string
): SeoPageDefinition | null {
  const product = getProductForFamily(family);
  const variant = getVariantBySlug(family, variantSlug);
  const combo = getSeoVariantComboBySlug(family, variantSlug);

  if (!product || (!variant && !combo)) {
    return null;
  }

  const entry = (variant ?? combo) as SeoVariantEntry;
  const pathname = `${familyPath(family)}/${entry.slug}`;
  const resolvedLanding = resolveVariantLandingContent({
    family,
    slug: entry.slug,
    isCombo: Boolean(combo),
    label: entry.label,
    intro: entry.intro,
    ctaLabel: entry.ctaLabel,
    ctaHref: product.pdpPath
  });
  const related =
    applySimpleRelatedPageOverrides({
      pageKey: resolvedLanding.pageKey,
      links: variant
      ? getRelatedVariants(family, variant).map((item) => ({
          title: item.label,
          href: `${familyPath(family)}/${item.slug}`
        }))
      : [
          combo?.componentSlugs.dimension
            ? getSeoVariantBySlug(family, combo.componentSlugs.dimension)
            : undefined,
          combo?.componentSlugs.material
            ? getSeoVariantBySlug(family, combo.componentSlugs.material)
            : undefined,
          combo?.componentSlugs.useCase
            ? getSeoVariantBySlug(family, combo.componentSlugs.useCase)
            : undefined
        ]
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
          .map((item) => ({
            title: item.label,
            href: `${familyPath(family)}/${item.slug}`
          }))
    });
  const imageUrl = product.imagePublicId
    ? getCloudinaryImageUrl(product.imagePublicId, { width: 1200, height: 630 })
    : undefined;
  const resolvedMetadata = generatePageSEO({
    title: entry.title,
    description: entry.description,
    pathname,
    imageUrl,
    imageAlt: resolvedLanding.title,
    pageKey: resolvedLanding.pageKey
  });
  const breadcrumbItems = variant
    ? [
        { name: "Home", path: "/" },
        { name: familyLabel(family), path: `/shop/${family}` },
        { name: variant.label, path: pathname }
      ]
    : [
        { name: "Home", path: "/" },
        { name: familyLabel(family), path: `/shop/${family}` },
        ...(combo?.componentSlugs.dimension
          ? [{
              name: getSeoVariantBySlug(family, combo.componentSlugs.dimension)?.label ?? "Dimension",
              path: `${familyPath(family)}/${combo.componentSlugs.dimension}`
            }]
          : []),
        ...(combo?.componentSlugs.material
          ? [{
              name: getSeoVariantBySlug(family, combo.componentSlugs.material)?.label.replace(
                family === "floating-shelves" ? " Floating Shelves" : " Floating Mantels",
                ""
              ) ?? "Material",
              path: `${familyPath(family)}/${combo.componentSlugs.material}`
            }]
          : []),
        ...(combo?.componentSlugs.useCase
          ? [{
              name: getSeoVariantBySlug(family, combo.componentSlugs.useCase)?.label ?? "Use Case",
              path: `${familyPath(family)}/${combo.componentSlugs.useCase}`
            }]
          : [])
      ];

  return {
    family,
    familyTitle: familyLabel(family),
    variant: {
      ...entry,
      label: resolvedLanding.title,
      intro: resolvedLanding.intro,
      ctaLabel: resolvedLanding.ctaLabel
    },
    pathname,
    product,
    related,
    relatedContent: variant
      ? resolveVariantRelatedContent(family, variant.slug)
      : resolveVariantComboRelatedContent(family, combo!.slug),
    configuratorHref: resolvedLanding.ctaHref,
    metadata: resolvedMetadata,
    breadcrumbSchema: getBreadcrumbSchema(breadcrumbItems),
    productSchema: getProductSchema({
      product,
      name: resolvedLanding.title,
      description: resolvedMetadata.description as string,
      pathname,
      material:
        variant?.kind === "material"
          ? variant.label.replace(" Floating Shelves", "").replace(" Floating Mantels", "")
          : combo?.componentSlugs.material
            ? (getSeoVariantBySlug(family, combo.componentSlugs.material)?.label
                .replace(" Floating Shelves", "")
                .replace(" Floating Mantels", "") ?? "Hardwood")
            : "Hardwood"
    })
  };
}
