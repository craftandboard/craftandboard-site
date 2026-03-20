import {
  buildFloatingShelfCheckoutHref,
  buildFloatingShelfInquiryHref,
  buildFloatingShelfPdpHref
} from "../../order";
import type { ConfigurableProductDefinition } from "../types";
import type { FloatingShelfConfig } from "../../floatingShelf";

export const classicFloatingShelfDefinition: ConfigurableProductDefinition<FloatingShelfConfig> = {
  productFamily: "floating-shelves",
  productSlug: "classic-floating-shelf",
  displayName: "Classic Floating Shelf",
  categorySlug: "floating-shelves",
  liveStatus: "LIVE",
  supportsInstantPricing: true,
  supportsStandardCheckout: true,
  supportsDepositPayment: true,
  supportsReviewFallback: true,
  pdpPath: "/shop/floating-shelves/classic-floating-shelf",
  checkoutPath: "/order/floating-shelves/classic-floating-shelf",
  imagePublicId: "craft-board/classic-floating-shelf",
  category: {
    title: "Floating Shelves",
    description:
      "Made-to-order wall shelving with tailored sizing, finish options, and clean concealed support.",
    supportingCopy:
      "The first active collection is built for exact width, considered depth, and a pricing-first standard order path.",
    imagePublicId: "craft-board/floating-shelves-category"
  },
  content: {
    shortDescription:
      "A clean-lined custom shelf built for exact width, instant standard pricing, and premium concealed mounting.",
    description:
      "Craft & Board floating shelves are built to order for real spaces, with material-forward finishes, instant pricing for standard configurations, and a review-first fallback for complex conditions.",
    storytelling:
      "The Classic Floating Shelf is the launch template because it balances the visual simplicity customers want with the custom variables that matter most: width, depth, mounting path, and a pricing model that can move standard shelves toward direct order intake.",
    featureBullets: [
      "Made to your width and depth",
      "Finish-forward wood options",
      "Designed for concealed mounting"
    ],
    sizeCallouts: ['48"', '72"', '96"'],
    detailBlocks: [
      {
        title: "Built to your exact width",
        body: "Use the common width callouts as a guide, then send the dimension that actually fits the wall and room layout."
      },
      {
        title: "Material and finish guidance",
        body: "Warm oak, rich walnut, lighter maple, and painted maple options give the collection a flexible but intentional launch palette."
      },
      {
        title: "Instant pricing with honest guardrails",
        body: "Standard shelf combinations can price instantly. Long spans, consult-needed mounting, or unusual combinations stay on a review-first path before the order is confirmed."
      }
    ],
    processSteps: [
      "Choose the shelf size, material, and concealed mounting path.",
      "Review the live price and lead-time guidance tied to the exact configuration.",
      "Continue into the order-start flow for standard shelves or use the review path when the project needs closer confirmation."
    ],
    reassurance:
      "Craft & Board prices standard shelves instantly, but still keeps review in the loop when the wall conditions, span, or mounting path warrant a more careful confirmation."
  },
  buildCheckoutHref(configuration) {
    return buildFloatingShelfCheckoutHref(configuration);
  },
  buildPdpHref(configuration) {
    return buildFloatingShelfPdpHref(configuration);
  },
  buildInquiryHref(configuration, sourcePath) {
    return buildFloatingShelfInquiryHref(configuration, sourcePath);
  },
  summarizeConfiguration(configuration) {
    return [
      `${configuration.width}" width`,
      `${configuration.depth}" depth`,
      `${configuration.thickness}" thickness`,
      configuration.materialLabel,
      configuration.mountingLabel,
      `Qty ${configuration.quantity}`
    ];
  }
};
