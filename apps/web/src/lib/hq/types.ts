/**
 * Craft & Board HQ types.
 *
 * The record and response shapes below mirror what `apps/api` will return
 * from `GET /hq/*` once the HQ router exists. They are the contract the
 * seam in `./data.ts` promises to every page, so they must stay aligned
 * with the `Hq*` models in `prisma/schema.prisma`.
 */

export interface HqViewer {
  email: string;
  name: string | null;
  organizationId: string;
  organizationSlug: string;
}

export type HqSectionKey =
  | "vision"
  | "opportunity"
  | "roles"
  | "numbers"
  | "documents"
  | "decisions";

export type HqSectionStatus =
  | "NOT_STARTED"
  | "DRAFT"
  | "IN_PROGRESS"
  | "READY_FOR_REVIEW"
  | "AGREED";

export type HqDocumentStatus = "DRAFT" | "IN_REVIEW" | "NEEDS_SIGNATURE" | "SIGNED";

/** Mirrors the `HqDecision` model. Dates are ISO strings over the wire. */
export interface HqDecisionRecord {
  id: string;
  title: string;
  body: string;
  decidedAt: string;
  agreedBy: string[];
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors the `HqPartnerResponse` model. */
export interface HqPartnerResponseRecord {
  id: string;
  personName: string;
  question: number;
  body: string;
  submittedAt: string | null;
  updatedAt: string;
}

/** Mirrors the `HqDocument` model. */
export interface HqDocumentRecord {
  id: string;
  title: string;
  url: string;
  status: HqDocumentStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface HqDecisionsResponse {
  ok: true;
  decisions: HqDecisionRecord[];
}

export interface HqPartnerResponsesResponse {
  ok: true;
  responses: HqPartnerResponseRecord[];
}

export interface HqDocumentsResponse {
  ok: true;
  documents: HqDocumentRecord[];
}

export interface HqSectionSummary {
  key: HqSectionKey;
  label: string;
  href: string;
  summary: string;
  status: HqSectionStatus;
  detail: string;
}

export interface HqOverviewResponse {
  ok: true;
  sections: HqSectionSummary[];
}

export interface HqPartnerQuestion {
  /** Matches `HqPartnerResponse.question`. */
  number: number;
  prompt: string;
  intent: string;
}

export interface HqPartner {
  name: string;
  focus: string;
  availability: string;
}

export interface HqRoleRow {
  area: string;
  owner: string;
  support: string;
  notes: string;
}

export interface HqOwnershipOption {
  label: string;
  structure: string;
  tradeoff: string;
  /** Left null until the partners agree on a split. */
  split: string | null;
}

export interface HqNumbersLine {
  label: string;
  /** Null until a real figure is confirmed. Nothing here is estimated for you. */
  amountUsd: number | null;
  note: string;
}

export interface HqNumbersGroup {
  title: string;
  intent: string;
  lines: HqNumbersLine[];
}

export interface HqContentBlock {
  heading: string;
  body: string;
  points: string[];
}

export interface HqStaticSection {
  title: string;
  intent: string;
  status: HqSectionStatus;
  blocks: HqContentBlock[];
}

export interface HqExpectedDocument {
  title: string;
  purpose: string;
  owner: string;
}
