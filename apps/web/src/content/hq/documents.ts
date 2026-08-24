import type { HqExpectedDocument, HqStaticSection } from "../../lib/hq/types";

/**
 * Static repo content. Pages must not import this directly — read it through
 * `lib/hq/data.ts`.
 *
 * The linked documents themselves are records (`HqDocument`) served through
 * the seam — see `content/hq/document-links.ts`. This file is only the
 * checklist of what should exist, so a missing agreement is visible before
 * anyone has created the Google Doc.
 */
export const hqDocumentsIntro: HqStaticSection = {
  title: "Documents",
  intent: "The paperwork this partnership needs, and where each piece currently lives.",
  status: "NOT_STARTED",
  blocks: [
    {
      heading: "Google Docs is the editor",
      body:
        "HQ links out and tracks status. It deliberately does not edit documents, hold comments, or keep versions — Google Docs already does all three better.",
      points: [
        "Draft and comment in Google Docs",
        "Link it here once it exists so everyone has one place to look",
        "Status here reflects the document, not the negotiation"
      ]
    }
  ]
};

export const hqExpectedDocuments: HqExpectedDocument[] = [
  {
    title: "Partnership agreement",
    purpose: "Ownership split, capital contributions, decision rights, exit and departure terms.",
    owner: "All three"
  },
  {
    title: "Operating agreement",
    purpose: "How the entity is actually governed day to day once formed.",
    owner: "All three"
  },
  {
    title: "Capital contribution terms",
    purpose: "What Tim is contributing, on what schedule, and how it is treated.",
    owner: "Tim and Brandon"
  },
  {
    title: "Role and responsibility summary",
    purpose: "The agreed version of the roles table, written in plain language.",
    owner: "Brandon"
  },
  {
    title: "Financial model",
    purpose: "The working spreadsheet behind the numbers page.",
    owner: "Brandon"
  },
  {
    title: "Equipment list and quotes",
    purpose: "Real vendor quotes backing the equipment figures.",
    owner: "Tyler"
  }
];
