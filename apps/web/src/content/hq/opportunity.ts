import type { HqStaticSection } from "../../lib/hq/types";

/**
 * Static repo content. Pages must not import this directly — read it through
 * `lib/hq/data.ts`.
 */
export const hqOpportunity: HqStaticSection = {
  title: "Opportunity",
  intent: "The market, who buys, who else is selling, and what we do that they cannot.",
  status: "DRAFT",
  blocks: [
    {
      heading: "The market",
      body:
        "Replacement cabinet shelving and cabinet inserts are a repair-and-upgrade category rather than a furniture category. Purchases are triggered by a specific broken or missing part.",
      points: [
        "TODO — confirmed search volume for the cabinet shelf terms we rank for",
        "TODO — the pull-out drawer and pot chair categories sized the same way",
        "Demand is non-seasonal in a way discretionary furniture is not",
        "Buyers are replacing one shelf, not furnishing a room"
      ]
    },
    {
      heading: "The customer",
      body:
        "The buyer already measured. They want the part to fit and arrive intact, and they are more price-tolerant than a browsing shopper because the alternative is replacing the whole cabinet.",
      points: [
        "Homeowners repairing or upgrading existing cabinets",
        "Cabinet installers and small remodelers ordering to a spec",
        "Repeat buyers who order a second shelf once the first one fits",
        "Failure mode that matters most: wrong size, or damaged in transit"
      ]
    },
    {
      heading: "The competition",
      body:
        "The category splits into fixed-size sellers who cannot fit odd cabinets and local shops who cannot reach a national audience.",
      points: [
        "Big-box fixed-size shelving — cheap, wrong dimensions, high return rate",
        "Amazon resellers — no manufacturing control, no custom sizing",
        "Local cabinet shops — good fit, no listing presence, slow quoting",
        "TODO — name the specific competing listings we track"
      ]
    },
    {
      heading: "The edge",
      body:
        "We own both ends: the listing that captures the search and the shop that cuts the part. Most competitors own one.",
      points: [
        "Cut-to-size on demand with no finished-goods inventory",
        "Costing and quoting already systematized rather than guessed per order",
        "In-house SEO and listing work instead of paid agency spend",
        "Manufacturing software that turns an order into a cut list without manual retyping"
      ]
    }
  ]
};
