import type {
  HqOwnershipOption,
  HqPartner,
  HqPartnerQuestion,
  HqRoleRow,
  HqStaticSection
} from "../../lib/hq/types";

/**
 * Static repo content. Pages must not import this directly — read it through
 * `lib/hq/data.ts`.
 *
 * The partner answers themselves are NOT here. They are records
 * (`HqPartnerResponse`) served through the seam — see
 * `content/hq/partner-responses.ts` for the transcription fixture.
 */
export const hqRolesIntro: HqStaticSection = {
  title: "Roles",
  intent:
    "The four questions, each partner's answer, the working split, and the ownership options still open.",
  status: "IN_PROGRESS",
  blocks: [
    {
      heading: "How this page works",
      body:
        "Answers come back by text or in person and get transcribed here. Nobody edits this page directly, and nothing below is agreed until it moves to the decision log.",
      points: [
        "Answer first, then argue — the four questions get answered before roles are fixed",
        "A role in the table is a proposal until it appears on /hq/decisions",
        "Ownership stays open until all three sets of answers are in"
      ]
    }
  ]
};

/** `number` matches `HqPartnerResponse.question`. */
export const hqPartnerQuestions: HqPartnerQuestion[] = [
  {
    number: 1,
    prompt: "What do you bring?",
    intent: "Capital, skills, time, equipment, relationships — what you are actually putting in."
  },
  {
    number: 2,
    prompt: "What role do you want?",
    intent: "The job you want to own and be accountable for."
  },
  {
    number: 3,
    prompt: "What do you not want to do?",
    intent: "The work you do not want, so it lands with someone who does."
  },
  {
    number: 4,
    prompt: "How much time can you give?",
    intent: "Realistic hours per week, and when that changes."
  }
];

/** `name` matches `HqPartnerResponse.personName`. */
export const hqPartners: HqPartner[] = [
  {
    name: "Brandon",
    focus: "Product, systems, marketing and SEO",
    availability: "TODO — confirm weekly hours"
  },
  {
    name: "Tyler",
    focus: "Day-to-day operations",
    availability: "TODO — confirm weekly hours"
  },
  {
    name: "Tim",
    focus: "Capital",
    availability: "Deployed overseas through year end"
  }
];

export const hqRoleRows: HqRoleRow[] = [
  {
    area: "Product and listings",
    owner: "Brandon",
    support: "—",
    notes: "Product definition, listing content, pricing inputs"
  },
  {
    area: "Marketing and SEO",
    owner: "Brandon",
    support: "—",
    notes: "Organic search, storefront content, keyword and backlink work"
  },
  {
    area: "Software and systems",
    owner: "Brandon",
    support: "—",
    notes: "Costing, order flow, manufacturing tooling"
  },
  {
    area: "Shop floor operations",
    owner: "Tyler",
    support: "Brandon",
    notes: "Cutting, edge banding, assembly, quality"
  },
  {
    area: "Fulfillment and shipping",
    owner: "Tyler",
    support: "—",
    notes: "Packing standard, carrier handoff, damage rate"
  },
  {
    area: "Purchasing and materials",
    owner: "TODO — unassigned",
    support: "—",
    notes: "Sheet stock, edge banding, packaging supply"
  },
  {
    area: "Capital and financing",
    owner: "Tim",
    support: "—",
    notes: "Funding the equipment and working capital"
  },
  {
    area: "Books and admin",
    owner: "TODO — unassigned",
    support: "—",
    notes: "Bookkeeping, entity filings, insurance"
  },
  {
    area: "Customer service",
    owner: "TODO — unassigned",
    support: "—",
    notes: "Amazon messages, sizing questions, returns"
  }
];

export const hqOwnershipOptions: HqOwnershipOption[] = [
  {
    label: "Equal thirds",
    structure: "Three equal partners regardless of contribution type.",
    tradeoff:
      "Simplest to agree and to explain. Ignores that capital, time, and existing systems are not the same input.",
    split: null
  },
  {
    label: "Capital-weighted",
    structure: "Ownership tracks money in, with sweat equity earned over time.",
    tradeoff:
      "Fair to the funding partner up front. Can leave the operators under-owned while doing the daily work.",
    split: null
  },
  {
    label: "Role-weighted with vesting",
    structure: "Ownership tied to the role each partner commits to, vesting over a set term.",
    tradeoff:
      "Protects against a partner stepping back early. Needs a written schedule and a departure clause.",
    split: null
  },
  {
    label: "Capital repaid first, then split",
    structure: "Tim's contribution is repaid from profit before ongoing distributions begin.",
    tradeoff:
      "Lowers the funding partner's risk without permanently reducing operator ownership. Delays distributions.",
    split: null
  }
];
