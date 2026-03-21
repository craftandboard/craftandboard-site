import { classicFloatingShelfDefinition } from "./floatingShelves/classicFloatingShelf";
import { classicFloatingMantelDefinition } from "./floatingMantels/classicFloatingMantel";
import type { ConfigurableProductDefinition } from "./types";

const placeholderCategories = {
  mantels: {
    title: "Floating Mantels",
    description: "Architectural mantels are next in line with configurable sizing and finish direction.",
    supportingCopy: "Registered now so the product framework can merchandise future launches cleanly.",
    imagePublicId: "craft-board/mantel-category"
  },
  closets: {
    title: "Closet Shelving Systems",
    description: "Modular closet components will follow on the same configurator and payment framework.",
    supportingCopy: "Coming soon as a larger system product family built on the same order shell.",
    imagePublicId: "craft-board/built-ins-category"
  },
  cabinets: {
    title: "Cabinet Modules",
    description: "Cabinet-ready storage modules are planned as a future configurable product line.",
    supportingCopy: "The registry already reserves their family and launch status.",
    imagePublicId: "craft-board/built-ins-category"
  },
  mudrooms: {
    title: "Mudroom Bench Systems",
    description: "Bench-and-storage systems are queued as a future made-to-order collection.",
    supportingCopy: "They remain merchandisable without exposing unfinished checkout paths.",
    imagePublicId: "craft-board/built-ins-category"
  },
  windowSeats: {
    title: "Window Seat Systems",
    description: "Window seat builds are planned as a later architectural furniture launch.",
    supportingCopy: "The product framework keeps them visible as intentional future releases.",
    imagePublicId: "craft-board/built-ins-category"
  }
} as const;

export const craftBoardProductRegistry = [
  classicFloatingShelfDefinition,
  classicFloatingMantelDefinition,
  {
    productFamily: "closet-shelving-systems",
    productSlug: "foundation-closet-system",
    displayName: "Closet Shelving System",
    categorySlug: "closet-shelving-systems",
    liveStatus: "COMING_SOON",
    supportsInstantPricing: false,
    supportsStandardCheckout: false,
    supportsDepositPayment: false,
    supportsReviewFallback: true,
    pdpPath: "/shop",
    checkoutPath: "/shop",
    category: placeholderCategories.closets,
    imagePublicId: "craft-board/built-ins-category",
    content: {
      shortDescription: "Closet systems are framework-registered for a later release.",
      description: "This product family is reserved in the registry so launch work stays additive.",
      storytelling: "The framework now supports more than one configurable family.",
      featureBullets: ["Coming soon"],
      sizeCallouts: [],
      detailBlocks: [],
      processSteps: [],
      reassurance: "Live status prevents unfinished flows from surfacing as ready."
    },
    buildCheckoutHref() { return "/shop"; },
    buildPdpHref() { return "/shop"; },
    buildInquiryHref() { return "/contact"; },
    summarizeConfiguration() { return []; }
  },
  {
    productFamily: "cabinet-modules",
    productSlug: "starter-cabinet-module",
    displayName: "Cabinet Module",
    categorySlug: "cabinet-modules",
    liveStatus: "COMING_SOON",
    supportsInstantPricing: false,
    supportsStandardCheckout: false,
    supportsDepositPayment: false,
    supportsReviewFallback: true,
    pdpPath: "/shop",
    checkoutPath: "/shop",
    category: placeholderCategories.cabinets,
    imagePublicId: "craft-board/built-ins-category",
    content: {
      shortDescription: "Cabinet modules will reuse the same configurable commerce stack.",
      description: "Registered now for clean future rollout.",
      storytelling: "Product-family growth should come from registration, not copy-paste forks.",
      featureBullets: ["Coming soon"],
      sizeCallouts: [],
      detailBlocks: [],
      processSteps: [],
      reassurance: "The registry holds future products without exposing broken checkout routes."
    },
    buildCheckoutHref() { return "/shop"; },
    buildPdpHref() { return "/shop"; },
    buildInquiryHref() { return "/contact"; },
    summarizeConfiguration() { return []; }
  },
  {
    productFamily: "mudroom-bench-systems",
    productSlug: "starter-mudroom-bench",
    displayName: "Mudroom Bench System",
    categorySlug: "mudroom-bench-systems",
    liveStatus: "COMING_SOON",
    supportsInstantPricing: false,
    supportsStandardCheckout: false,
    supportsDepositPayment: false,
    supportsReviewFallback: true,
    pdpPath: "/shop",
    checkoutPath: "/shop",
    category: placeholderCategories.mudrooms,
    imagePublicId: "craft-board/built-ins-category",
    content: {
      shortDescription: "Mudroom benches are queued as a future configurable system.",
      description: "This family is represented now without pretending it is live.",
      storytelling: "The same pricing, eligibility, checkout, and payment contracts can support it later.",
      featureBullets: ["Coming soon"],
      sizeCallouts: [],
      detailBlocks: [],
      processSteps: [],
      reassurance: "Coming-soon products stay merchandisable and controlled."
    },
    buildCheckoutHref() { return "/shop"; },
    buildPdpHref() { return "/shop"; },
    buildInquiryHref() { return "/contact"; },
    summarizeConfiguration() { return []; }
  },
  {
    productFamily: "window-seat-systems",
    productSlug: "starter-window-seat",
    displayName: "Window Seat System",
    categorySlug: "window-seat-systems",
    liveStatus: "COMING_SOON",
    supportsInstantPricing: false,
    supportsStandardCheckout: false,
    supportsDepositPayment: false,
    supportsReviewFallback: true,
    pdpPath: "/shop",
    checkoutPath: "/shop",
    category: placeholderCategories.windowSeats,
    imagePublicId: "craft-board/built-ins-category",
    content: {
      shortDescription: "Window seat systems are registered for a later launch wave.",
      description: "The product framework now makes that future addition straightforward.",
      storytelling: "This keeps the storefront architecture product-aware instead of shelf-only.",
      featureBullets: ["Coming soon"],
      sizeCallouts: [],
      detailBlocks: [],
      processSteps: [],
      reassurance: "Future products can stay visible without exposing incomplete commerce behavior."
    },
    buildCheckoutHref() { return "/shop"; },
    buildPdpHref() { return "/shop"; },
    buildInquiryHref() { return "/contact"; },
    summarizeConfiguration() { return []; }
  }
] as const satisfies readonly ConfigurableProductDefinition[];

export function getStorefrontProductDefinition(input: {
  categorySlug: string;
  productSlug: string;
}) {
  return craftBoardProductRegistry.find(
    (product) =>
      product.categorySlug === input.categorySlug &&
      product.productSlug === input.productSlug
  );
}

export function getStorefrontProductByFamily(input: {
  productFamily: string;
  productSlug: string;
}) {
  return craftBoardProductRegistry.find(
    (product) =>
      product.productFamily === input.productFamily &&
      product.productSlug === input.productSlug
  );
}

export function getStorefrontProductsByCategory(categorySlug: string) {
  return craftBoardProductRegistry.filter((product) => product.categorySlug === categorySlug);
}

export function getStorefrontCategorySummaries() {
  const seen = new Map<string, ConfigurableProductDefinition>();

  for (const product of craftBoardProductRegistry) {
    if (!seen.has(product.categorySlug)) {
      seen.set(product.categorySlug, product);
    }
  }

  return Array.from(seen.values()).map((product) => ({
    slug: product.categorySlug,
    title: product.category.title,
    description: product.category.description,
    supportingCopy: product.category.supportingCopy,
    href:
      product.liveStatus === "LIVE"
        ? `/shop/${product.categorySlug}`
        : "/shop",
    status: (product.liveStatus === "LIVE" ? "active" : "coming-soon") as "active" | "coming-soon",
    imagePublicId: product.category.imagePublicId
  }));
}

export function getLiveStorefrontProducts() {
  return craftBoardProductRegistry.filter((product) => product.liveStatus === "LIVE");
}
