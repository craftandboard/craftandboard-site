import type { Metadata } from "next";
import { getCloudinaryImageUrl } from "../media/cloudinary";
import { storefrontConfig } from "../storefront/config";
import { resolveSeoMetadata } from "./overrideResolver";
import type { SeoPageKey } from "./overrides";
import { getSeoSocialImageUrls } from "./socialImages";
import { marketingUrl } from "../site-config";

type GeneratePageSEOInput = {
  title: string;
  description: string;
  pathname: string;
  imageUrl?: string;
  imageAlt?: string;
  type?: "website" | "article";
  robots?: Metadata["robots"];
  pageKey?: SeoPageKey | null;
};

export function getDefaultOgImage() {
  return getCloudinaryImageUrl("craft-board/classic-floating-shelf", {
    width: 1200,
    height: 630
  });
}

export function absoluteMarketingUrl(pathname: string) {
  return marketingUrl(pathname);
}

export function generatePageSEO(input: GeneratePageSEOInput): Metadata {
  const canonical = absoluteMarketingUrl(input.pathname);
  const resolved = resolveSeoMetadata({
    pageKey: input.pageKey,
    title: input.title,
    description: input.description
  });
  const socialImages = getSeoSocialImageUrls({
    pageKey: input.pageKey,
    pathname: input.pathname
  });
  const image = socialImages?.og ?? input.imageUrl ?? getDefaultOgImage();
  const pinterestImage = socialImages?.pinterest ?? image;

  return {
    title: resolved.title,
    description: resolved.description,
    alternates: {
      canonical
    },
    openGraph: {
      title: resolved.ogTitle,
      description: resolved.ogDescription,
      url: canonical,
      type: input.type ?? "website",
      siteName: storefrontConfig.brandName,
      images: [
        {
          url: image,
          alt: input.imageAlt ?? String(resolved.title)
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: resolved.ogTitle,
      description: resolved.ogDescription,
      images: [image]
    },
    other: {
      "pinterest-rich-pin": "true",
      "pinterest:image": pinterestImage
    },
    robots: input.robots
  };
}

export function noIndexMetadata(input: {
  title: string;
  description: string;
}): Metadata {
  return {
    title: input.title,
    description: input.description,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true
      }
    }
  };
}
