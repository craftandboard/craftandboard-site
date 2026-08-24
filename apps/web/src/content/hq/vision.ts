import type { HqStaticSection } from "../../lib/hq/types";

/**
 * Static repo content. Pages must not import this directly — read it through
 * `lib/hq/data.ts`.
 */
export const hqVision: HqStaticSection = {
  title: "Vision",
  intent: "What Craft & Board is, what it makes, and why the three of us are building it.",
  status: "DRAFT",
  blocks: [
    {
      heading: "What the company is",
      body:
        "Craft & Board is a manufacturing company that sells made-to-order wood products on Amazon. We cut, edge band, and ship from our own shop rather than reselling someone else's inventory.",
      points: [
        "Cabinet shelves — replacement and custom sizes in white and maple melamine",
        "Custom pull-out drawers — built to the customer's measured cabinet opening",
        "Pot chairs — a defined product line with its own build and packaging path",
        "Every order is cut to the customer's dimensions; nothing sits as finished stock"
      ]
    },
    {
      heading: "Why this works",
      body:
        "Made-to-order shelving is a category where Amazon customers already search by dimension, and where national retailers cannot compete on fit. The constraint is manufacturing throughput, not demand generation.",
      points: [
        "Customers arrive with an exact size in hand and a cabinet they cannot return",
        "Cut-to-size removes the return risk that kills fixed-size shelf listings",
        "Margin lives in the shop floor, not in the listing",
        "TODO — add the demand evidence we are actually working from"
      ]
    },
    {
      heading: "Where it goes",
      body:
        "The software that runs the shop is already built. The open question this portal exists to answer is who runs which part of the company and on what terms.",
      points: [
        "Near term: prove the shop can hold quality and lead time at higher volume",
        "Medium term: widen the product line beyond shelves without adding chaos",
        "TODO — the three of us agree on the 12-month target before this stops being a draft"
      ]
    },
    {
      heading: "Why the three of us",
      body:
        "Each partner covers a function the other two cannot cover alone. That split is the actual subject of the roles page.",
      points: [
        "Brandon — product, systems, marketing and SEO",
        "Tyler — day-to-day operations",
        "Tim — capital; deployed overseas through year end"
      ]
    }
  ]
};
