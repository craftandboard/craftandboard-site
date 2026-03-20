import {
  buildFloatingMantelCheckoutHref,
  buildFloatingMantelInquiryHref,
  buildFloatingMantelPdpHref
} from "../../order";
import type { ConfigurableProductDefinition } from "../types";
import type { FloatingMantelConfig } from "../../floatingMantel";

export const classicFloatingMantelDefinition: ConfigurableProductDefinition<FloatingMantelConfig> = {
  productFamily: "floating-mantels",
  productSlug: "classic-floating-mantel",
  displayName: "Classic Floating Mantel",
  categorySlug: "floating-mantels",
  liveStatus: "LIVE",
  supportsInstantPricing: true,
  supportsStandardCheckout: true,
  supportsDepositPayment: true,
  supportsReviewFallback: true,
  pdpPath: "/shop/floating-mantels/classic-floating-mantel",
  checkoutPath: "/order/floating-mantels/classic-floating-mantel",
  imagePublicId: "craft-board/mantel-category",
  category: {
    title: "Floating Mantels",
    description:
      "Made-to-order floating mantels with configurable span, section depth, and concealed support paths.",
    supportingCopy:
      "Floating Mantels are now live on the same pricing, checkout, and deposit-payment framework as shelves.",
    imagePublicId: "craft-board/mantel-category"
  },
  content: {
    shortDescription:
      "A made-to-order mantel with configurable length, profile depth, and concealed support options for standard fireplace spans.",
    description:
      "Craft & Board floating mantels are built for fireplace walls that need clean architectural presence, exact sizing, and an honest standard-order path for launch-ready configurations.",
    storytelling:
      "The Classic Floating Mantel proves the product framework works beyond shelves: same order architecture, same payment flow, different dimensions, pricing logic, and install guardrails.",
    featureBullets: [
      "Configured to your mantel span",
      "Material-led wood options",
      "Concealed support with review guardrails"
    ],
    sizeCallouts: ['60"', '72"', '84"'],
    detailBlocks: [
      {
        title: "Sized to the fireplace wall",
        body: "Set the mantel length to the actual surround and room composition instead of forcing a stock span into a custom install."
      },
      {
        title: "Built for visible profile depth",
        body: "Depth and height work together to shape how substantial the mantel reads in the room, especially over stone, plaster, or built-ins."
      },
      {
        title: "Instant pricing with review guardrails",
        body: "Standard mantel configurations can move directly into order and deposit payment. Oversized spans or consult-needed support paths still route into review first."
      }
    ],
    processSteps: [
      "Choose the mantel length, depth, height, material, and support path.",
      "Review the live price and lead-time guidance tied to the exact configuration.",
      "Continue into standard order and deposit payment for eligible mantels, or use the review path when support conditions need confirmation."
    ],
    reassurance:
      "Craft & Board prices standard mantels instantly while keeping project review in the loop for longer spans, consult-needed installs, and unsupported combinations."
  },
  buildCheckoutHref(configuration) {
    return buildFloatingMantelCheckoutHref(configuration);
  },
  buildPdpHref(configuration) {
    return buildFloatingMantelPdpHref(configuration);
  },
  buildInquiryHref(configuration, sourcePath) {
    return buildFloatingMantelInquiryHref(configuration, sourcePath);
  },
  summarizeConfiguration(configuration) {
    return [
      `${configuration.length}" length`,
      `${configuration.depth}" depth`,
      `${configuration.height}" height`,
      configuration.materialLabel,
      configuration.mountingLabel,
      `Qty ${configuration.quantity}`
    ];
  }
};
