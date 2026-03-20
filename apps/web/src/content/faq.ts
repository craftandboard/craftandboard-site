export type FaqItem = {
  question: string;
  answer: string;
  group: "Ordering" | "Sizing" | "Materials" | "Installation";
};

export const faqItems: FaqItem[] = [
  {
    question: "Are your shelves made to order?",
    answer:
      "Yes. Craft & Board shelves are built to order around your selected size, material direction, and mounting needs rather than pulled from a stock catalog.",
    group: "Ordering"
  },
  {
    question: "Can I request custom dimensions?",
    answer:
      "Yes. Phase 1 is built around custom sizing. You can start with common examples like 48, 72, or 96 inches and request the width that fits your space.",
    group: "Sizing"
  },
  {
    question: "How does the quote process work?",
    answer:
      "You choose the shelf style, enter your dimensions and finish preferences, and send a structured request. Craft & Board reviews the details and follows up with the right next step.",
    group: "Ordering"
  },
  {
    question: "What materials or finishes are available?",
    answer:
      "Starter finish directions include White Oak, Walnut, Natural Maple, and Painted Maple, with room to expand the catalog as the storefront grows.",
    group: "Materials"
  },
  {
    question: "Do you help with mounting questions?",
    answer:
      "Yes. The first release includes concealed bracket options and a consult-oriented path for spaces that need a closer review.",
    group: "Installation"
  },
  {
    question: "What happens after I submit an inquiry?",
    answer:
      "Your request is reviewed for fit, finish direction, and mounting path before next steps are confirmed. The storefront does not pretend to auto-approve a final quote instantly.",
    group: "Ordering"
  },
  {
    question: "How should I provide my dimensions?",
    answer:
      "Provide the finished shelf width, intended depth, and desired thickness if known. If you are deciding between a few options, include notes so the review can account for the room and use case.",
    group: "Sizing"
  },
  {
    question: "Are special requests possible?",
    answer:
      "Yes. The launch surface is intentionally focused, but custom requests, finish questions, and unusual use cases can still be noted in the inquiry flow for review.",
    group: "Ordering"
  },
  {
    question: "Is installation included?",
    answer:
      "Phase 1 centers on the product and quote-start flow. Use the notes field to explain installation questions, mounting conditions, or whether the shelf is for a client-facing project that needs closer review.",
    group: "Installation"
  }
];

export const faqPageContent = {
  title: "Questions that usually come up before a custom shelf order starts.",
  body:
    "The launch collection is intentionally focused, so the FAQ is designed to answer the practical questions that matter most before a made-to-order request is submitted."
} as const;
