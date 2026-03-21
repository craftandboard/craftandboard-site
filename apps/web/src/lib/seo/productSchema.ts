import { getCloudinaryImageUrl } from "../media/cloudinary";
import type { ConfigurableProductDefinition } from "../storefront/products/types";
import { absoluteMarketingUrl } from "./metadata";

export function getProductSchema(input: {
  product: ConfigurableProductDefinition;
  material?: string;
  name?: string;
  description?: string;
  pathname?: string;
}) {
  const image = input.product.imagePublicId
    ? getCloudinaryImageUrl(input.product.imagePublicId, { width: 1200, height: 1200 })
    : undefined;
  const pathname = input.pathname ?? input.product.pdpPath;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name ?? input.product.displayName,
    description: input.description ?? input.product.content.description,
    brand: {
      "@type": "Brand",
      name: "Craft & Board"
    },
    category: input.product.category.title,
    url: absoluteMarketingUrl(pathname),
    image: image ? [image] : undefined,
    material: input.material ?? "Hardwood",
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: absoluteMarketingUrl(pathname)
    }
  };
}
