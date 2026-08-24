import type { HqNumbersGroup, HqStaticSection } from "../../lib/hq/types";

/**
 * Static repo content. Pages must not import this directly — read it through
 * `lib/hq/data.ts`.
 *
 * Every `amountUsd` is null on purpose. The line items are the structure we
 * agreed to fill in; no figure here is estimated or invented. Replace a null
 * with a real number only when it is confirmed.
 */
export const hqNumbersIntro: HqStaticSection = {
  title: "Numbers",
  intent: "Startup costs, equipment, revenue model, and what breakeven actually requires.",
  status: "NOT_STARTED",
  blocks: [
    {
      heading: "Read this first",
      body:
        "Nothing on this page is filled in yet. The line items exist so the three of us are arguing about the same list rather than three different mental models.",
      points: [
        "A blank amount means unconfirmed, not zero",
        "Equipment figures should be actual quotes, not catalog list prices",
        "Breakeven is stated in units per month, not in revenue"
      ]
    }
  ]
};

export const hqNumbersGroups: HqNumbersGroup[] = [
  {
    title: "Startup costs",
    intent: "One-time spend to get to a shop that can take orders.",
    lines: [
      { label: "Entity formation and filings", amountUsd: null, note: "LLC, registered agent, state fees" },
      { label: "Business insurance", amountUsd: null, note: "General liability and equipment coverage" },
      { label: "Shop space deposit and setup", amountUsd: null, note: "First/last, electrical, dust collection" },
      { label: "Initial material inventory", amountUsd: null, note: "Sheet stock and edge banding to start" },
      { label: "Packaging and shipping supplies", amountUsd: null, note: "Cartons, corner protection, labels" },
      { label: "Software and tooling", amountUsd: null, note: "Hosting, Amazon fees, design tools" }
    ]
  },
  {
    title: "Equipment",
    intent: "The capital purchases Tim's contribution is largely sizing.",
    lines: [
      { label: "CNC router", amountUsd: null, note: "Primary cutting capacity constraint" },
      { label: "Panel saw or table saw", amountUsd: null, note: "Breakdown cuts ahead of the CNC" },
      { label: "Edge bander", amountUsd: null, note: "Determines finish quality on every shelf" },
      { label: "Dust collection", amountUsd: null, note: "Required before the shop runs daily" },
      { label: "Material handling and racking", amountUsd: null, note: "Sheet storage, cart, lift assist" },
      { label: "Packing station and label printer", amountUsd: null, note: "Throughput at the ship end" }
    ]
  },
  {
    title: "Revenue model",
    intent: "How a dollar arrives, per product line.",
    lines: [
      { label: "Cabinet shelves — average order value", amountUsd: null, note: "Blended across white and maple" },
      { label: "Custom pull-out drawers — average order value", amountUsd: null, note: "Higher build time per unit" },
      { label: "Pot chairs — average order value", amountUsd: null, note: "Separate build and packaging path" },
      { label: "Average material cost per unit", amountUsd: null, note: "Pull from the cost engine, do not guess" },
      { label: "Amazon fees per order", amountUsd: null, note: "Referral plus fulfillment" },
      { label: "Shipping cost per order", amountUsd: null, note: "Largest variable outside material" }
    ]
  },
  {
    title: "Breakeven",
    intent: "What has to be true monthly for this to sustain itself.",
    lines: [
      { label: "Fixed monthly cost", amountUsd: null, note: "Rent, insurance, software, loan service" },
      { label: "Contribution margin per unit", amountUsd: null, note: "Price less material, fees, shipping" },
      { label: "Units per month to break even", amountUsd: null, note: "Fixed cost divided by contribution margin" },
      { label: "Units per month at current capacity", amountUsd: null, note: "What the shop can actually produce" },
      { label: "Owner draw threshold", amountUsd: null, note: "Volume before anyone takes money out" }
    ]
  }
];
