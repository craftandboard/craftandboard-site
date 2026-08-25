import type { HqPartnerQuestion, HqStaticSection } from "../../lib/hq/types";

/**
 * Static repo content. Pages must not import this directly — read it through
 * `lib/hq/data.ts`.
 *
 * The partner answers themselves are NOT here. They are records
 * (`HqPartnerResponse`) served through the seam, same as `content/hq/roles.ts`.
 * FieldMetriq is a separate, unrelated product and is deliberately excluded
 * from every question below — do not add it back in.
 *
 * Question numbers 101-112 are reserved for this section (see
 * `apps/api/src/modules/hq/partners.ts`) so they never collide with roles'
 * 1-4. To add a 13th question: append an entry here with number 113, and
 * bump the upper bound in `partnership-agreement/actions.ts` to match.
 */

export const hqPartnershipAgreementIntro: HqStaticSection = {
  title: "Partnership Agreement",
  intent:
    "Twelve questions the partnership agreement needs answers to, ordered easiest to hardest — start with what you can just describe, work up to the ones that take real thought. Once we're roughly lined up on a question, it goes to the attorney to write into the real document. This is a discussion starter, not legal advice.",
  status: "IN_PROGRESS",
  blocks: []
};

/** `number` matches `HqPartnerResponse.question`. Reserved range: 101-112. */
export const hqPartnershipAgreementQuestions: HqPartnerQuestion[] = [
  {
    number: 101,
    prompt: "Who runs what day to day, and which calls need everyone's sign-off?",
    intent: "Avoids three people all thinking they have the final word on the same decision."
  },
  {
    number: 102,
    prompt: "What's each partner actually expected to show up and do — and what if that changes?",
    intent: "Protects against one partner carrying the shop while another's part-time."
  },
  {
    number: 103,
    prompt: "What's each of us putting in — cash, equipment, workspace — and on what schedule?",
    intent:
      "What Tim, Brandon, and Tyler each bring in, and whether it's treated as a loan or as equity."
  },
  {
    number: 104,
    prompt: "How do we update this agreement once it's signed?",
    intent: "Locks in whether future changes need everyone's sign-off or just a majority."
  },
  {
    number: 105,
    prompt: "Who's on the hook for business debt, and how is it split?",
    intent: "Matters most exactly when the business can least afford to sort it out."
  },
  {
    number: 106,
    prompt: "How do we add a partner or investor later without blowing up the current split?",
    intent: "Decide the process now, while nobody's actually asking for anything yet."
  },
  {
    number: 107,
    prompt: "If someone leaves, can they open a competing shop or take our customers and crew?",
    intent: "Standard to address, easy to forget about until the day it happens."
  },
  {
    number: 108,
    prompt: "If this partnership ends, who keeps the Craft & Board name and the designs?",
    intent: "The brand and the design work are worth real money — say who owns them, in writing."
  },
  {
    number: 109,
    prompt: "When the three of us don't agree, what actually happens?",
    intent: "A real process beats hoping it never comes up."
  },
  {
    number: 110,
    prompt: "How do profits get split, and is there a salary or draw separate from ownership?",
    intent: "Being an owner and getting paid for work done aren't automatically the same thing."
  },
  {
    number: 111,
    prompt:
      "If someone leaves, gets pushed out, or can't work anymore — how do we value and buy out their share, and should a buyout option always be available if everyone agrees to use it?",
    intent:
      "The single most common reason partnerships end in a lawsuit — including whether a buyout option exists at all, or only case by case."
  },
  {
    number: 112,
    prompt: "What's each person's ownership percentage, and why?",
    intent:
      "Sets who owns what — saved for last since it's easiest to talk about once everything else is already on the table."
  }
];
