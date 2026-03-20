import type { SeoProductFamily } from "./productSeoConfig";

export type SeoPageKey =
  | "HOME"
  | "GUIDE_INDEX"
  | `STATIC:${string}`
  | `CATEGORY:${SeoProductFamily}`
  | `PRODUCT:${string}`
  | `VARIANT:${SeoProductFamily}:${string}`
  | `VARIANT_COMBO:${SeoProductFamily}:${string}`
  | `GUIDE:${string}`;

export type SeoPageOverride = {
  pageKey: SeoPageKey;
  titleOverride?: string | null;
  descriptionOverride?: string | null;
  ogTitleOverride?: string | null;
  ogDescriptionOverride?: string | null;
  heroHeadingOverride?: string | null;
  introOverride?: string | null;
  ctaLabelOverride?: string | null;
  ctaHrefOverride?: string | null;
  priorityRelatedPageKeys?: SeoPageKey[] | null;
  suppressRelatedPageKeys?: SeoPageKey[] | null;
  keywordTargetHint?: string | null;
  refreshNote?: string | null;
  lastUpdated?: string | null;
};

export function getHomePageKey(): SeoPageKey {
  return "HOME";
}

export function getGuideIndexPageKey(): SeoPageKey {
  return "GUIDE_INDEX";
}

export function getStaticPageKey(slug: string): SeoPageKey {
  return `STATIC:${slug}`;
}

export function getCategoryPageKey(family: SeoProductFamily): SeoPageKey {
  return `CATEGORY:${family}`;
}

export function getProductPageKey(productSlug: string): SeoPageKey {
  return `PRODUCT:${productSlug}`;
}

export function getVariantPageKey(family: SeoProductFamily, slug: string): SeoPageKey {
  return `VARIANT:${family}:${slug}`;
}

export function getVariantComboPageKey(family: SeoProductFamily, slug: string): SeoPageKey {
  return `VARIANT_COMBO:${family}:${slug}`;
}

export function getGuidePageKey(slug: string): SeoPageKey {
  return `GUIDE:${slug}`;
}

const FIRST_WAVE_OVERRIDE_DATE = "2026-03-14";

export const seoOverrides: SeoPageOverride[] = [
  {
    pageKey: getGuidePageKey("how-to-measure-cabinet-shelves"),
    titleOverride: "How to Measure Cabinet Shelves | Simple Replacement Shelf Guide | Craft & Board",
    descriptionOverride:
      "Learn how to measure cabinet shelves the easy way before ordering a replacement shelf. Clear width, depth, 1/8 inch, and clearance guidance for homeowners.",
    heroHeadingOverride: "How to measure your cabinet shelf so the replacement fits the first time.",
    introOverride:
      "This guide is built for homeowners who need a replacement cabinet shelf, not a carpentry lesson. Measure the inside width, confirm the depth, follow the 1/8 inch clearance rule, and move into the white or maple melamine shelf that fits the cabinet.",
    ctaLabelOverride: "Order Your Replacement Shelf",
    ctaHrefOverride: "/shop/cabinet-shelves/white-melamine-cabinet-shelf",
    priorityRelatedPageKeys: [
      getProductPageKey("white-melamine-cabinet-shelf"),
      getProductPageKey("maple-melamine-cabinet-shelf"),
      getCategoryPageKey("cabinet-shelves")
    ],
    keywordTargetHint:
      "how to measure cabinet shelves, cabinet shelf replacement size, cabinet shelf dimensions guide",
    refreshNote: "MVP measurement guide created as the primary cabinet-shelf SEO, Pinterest, and outreach asset.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getCategoryPageKey("cabinet-shelves"),
    titleOverride: "Replacement Cabinet Shelves | White and Maple Melamine | Craft & Board",
    descriptionOverride:
      "Shop replacement cabinet shelves in white melamine and maple melamine. Measure the opening, choose the finish, and order the shelf that fits your cabinet.",
    introOverride:
      "Replacement cabinet shelves should be easy to understand. Start with the measurement guide, then choose the white or maple melamine shelf that fits the cabinet interior and the room.",
    ctaLabelOverride: "Use the Measurement Guide",
    ctaHrefOverride: "/guides/how-to-measure-cabinet-shelves",
    priorityRelatedPageKeys: [
      getGuidePageKey("how-to-measure-cabinet-shelves"),
      getProductPageKey("white-melamine-cabinet-shelf"),
      getProductPageKey("maple-melamine-cabinet-shelf")
    ],
    keywordTargetHint: "replacement cabinet shelves, white melamine cabinet shelf, maple melamine cabinet shelf",
    refreshNote: "Added MVP replacement cabinet shelf category messaging and routed the main CTA through the measurement guide.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getProductPageKey("white-melamine-cabinet-shelf"),
    titleOverride: "White Melamine Cabinet Shelf | Replacement Cabinet Shelf | Craft & Board",
    descriptionOverride:
      "Order a white melamine cabinet shelf with the replacement size that fits your cabinet opening. Built for bright, clean cabinet interiors.",
    introOverride:
      "The white melamine cabinet shelf is the cleanest replacement option when the cabinet interior needs a bright, practical finish and a simple measurement-first order path.",
    ctaLabelOverride: "Order White Melamine Shelf",
    ctaHrefOverride:
      "/contact?source=product-page&productFamily=cabinet-shelves&productSlug=white-melamine-cabinet-shelf&productName=White%20Melamine%20Cabinet%20Shelf",
    keywordTargetHint: "white melamine cabinet shelf, replacement cabinet shelf",
    refreshNote: "Created MVP white melamine cabinet shelf PDP tied to the measurement-guide funnel.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getProductPageKey("maple-melamine-cabinet-shelf"),
    titleOverride: "Maple Melamine Cabinet Shelf | Replacement Cabinet Shelf | Craft & Board",
    descriptionOverride:
      "Order a maple melamine cabinet shelf with the replacement size that fits your cabinet opening. Built for warmer cabinet interiors.",
    introOverride:
      "The maple melamine cabinet shelf is the warmer replacement option when the cabinet interior wants a softer wood-look direction without giving up a simple measurement-first order path.",
    ctaLabelOverride: "Order Maple Melamine Shelf",
    ctaHrefOverride:
      "/contact?source=product-page&productFamily=cabinet-shelves&productSlug=maple-melamine-cabinet-shelf&productName=Maple%20Melamine%20Cabinet%20Shelf",
    keywordTargetHint: "maple melamine cabinet shelf, replacement cabinet shelf",
    refreshNote: "Created MVP maple melamine cabinet shelf PDP tied to the measurement-guide funnel.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getHomePageKey(),
    titleOverride: "Custom Floating Shelves and Floating Mantels | Craft & Board",
    descriptionOverride:
      "Shop custom floating shelves and floating mantels built to order in solid wood with contractor-grade detailing, tailored dimensions, and premium material direction.",
    heroHeadingOverride: "Custom floating shelves and mantels built for cleaner architectural rooms.",
    introOverride:
      "Craft & Board is built for projects that need exact dimensions, stronger material direction, and a calmer custom-order path than generic stock shelving or off-the-shelf mantel kits.",
    ctaLabelOverride: "Shop Floating Shelves",
    ctaHrefOverride: "/shop/floating-shelves",
    priorityRelatedPageKeys: [
      getCategoryPageKey("floating-shelves"),
      getCategoryPageKey("floating-mantels"),
      getProductPageKey("classic-floating-shelf"),
      getProductPageKey("classic-floating-mantel")
    ],
    keywordTargetHint: "custom floating shelves, floating mantels, custom wood shelving",
    refreshNote: "First-wave homepage CTR and category-routing refresh focused on shelves, mantels, and contractor-grade custom intent.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getCategoryPageKey("floating-shelves"),
    titleOverride: "Floating Shelves | Custom Solid Wood Floating Shelves | Craft & Board",
    descriptionOverride:
      "Explore custom floating shelves in solid wood with tailored widths, finish direction, and concealed mounting for contractor-grade wall shelving.",
    introOverride:
      "Use the floating shelves collection when the room needs a more exact width, cleaner proportion, and a material direction that feels built in instead of pulled from a stock shelf aisle.",
    ctaLabelOverride: "Shop Custom Floating Shelves",
    ctaHrefOverride: "/shop/floating-shelves/classic-floating-shelf",
    priorityRelatedPageKeys: [
      getProductPageKey("classic-floating-shelf"),
      getVariantPageKey("floating-shelves", "72-inch"),
      getVariantPageKey("floating-shelves", "white-oak"),
      getGuidePageKey("install-floating-shelves"),
      getGuidePageKey("floating-shelf-weight-limits")
    ],
    keywordTargetHint: "floating shelves, custom floating shelves, solid wood floating shelves",
    refreshNote: "Repositioned the shelf category around custom-buy intent and elevated the strongest PDP, variant, and guide paths.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getCategoryPageKey("floating-mantels"),
    titleOverride: "Floating Mantels | Custom Wood Fireplace Mantels | Craft & Board",
    descriptionOverride:
      "Explore custom floating mantels with tailored span, material direction, and concealed support options for modern fireplace-wall projects.",
    introOverride:
      "Use the floating mantel collection when the fireplace wall needs a cleaner span, stronger proportion, and a material direction that feels integrated instead of stock.",
    ctaLabelOverride: "Explore Custom Floating Mantels",
    ctaHrefOverride: "/shop/floating-mantels/classic-floating-mantel",
    priorityRelatedPageKeys: [
      getProductPageKey("classic-floating-mantel"),
      getVariantPageKey("floating-mantels", "72-inch"),
      getVariantPageKey("floating-mantels", "white-oak"),
      getGuidePageKey("floating-mantel-design-ideas")
    ],
    keywordTargetHint: "floating mantels, custom floating mantels, wood fireplace mantels",
    refreshNote: "Shifted the mantel category toward stronger commercial fireplace intent and elevated the flagship mantel paths.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getProductPageKey("classic-floating-shelf"),
    titleOverride: "Custom Floating Shelf | Solid Wood Shelf Built to Order | Craft & Board",
    descriptionOverride:
      "Configure a custom floating shelf in solid hardwood with exact width, depth, thickness, and concealed mounting for a contractor-grade built-in look.",
    introOverride:
      "The Classic Floating Shelf is built for projects that need exact dimensions, premium wood direction, and a more credible concealed-mount result than generic stock shelves can deliver.",
    ctaLabelOverride: "Configure Your Floating Shelf",
    ctaHrefOverride: "/shop/floating-shelves/classic-floating-shelf",
    priorityRelatedPageKeys: [
      getProductPageKey("classic-floating-shelf"),
      getVariantPageKey("floating-shelves", "72-inch"),
      getVariantPageKey("floating-shelves", "white-oak"),
      getVariantPageKey("floating-shelves", "fireplace"),
      getGuidePageKey("install-floating-shelves"),
      getGuidePageKey("best-wood-for-floating-shelves")
    ],
    keywordTargetHint: "custom floating shelf, solid wood floating shelf, made-to-order floating shelf",
    refreshNote: "Sharpened flagship shelf PDP messaging around configurable made-to-order value and the strongest discovery links.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getProductPageKey("classic-floating-mantel"),
    titleOverride: "Custom Floating Mantel | Made-to-Order Wood Mantels | Craft & Board",
    descriptionOverride:
      "Configure a custom floating mantel with tailored span, section profile, material direction, and concealed support for a more architectural fireplace wall.",
    introOverride:
      "The Classic Floating Mantel is designed for fireplace projects that need a cleaner span, better wall proportion, and a made-to-order path instead of settling for a stock beam look.",
    ctaLabelOverride: "Start Your Floating Mantel Design",
    ctaHrefOverride: "/shop/floating-mantels/classic-floating-mantel",
    priorityRelatedPageKeys: [
      getVariantPageKey("floating-mantels", "72-inch"),
      getVariantPageKey("floating-mantels", "white-oak"),
      getVariantPageKey("floating-mantels", "fireplace"),
      getGuidePageKey("floating-mantel-design-ideas")
    ],
    keywordTargetHint: "custom floating mantel, floating wood mantel, made-to-order mantel",
    refreshNote: "Refocused the flagship mantel PDP on custom fireplace-wall intent and stronger supporting discovery links.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getVariantPageKey("floating-shelves", "72-inch"),
    titleOverride: "72 Inch Floating Shelf | Custom Long Solid Wood Shelf | Craft & Board",
    descriptionOverride:
      "Configure a 72 inch floating shelf in solid hardwood with tailored thickness, concealed mounting, and a cleaner long-span architectural fit.",
    heroHeadingOverride: "72 inch floating shelves built for cleaner long-span wall installations.",
    introOverride:
      "A 72 inch floating shelf works best when the project needs one strong horizontal line over furniture, millwork, or a fireplace wall without breaking the composition into smaller shelf segments.",
    ctaLabelOverride: "Configure a 72 Inch Floating Shelf",
    ctaHrefOverride: "/shop/floating-shelves/classic-floating-shelf",
    priorityRelatedPageKeys: [
      getProductPageKey("classic-floating-shelf"),
      getCategoryPageKey("floating-shelves"),
      getGuidePageKey("install-floating-shelves"),
      getVariantPageKey("floating-shelves", "white-oak"),
      getVariantComboPageKey("floating-shelves", "72-inch-white-oak")
    ],
    keywordTargetHint: "72 inch floating shelf, long floating shelf, 72 inch wood shelf",
    refreshNote: "Strengthened long-span shelf targeting and tied the page more directly to the flagship PDP, install guide, and white oak combo path.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getVariantPageKey("floating-shelves", "white-oak"),
    titleOverride: "White Oak Floating Shelves | Custom Solid Wood Shelving | Craft & Board",
    descriptionOverride:
      "Explore white oak floating shelves with custom sizing, concealed mounting, and a warm grain direction that works across kitchens, living rooms, and fireplace walls.",
    heroHeadingOverride: "White oak floating shelves with a calmer, architectural wood direction.",
    introOverride:
      "White oak is often the right shelf material when the room needs visible grain, natural warmth, and enough neutrality to work with stone, plaster, painted millwork, or natural cabinetry.",
    ctaLabelOverride: "Explore White Oak Floating Shelves",
    ctaHrefOverride: "/shop/floating-shelves/classic-floating-shelf",
    priorityRelatedPageKeys: [
      getProductPageKey("classic-floating-shelf"),
      getCategoryPageKey("floating-shelves"),
      getGuidePageKey("best-wood-for-floating-shelves"),
      getGuidePageKey("install-floating-shelves"),
      getVariantPageKey("floating-shelves", "72-inch"),
      getVariantComboPageKey("floating-shelves", "72-inch-white-oak")
    ],
    keywordTargetHint: "white oak floating shelf, white oak wall shelf, solid white oak shelf",
    refreshNote: "Tuned the white oak shelf page toward material-selection intent and stronger connections to the shelf PDP and wood guide.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getVariantPageKey("floating-shelves", "fireplace"),
    titleOverride: "Floating Shelves for Fireplaces | Custom Fireplace Shelving | Craft & Board",
    descriptionOverride:
      "Explore floating shelves for fireplace walls with custom sizing, wood direction, and concealed mounting for a cleaner styled hearth composition.",
    heroHeadingOverride: "Floating shelves for fireplace walls that need more than a generic mantel look.",
    introOverride:
      "Fireplace shelving works best when the width, spacing, and wood tone are planned as part of the full wall composition instead of added as disconnected decorative pieces.",
    ctaLabelOverride: "Design Fireplace Floating Shelves",
    ctaHrefOverride: "/shop/floating-shelves/classic-floating-shelf",
    priorityRelatedPageKeys: [
      getProductPageKey("classic-floating-shelf"),
      getCategoryPageKey("floating-shelves"),
      getGuidePageKey("how-to-style-floating-shelves"),
      getVariantPageKey("floating-shelves", "white-oak"),
      getVariantComboPageKey("floating-shelves", "72-inch-white-oak")
    ],
    keywordTargetHint: "floating shelves for fireplace, fireplace floating shelves",
    refreshNote: "Clarified the fireplace shelf use-case and pushed styling and white-oak supporting paths higher.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getVariantComboPageKey("floating-shelves", "72-inch-white-oak"),
    titleOverride: "72 Inch White Oak Floating Shelf | Custom Long Shelf | Craft & Board",
    descriptionOverride:
      "Configure a 72 inch white oak floating shelf with tailored thickness, concealed mounting, and a premium long-span wood direction for architectural interiors.",
    introOverride:
      "A 72 inch white oak floating shelf is a strong fit when the room needs one longer horizontal line plus the warm, visible grain that white oak brings to kitchens, living rooms, and fireplace walls.",
    ctaLabelOverride: "Configure a 72 Inch White Oak Shelf",
    ctaHrefOverride: "/shop/floating-shelves/classic-floating-shelf",
    priorityRelatedPageKeys: [
      getVariantPageKey("floating-shelves", "72-inch"),
      getVariantPageKey("floating-shelves", "white-oak"),
      getProductPageKey("classic-floating-shelf"),
      getGuidePageKey("best-wood-for-floating-shelves")
    ],
    keywordTargetHint: "72 inch white oak floating shelf",
    refreshNote: "Strengthened the highest-intent shelf combo page with more specific long-span white-oak positioning and cleaner commercial routing.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getVariantPageKey("floating-mantels", "72-inch"),
    titleOverride: "72 Inch Floating Mantel | Custom Wood Mantel | Craft & Board",
    descriptionOverride:
      "Explore a 72 inch floating mantel with custom depth, height, material direction, and concealed support for a cleaner fireplace-wall span.",
    heroHeadingOverride: "72 inch floating mantels designed for balanced fireplace-wall proportions.",
    introOverride:
      "A 72 inch floating mantel is often the right starting span when the fireplace wall needs one cleaner architectural line without overwhelming the surround.",
    ctaLabelOverride: "Configure a 72 Inch Floating Mantel",
    ctaHrefOverride: "/shop/floating-mantels/classic-floating-mantel",
    priorityRelatedPageKeys: [
      getProductPageKey("classic-floating-mantel"),
      getCategoryPageKey("floating-mantels"),
      getGuidePageKey("floating-mantel-design-ideas"),
      getVariantPageKey("floating-mantels", "white-oak"),
      getVariantComboPageKey("floating-mantels", "72-inch-white-oak")
    ],
    keywordTargetHint: "72 inch floating mantel, 72 inch wood mantel",
    refreshNote: "Pulled the 72-inch mantel page closer to fireplace-wall planning intent and strengthened the flagship commercial route.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getVariantPageKey("floating-mantels", "white-oak"),
    titleOverride: "White Oak Floating Mantels | Custom Fireplace Mantels | Craft & Board",
    descriptionOverride:
      "Explore white oak floating mantels with custom span, section profile, and concealed support for a warm, architectural fireplace finish.",
    heroHeadingOverride: "White oak floating mantels with a warm, tailored fireplace presence.",
    introOverride:
      "White oak is a strong mantel material when the fireplace wall needs warmth, visible grain, and enough neutrality to work with plaster, stone, or painted built-ins.",
    ctaLabelOverride: "Explore White Oak Floating Mantels",
    ctaHrefOverride: "/shop/floating-mantels/classic-floating-mantel",
    priorityRelatedPageKeys: [
      getProductPageKey("classic-floating-mantel"),
      getCategoryPageKey("floating-mantels"),
      getGuidePageKey("floating-mantel-design-ideas"),
      getVariantPageKey("floating-mantels", "72-inch"),
      getVariantComboPageKey("floating-mantels", "72-inch-white-oak")
    ],
    keywordTargetHint: "white oak floating mantel, white oak fireplace mantel",
    refreshNote: "Focused the white oak mantel page on material-selection intent and the strongest supporting mantel routes.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getVariantPageKey("floating-mantels", "fireplace"),
    titleOverride: "Floating Mantel for Fireplace Walls | Custom Wood Mantels | Craft & Board",
    descriptionOverride:
      "Explore floating mantels for fireplace walls with custom span, wood direction, and concealed support for a cleaner modern surround.",
    heroHeadingOverride: "Floating mantels for fireplace walls that need cleaner proportion and material presence.",
    introOverride:
      "A fireplace mantel should feel proportionate to the wall, surround, and room rather than read like a generic beam dropped into place after the design was already finished.",
    ctaLabelOverride: "Start Your Fireplace Mantel Design",
    ctaHrefOverride: "/shop/floating-mantels/classic-floating-mantel",
    priorityRelatedPageKeys: [
      getProductPageKey("classic-floating-mantel"),
      getCategoryPageKey("floating-mantels"),
      getGuidePageKey("floating-mantel-design-ideas"),
      getVariantPageKey("floating-mantels", "white-oak"),
      getVariantComboPageKey("floating-mantels", "72-inch-white-oak")
    ],
    keywordTargetHint: "floating mantel for fireplace, modern fireplace mantel",
    refreshNote: "Clarified fireplace-use intent on the mantel cluster and elevated the design-ideas guide and combo path.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getVariantComboPageKey("floating-mantels", "72-inch-white-oak"),
    titleOverride: "72 Inch White Oak Floating Mantel | Custom Wood Mantel | Craft & Board",
    descriptionOverride:
      "Configure a 72 inch white oak floating mantel with custom depth, height, and concealed support for a warm, architectural fireplace-wall finish.",
    introOverride:
      "A 72 inch white oak floating mantel combines one of the strongest fireplace-wall spans with a material direction that feels warm, current, and easy to integrate with stone or plaster.",
    ctaLabelOverride: "Configure a 72 Inch White Oak Mantel",
    ctaHrefOverride: "/shop/floating-mantels/classic-floating-mantel",
    priorityRelatedPageKeys: [
      getVariantPageKey("floating-mantels", "72-inch"),
      getVariantPageKey("floating-mantels", "white-oak"),
      getProductPageKey("classic-floating-mantel"),
      getGuidePageKey("floating-mantel-design-ideas")
    ],
    keywordTargetHint: "72 inch white oak floating mantel",
    refreshNote: "Strengthened the highest-intent mantel combo page around span-plus-material fireplace searches.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getGuidePageKey("install-floating-shelves"),
    titleOverride: "How to Install Floating Shelves for a Cleaner Built-In Look | Craft & Board",
    descriptionOverride:
      "Learn how to install floating shelves with better planning around width, concealed mounting, wall conditions, and final shelf alignment.",
    heroHeadingOverride: "How to install floating shelves with a cleaner, more built-in result.",
    introOverride:
      "The strongest floating shelf installations start with the exact room proportion, wall condition, and concealed mounting path before the shelf is ever finished, not after the hardware is already in hand.",
    ctaLabelOverride: "Configure Your Floating Shelf",
    ctaHrefOverride: "/shop/floating-shelves/classic-floating-shelf",
    priorityRelatedPageKeys: [
      getProductPageKey("classic-floating-shelf"),
      getVariantPageKey("floating-shelves", "72-inch"),
      getGuidePageKey("floating-shelf-weight-limits"),
      getCategoryPageKey("floating-shelves")
    ],
    keywordTargetHint: "how to install floating shelves, floating shelf installation",
    refreshNote: "Improved guide CTR and moved the primary conversion path directly into the live shelf PDP.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getGuidePageKey("floating-shelf-weight-limits"),
    titleOverride: "Floating Shelf Weight Limits: What Actually Matters | Craft & Board",
    descriptionOverride:
      "Understand floating shelf weight limits through span, depth, mounting path, wall conditions, and the difference between styling loads and real daily use.",
    heroHeadingOverride: "How much weight can floating shelves hold in real-world use?",
    introOverride:
      "Floating shelf weight limits make more sense when the project is planned around span, depth, concealed support, and the actual wall condition rather than a single oversimplified pound number.",
    ctaLabelOverride: "Plan a 72 Inch Floating Shelf",
    ctaHrefOverride: "/floating-shelves/72-inch",
    priorityRelatedPageKeys: [
      getVariantPageKey("floating-shelves", "72-inch"),
      getProductPageKey("classic-floating-shelf"),
      getGuidePageKey("install-floating-shelves"),
      getCategoryPageKey("floating-shelves")
    ],
    keywordTargetHint: "floating shelf weight limits, floating shelf weight capacity",
    refreshNote: "Adjusted weight-capacity guide toward stronger informational CTR and a clearer commercial path into long-span shelves.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getGuidePageKey("best-wood-for-floating-shelves"),
    titleOverride: "Best Wood for Floating Shelves: White Oak, Walnut, or Maple? | Craft & Board",
    descriptionOverride:
      "Compare white oak, walnut, and maple for floating shelves, including grain character, room fit, and the best next step into a custom shelf configuration.",
    heroHeadingOverride: "How to choose the best wood for floating shelves without guessing.",
    introOverride:
      "The best wood for floating shelves depends on how much warmth, contrast, and grain presence the room needs, plus which material direction will still lead cleanly into a made-to-order shelf decision.",
    ctaLabelOverride: "Explore White Oak Floating Shelves",
    ctaHrefOverride: "/floating-shelves/white-oak",
    priorityRelatedPageKeys: [
      getVariantPageKey("floating-shelves", "white-oak"),
      getVariantPageKey("floating-shelves", "72-inch-white-oak"),
      getProductPageKey("classic-floating-shelf"),
      getGuidePageKey("how-to-style-floating-shelves")
    ],
    keywordTargetHint: "best wood for floating shelves",
    refreshNote: "Sharpened wood-selection intent and moved the primary CTA into the strongest material-specific commercial path.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getGuidePageKey("floating-shelves-vs-brackets"),
    titleOverride: "Floating Shelves vs Brackets: Which Look Fits the Room? | Craft & Board",
    descriptionOverride:
      "Compare floating shelves vs bracket shelves across visual weight, concealed support, styling flexibility, and when a cleaner wall-mounted look matters most.",
    heroHeadingOverride: "Floating shelves vs brackets: which direction creates the cleaner result?",
    introOverride:
      "The difference between floating shelves and bracket shelves is not only structural. It changes how architectural, quiet, and built-in the final wall composition feels.",
    ctaLabelOverride: "Start a Floating Shelf Project",
    ctaHrefOverride: "/shop/floating-shelves/classic-floating-shelf",
    priorityRelatedPageKeys: [
      getProductPageKey("classic-floating-shelf"),
      getVariantPageKey("floating-shelves", "fireplace"),
      getGuidePageKey("install-floating-shelves"),
      getCategoryPageKey("floating-shelves")
    ],
    keywordTargetHint: "floating shelves vs brackets",
    refreshNote: "Improved comparison-guide CTR and pushed the page toward a clearer concealed-shelf conversion path.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getGuidePageKey("how-to-style-floating-shelves"),
    titleOverride: "How to Style Floating Shelves Without Making Them Feel Cluttered | Craft & Board",
    descriptionOverride:
      "Use layered styling, spacing, and wood-tone choices to style floating shelves in living rooms, fireplace walls, and other design-led interiors.",
    heroHeadingOverride: "How to style floating shelves so they feel intentional instead of busy.",
    introOverride:
      "Good floating shelf styling starts with the shelf width, depth, and room context first. The objects come later, once the wall already feels proportionate and calm.",
    ctaLabelOverride: "Explore Fireplace Shelf Ideas",
    ctaHrefOverride: "/floating-shelves/fireplace",
    priorityRelatedPageKeys: [
      getVariantPageKey("floating-shelves", "fireplace"),
      getCategoryPageKey("floating-shelves"),
      getGuidePageKey("best-wood-for-floating-shelves"),
      getProductPageKey("classic-floating-shelf")
    ],
    keywordTargetHint: "how to style floating shelves, floating shelf styling ideas",
    refreshNote: "Shifted the styling guide toward a stronger fireplace-shelf commercial bridge and cleaner supporting links.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getGuidePageKey("floating-mantel-design-ideas"),
    titleOverride: "Floating Mantel Design Ideas for Modern Fireplace Walls | Craft & Board",
    descriptionOverride:
      "Explore floating mantel design ideas with span, material, and fireplace-wall guidance that connects inspiration to a real custom mantel path.",
    heroHeadingOverride: "Floating mantel design ideas that hold up once the fireplace wall is actually built.",
    introOverride:
      "The best floating mantel ideas are not only decorative. They depend on span, section profile, material tone, and how the mantel relates to the full fireplace wall composition.",
    ctaLabelOverride: "Start Your Floating Mantel Design",
    ctaHrefOverride: "/shop/floating-mantels/classic-floating-mantel",
    priorityRelatedPageKeys: [
      getProductPageKey("classic-floating-mantel"),
      getVariantPageKey("floating-mantels", "fireplace"),
      getVariantPageKey("floating-mantels", "white-oak"),
      getCategoryPageKey("floating-mantels")
    ],
    keywordTargetHint: "floating mantel design ideas, modern fireplace mantel",
    refreshNote: "Improved the mantel authority guide around design-intent searches and directed traffic more clearly into the flagship mantel path.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  },
  {
    pageKey: getGuideIndexPageKey(),
    titleOverride: "Floating Shelf and Mantel Guides | Design, Install, and Planning | Craft & Board",
    descriptionOverride:
      "Browse Craft & Board guides covering floating shelf installation, wood selection, styling, weight planning, and floating mantel design ideas.",
    heroHeadingOverride: "Authority content built around the shelf and mantel questions customers search first.",
    introOverride:
      "These guides exist to answer pre-purchase questions clearly, then route that research into the live shelf and mantel product paths where the real configurator journey begins.",
    ctaLabelOverride: "Start a Shelf Project",
    ctaHrefOverride: "/shop/floating-shelves/classic-floating-shelf",
    keywordTargetHint: "floating shelf guides",
    refreshNote: "Refocused the guides hub around search-to-commerce routing.",
    lastUpdated: FIRST_WAVE_OVERRIDE_DATE
  }
];
