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

/**
 * One visible answer. Only ever present for a question the viewer has
 * unlocked by answering it themselves.
 */
export interface HqAnswerRecord {
  id: string;
  personName: string;
  body: string;
  isOwn: boolean;
  submittedAt: string | null;
  updatedAt: string;
}

/**
 * A partner who has answered a question the viewer has NOT answered.
 * Deliberately carries no `body` — the API never sends one.
 */
export interface HqLockedPartner {
  personName: string;
  hasAnswered: true;
}

export interface HqQuestionView {
  question: number;
  unlocked: boolean;
  responses: HqAnswerRecord[];
  locked: HqLockedPartner[];
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
  viewer: { personName: string | null };
  questions: HqQuestionView[];
  totals: { answered: number; target: number };
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
  /** Null until we agree who owns it — renders as "unassigned", never hidden. */
  owner: string | null;
  consulted: string | null;
}

export interface HqOwnershipOption {
  label: string;
  /** Null where the option does not define it on its own. */
  timStake: string | null;
  capitalReturn: string;
  fitsWhen: string;
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
