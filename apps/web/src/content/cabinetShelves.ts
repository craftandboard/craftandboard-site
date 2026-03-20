export type CabinetShelfProduct = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  intro: string;
  summary: string;
  materialLabel: string;
  finishDirection: string;
  bestFor: string;
  trustCopy: string;
  imagePublicId: string;
  href: string;
  orderHref: string;
  bullets: string[];
};

export type CabinetShelfFaqItem = {
  question: string;
  answer: string;
};

export const cabinetShelfCategory = {
  slug: "cabinet-shelves",
  title: "Replacement Cabinet Shelves",
  description:
    "Replacement cabinet shelves cut for real cabinet openings, simple measurement rules, and clean melamine finishes that fit kitchen, bath, pantry, and laundry cabinets.",
  intro:
    "Craft & Board cabinet shelves are built around one simple problem: homeowners need a replacement shelf that actually fits the cabinet they already have. Start with the measurement guide, pick the melamine finish that matches the room, and move into the replacement-shelf product page that fits the project.",
  imagePublicId: "craft-board/built-ins-category"
} as const;

export const cabinetShelfSupportContent = {
  confidenceTitle: "Did I Measure This Right?",
  confidenceBody:
    "Most replacement cabinet shelves fit best when they are slightly smaller than the cabinet opening. A simple rule of thumb is to subtract 1/8 inch from the inside cabinet width so the shelf can slide in without feeling forced.",
  confidenceExample: 'Cabinet opening: 24" → recommended shelf width: 23 7/8"',
  reviewChecklist: [
    "I measured the inside width of the cabinet",
    "I measured the shelf depth",
    "I allowed a little clearance for fit",
    "I chose the correct finish",
    "I checked my quantity"
  ],
  nextStepsTitle: "What Happens After You Submit?",
  nextSteps: [
    "We receive your shelf measurements, quantity, and product details.",
    "We review the order request and confirm the replacement shelf direction.",
    "If anything looks unclear, we contact you before moving forward.",
    "Once the details are confirmed, the shelf order moves into the next production steps."
  ],
  trustPoints: [
    "Built for real replacement cabinet shelf use",
    "Simple 1/8 inch measurement system so the process stays understandable",
    "Cabinet-friendly fit guidance instead of generic shelf advice",
    "Focused product offering with just the two melamine finishes most homeowners actually need"
  ],
  shippingHeading: "Lead Time and Order Expectations",
  shippingBody:
    "This is a made-to-order replacement shelf workflow. Lead time and next steps are confirmed after review so the order path stays accurate instead of guessing at timing too early.",
  guideReminderTitle: "Need help measuring?",
  guideReminderBody:
    "Reopen the cabinet shelf measurement guide any time if you want a quick reminder on inside width, depth, and 1/8 inch clearance guidance."
} as const;

export const cabinetShelfFaqs: CabinetShelfFaqItem[] = [
  {
    question: "How much smaller should my cabinet shelf be?",
    answer:
      "A common rule of thumb is to make the shelf width 1/8 inch smaller than the inside cabinet opening so it slides in more easily."
  },
  {
    question: "Do I measure the cabinet or the old shelf?",
    answer:
      "Measure the inside of the cabinet first. The old shelf can help as a reference, but the cabinet opening is the number that matters most."
  },
  {
    question: "What if my cabinet opening is not perfectly square?",
    answer:
      "Use the smaller inside width so the replacement shelf still fits. It is better to leave a little clearance than to order too tight."
  },
  {
    question: "What if I am not sure about the depth?",
    answer:
      "Measure the shelf depth directly from the cabinet and double-check the number before submitting. If you still are not sure, add a note in the order request so Craft & Board can review it with you."
  },
  {
    question: "Why do you only use 1/8-inch increments?",
    answer:
      "Using 1/8 inch increments keeps the measuring process simple for homeowners while still giving enough sizing accuracy for replacement cabinet shelves."
  },
  {
    question: "Can I order more than one shelf?",
    answer:
      "Yes. The configurator lets you set quantity so you can order more than one replacement shelf in the same request."
  },
  {
    question: "What happens after I submit my measurements?",
    answer:
      "Craft & Board reviews the shelf request, confirms the details if needed, and reaches out if anything looks unclear before moving into the next steps."
  }
];

export const cabinetShelfProducts: CabinetShelfProduct[] = [
  {
    slug: "white-melamine-cabinet-shelf",
    title: "White Melamine Cabinet Shelf",
    shortTitle: "White Melamine Shelf",
    description:
      "A replacement cabinet shelf in white melamine for bright, clean cabinet interiors and easy everyday upkeep.",
    intro:
      "Use the white melamine cabinet shelf when the goal is a clean replacement shelf that fits painted, white, or light-toned cabinet interiors without introducing a wood-grain look.",
    summary:
      "Bright, clean replacement shelf for kitchen, bath, pantry, and utility cabinets.",
    materialLabel: "White Melamine",
    finishDirection: "Clean white finish for bright cabinet interiors",
    bestFor: "Painted cabinets, utility cabinets, pantry shelving, and kitchens that want a simple bright interior.",
    trustCopy:
      "White melamine is the practical bright-finish choice for homeowners replacing everyday cabinet shelves in kitchens, utility rooms, and other hard-working spaces.",
    imagePublicId: "craft-board/built-ins-category",
    href: "/shop/cabinet-shelves/white-melamine-cabinet-shelf",
    orderHref:
      "/contact?source=product-page&productFamily=cabinet-shelves&productSlug=white-melamine-cabinet-shelf&productName=White%20Melamine%20Cabinet%20Shelf",
    bullets: [
      "Sized for replacement cabinet shelf projects",
      "Uses simple 1/8 inch measurement increments",
      "Clean white finish for brighter cabinet interiors"
    ]
  },
  {
    slug: "maple-melamine-cabinet-shelf",
    title: "Maple Melamine Cabinet Shelf",
    shortTitle: "Maple Melamine Shelf",
    description:
      "A replacement cabinet shelf in maple melamine for warmer cabinet interiors that still need an easy-care melamine surface.",
    intro:
      "Use the maple melamine cabinet shelf when the cabinet interior needs a warmer wood-look direction than white melamine while still keeping the practical clean-up and consistency of melamine.",
    summary:
      "Warmer replacement shelf option for cabinet interiors that need a softer wood-look finish.",
    materialLabel: "Maple Melamine",
    finishDirection: "Warm maple-look finish for softer cabinet interiors",
    bestFor: "Warmer kitchens, pantry cabinets, office built-ins, and replacement projects where white would feel too stark.",
    trustCopy:
      "Maple melamine is the warmer wood-look option when the cabinet interior wants a more finished appearance without giving up the practical clean-up and consistency of melamine.",
    imagePublicId: "craft-board/built-ins-category",
    href: "/shop/cabinet-shelves/maple-melamine-cabinet-shelf",
    orderHref:
      "/contact?source=product-page&productFamily=cabinet-shelves&productSlug=maple-melamine-cabinet-shelf&productName=Maple%20Melamine%20Cabinet%20Shelf",
    bullets: [
      "Sized for replacement cabinet shelf openings",
      "Uses simple 1/8 inch measurement increments",
      "Warmer maple-look interior finish"
    ]
  }
];

export function getCabinetShelfProduct(slug: string) {
  return cabinetShelfProducts.find((product) => product.slug === slug);
}
