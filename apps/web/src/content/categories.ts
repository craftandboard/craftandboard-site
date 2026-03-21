import { getStorefrontCategorySummaries } from "../lib/storefront/products/registry";

export type StorefrontCategory = {
  slug: string;
  title: string;
  description: string;
  supportingCopy?: string;
  href: string;
  status: "active" | "coming-soon";
  imagePublicId?: string;
};

export const categories: StorefrontCategory[] = getStorefrontCategorySummaries();
