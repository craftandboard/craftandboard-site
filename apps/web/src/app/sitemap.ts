import type { MetadataRoute } from "next";
import { cabinetShelfProducts } from "../content/cabinetShelves";
import { guides } from "../content/guides";
import {
  SEO_PROGRAMMATIC_CONTENT_LAST_UPDATED,
  getAllSeoEntriesForFamily
} from "../lib/seo/productSeoConfig";
import { SEO_SITE_LAST_MODIFIED } from "../lib/seo/indexation";
import { getLiveStorefrontProducts } from "../lib/storefront/products/registry";
import { marketingUrl } from "../lib/site-config";

const staticStorefrontRoutes = [
  "/",
  "/shop",
  "/shop/cabinet-shelves",
  "/guides",
  "/faq",
  "/gallery",
  "/about"
] as const;

function toDate(value: string | undefined) {
  return new Date(value ?? SEO_SITE_LAST_MODIFIED);
}

function getPriority(path: string, productPaths: string[], categoryPaths: string[], guidePaths: string[]) {
  if (path === "/") {
    return 1;
  }

  if (path === "/shop") {
    return 0.9;
  }

  if (categoryPaths.includes(path)) {
    return 0.9;
  }

  if (productPaths.includes(path)) {
    return 0.85;
  }

  if (path === "/guides") {
    return 0.8;
  }

  if (guidePaths.includes(path)) {
    return 0.72;
  }

  if (path.startsWith("/floating-shelves/") || path.startsWith("/floating-mantels/")) {
    return 0.78;
  }

  return 0.7;
}

function getChangeFrequency(path: string, productPaths: string[], categoryPaths: string[], guidePaths: string[]) {
  if (path === "/") {
    return "weekly" as const;
  }

  if (path === "/shop" || categoryPaths.includes(path) || productPaths.includes(path)) {
    return "weekly" as const;
  }

  if (guidePaths.includes(path) || path.startsWith("/floating-shelves/") || path.startsWith("/floating-mantels/")) {
    return "monthly" as const;
  }

  return "monthly" as const;
}

function getLastModified(path: string) {
  const guide = guides.find((entry) => `/guides/${entry.slug}` === path);

  if (guide) {
    return toDate(guide.lastUpdated);
  }

  if (path.startsWith("/floating-shelves/") || path.startsWith("/floating-mantels/")) {
    return toDate(SEO_PROGRAMMATIC_CONTENT_LAST_UPDATED);
  }

  return toDate(SEO_SITE_LAST_MODIFIED);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const liveProducts = getLiveStorefrontProducts();
  const categoryPaths = Array.from(new Set(liveProducts.map((product) => `/shop/${product.categorySlug}`)));
  const productPaths = liveProducts.map((product) => product.pdpPath);
  const cabinetShelfPaths = cabinetShelfProducts.map((product) => product.href);
  const seoPaths = [
    ...getAllSeoEntriesForFamily("floating-shelves").map((variant) => `/floating-shelves/${variant.slug}`),
    ...getAllSeoEntriesForFamily("floating-mantels").map((variant) => `/floating-mantels/${variant.slug}`)
  ];
  const guidePaths = guides.map((guide) => `/guides/${guide.slug}`);

  return [...staticStorefrontRoutes, ...categoryPaths, ...productPaths, ...cabinetShelfPaths, ...seoPaths, ...guidePaths].map((path) => ({
    url: marketingUrl(path),
    lastModified: getLastModified(path),
    changeFrequency: getChangeFrequency(path, [...productPaths, ...cabinetShelfPaths], [...categoryPaths, "/shop/cabinet-shelves"], guidePaths),
    priority: getPriority(path, [...productPaths, ...cabinetShelfPaths], [...categoryPaths, "/shop/cabinet-shelves"], guidePaths)
  }));
}
