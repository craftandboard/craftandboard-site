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

/**
 * The roles page is question-first and phone-first, so it renders no intro
 * blocks — `blocks` is intentionally empty. Everything a reader needs is in
 * `intent`, which is one line.
 */
export const hqRolesIntro: HqStaticSection = {
  title: "Roles",
  intent:
    "Same four questions, all three answers together. Nothing here is agreed until it reaches the decision log.",
  status: "IN_PROGRESS",
  blocks: []
};

/** `number` matches `HqPartnerResponse.question`. */
export const hqPartnerQuestions: HqPartnerQuestion[] = [
  {
    number: 1,
    prompt: "What you bring",
    intent: "Capital, skills, time, equipment, relationships."
  },
  {
    number: 2,
    prompt: "What role you want",
    intent: "The job you want to own and be accountable for."
  },
  {
    number: 3,
    prompt: "What you don't want to do",
    intent: "The work you do not want, so it lands with someone who does."
  },
  {
    number: 4,
    prompt: "How much time you can give",
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

/**
 * One card per function area. Owner and consulted stay null until the three of
 * us actually agree — the page shows "unassigned" rather than dropping the row,
 * so an unowned function stays visible instead of quietly disappearing.
 */
export const hqRoleRows: HqRoleRow[] = [
  { area: "Sales", owner: null, consulted: null },
  { area: "Production", owner: null, consulted: null },
  { area: "Estimating", owner: null, consulted: null },
  { area: "Purchasing", owner: null, consulted: null },
  { area: "Bookkeeping", owner: null, consulted: null },
  { area: "Hiring", owner: null, consulted: null },
  { area: "Marketing", owner: null, consulted: null },
  { area: "Equipment", owner: null, consulted: null }
];

export const hqOwnershipOptions: HqOwnershipOption[] = [
  {
    label: "Equal thirds",
    timStake: "One third",
    capitalReturn:
      "No separate repayment. Capital is treated as contribution and comes back through distributions only.",
    fitsWhen: "Fits if all three of us are putting in comparable value and want the simplest agreement."
  },
  {
    label: "Capital-weighted",
    timStake: null,
    capitalReturn: "Ownership is sized to capital in, so returns flow with the ownership split.",
    fitsWhen: "Fits if Tim's money is the scarce input and the shop is not yet proven."
  },
  {
    label: "Role-weighted with vesting",
    timStake: null,
    capitalReturn:
      "Capital is handled separately from role equity and needs its own repayment term.",
    fitsWhen: "Fits if we are worried about someone stepping back after equity is issued."
  },
  {
    label: "Capital repaid first, then split",
    timStake: "One third after repayment",
    capitalReturn: "Tim's contribution is repaid from profit before any distributions start.",
    fitsWhen: "Fits if Tim wants his money back before upside and we want operators fully owned."
  }
];
