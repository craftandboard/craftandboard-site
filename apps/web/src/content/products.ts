import { craftBoardProductRegistry } from "../lib/storefront/products/registry";

export type StorefrontProduct = {
  slug: string;
  categorySlug: string;
  name: string;
  shortDescription: string;
  description: string;
  storytelling: string;
  href: string;
  imagePublicId?: string;
  featureBullets: string[];
  sizeCallouts: string[];
  detailBlocks: Array<{
    title: string;
    body: string;
  }>;
  processSteps: string[];
  reassurance: string;
  liveStatus: "LIVE" | "COMING_SOON" | "INTERNAL_ONLY";
};

export const products: StorefrontProduct[] = craftBoardProductRegistry
  .filter((product) => product.liveStatus !== "INTERNAL_ONLY")
  .map((product) => ({
    slug: product.productSlug,
    categorySlug: product.categorySlug,
    name: product.displayName,
    shortDescription: product.content.shortDescription,
    description: product.content.description,
    storytelling: product.content.storytelling,
    href: product.liveStatus === "LIVE" ? product.pdpPath : "/shop",
    imagePublicId: product.imagePublicId,
    featureBullets: product.content.featureBullets,
    sizeCallouts: product.content.sizeCallouts,
    detailBlocks: product.content.detailBlocks,
    processSteps: product.content.processSteps,
    reassurance: product.content.reassurance,
    liveStatus: product.liveStatus
  }));
