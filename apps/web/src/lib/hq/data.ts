/**
 * ===========================================================================
 * THIS FILE IS THE SEAM. READ THIS BEFORE CHANGING ANYTHING IN (hq).
 * ===========================================================================
 *
 * Record-backed data (decisions, partner answers, documents) now comes from
 * `GET /hq/*` on apps/api, backed by the `Hq*` models in
 * `prisma/schema.prisma` and scoped by `organizationId` like every other
 * tenant query. Vision, opportunity, numbers, and the roles/partnership
 * scaffolding stay static content in `src/content/hq/*` — no CMS, by design.
 *
 * BLIND-THEN-REVEAL IS ENFORCED BY THE API, NOT HERE.
 * For a question the viewer has not answered, the payload carries the other
 * partners' names only — no `body` key exists on those objects. Never
 * reintroduce a client-side filter that assumes bodies are present but
 * hidden; that is how the guarantee gets quietly broken.
 *
 * The rules that keep this seam from rotting:
 *
 *   1. NO PAGE, LAYOUT, OR COMPONENT MAY IMPORT `src/content/hq/*` DIRECTLY,
 *      AND NONE MAY CALL `lib/api.ts` FOR HQ DATA. Everything goes through
 *      this file, so the wiring stays in one place.
 *
 *   2. Every accessor is `async` and returns the exact API response shape —
 *      `{ ok: true, ... }` envelopes and ISO date strings, not `Date`s.
 *
 *   3. Every record-returning accessor takes the caller's `organizationId`.
 *      The API derives the real tenant from the session, so this parameter is
 *      the caller asserting which tenant it believes it is rendering. Keep it.
 *
 *   4. Shapes here must stay aligned with `prisma/schema.prisma` and
 *      `apps/api/src/modules/hq/service.ts`. If a model changes, so does
 *      `lib/hq/types.ts`.
 *
 *   5. `GET /hq/partner-responses` returns ALL sections' questions in one
 *      flat list (see `HQ_QUESTION_NUMBERS` below). A page must filter
 *      `questions` down to its own section's numbers before rendering a
 *      count — never trust the API's `totals` for a single section, since
 *      that field is a whole-org total across every section. Use
 *      `scopeHqAnswerStats` for this.
 * ===========================================================================
 */

import { hqDecisionsIntro } from "../../content/hq/decisions";
import { hqDocumentsIntro, hqExpectedDocuments } from "../../content/hq/documents";
import { hqNumbersGroups, hqNumbersIntro } from "../../content/hq/numbers";
import { hqOpportunity } from "../../content/hq/opportunity";
import {
  hqPartnershipAgreementIntro,
  hqPartnershipAgreementQuestions
} from "../../content/hq/partnership-agreement";
import {
  hqOwnershipOptions,
  hqPartnerQuestions,
  hqPartners,
  hqRoleRows,
  hqRolesIntro
} from "../../content/hq/roles";
import { hqVision } from "../../content/hq/vision";
import {
  createHqPartnerResponse,
  getHqDecisionsFromApi,
  getHqDocumentsFromApi,
  getHqPartnerResponsesFromApi,
  updateHqPartnerResponse
} from "../api";
import { HQ_SECTIONS } from "./nav";

/**
 * Every question number in use across every section, derived from each
 * section's own content file. Matches HqPartnerResponse.question and the
 * API's HQ_QUESTION_NUMBERS (apps/api/src/modules/hq/partners.ts) — adding a
 * question to a content file's array keeps this list correct automatically.
 * This is only a client-side fallback for when the API is unreachable; the
 * API's own list is what actually governs which numbers are accepted.
 */
export const HQ_QUESTION_NUMBERS = [...hqPartnerQuestions, ...hqPartnershipAgreementQuestions].map(
  (question) => question.number
);

import type {
  HqDecisionsResponse,
  HqDocumentsResponse,
  HqExpectedDocument,
  HqNumbersGroup,
  HqOverviewResponse,
  HqOwnershipOption,
  HqPartner,
  HqPartnerQuestion,
  HqPartnerResponsesResponse,
  HqQuestionView,
  HqRoleRow,
  HqSectionStatus,
  HqSectionSummary,
  HqStaticSection
} from "./types";

// --- Record accessors -------------------------------------------------------
// These call apps/api. A null result means the API was unreachable or refused
// the caller; every accessor degrades to empty rather than throwing, so a
// page renders its empty state instead of a 500.

export async function getHqDecisions(organizationId: string): Promise<HqDecisionsResponse> {
  void organizationId;
  const response = await getHqDecisionsFromApi();

  return { ok: true, decisions: response?.decisions ?? [] };
}

export async function getHqPartnerResponses(
  organizationId: string
): Promise<HqPartnerResponsesResponse> {
  void organizationId;
  const response = await getHqPartnerResponsesFromApi();

  if (!response) {
    return {
      ok: true,
      viewer: { personName: null },
      questions: HQ_QUESTION_NUMBERS.map((question) => ({
        question,
        unlocked: false,
        responses: [],
        locked: []
      })),
      totals: { answered: 0, target: 0 }
    };
  }

  return {
    ok: true,
    viewer: response.viewer,
    questions: response.questions,
    totals: response.totals
  };
}

export async function getHqDocuments(organizationId: string): Promise<HqDocumentsResponse> {
  void organizationId;
  const response = await getHqDocumentsFromApi();

  return { ok: true, documents: response?.documents ?? [] };
}

/**
 * Scopes a partner-responses view down to one section's own question numbers
 * and returns that section's own answered/target counts. Use this instead of
 * the API's whole-org `totals` any time a page or the overview needs a count
 * for a single section — see rule 5 in the file header.
 */
export function scopeHqAnswerStats(
  questions: HqQuestionView[],
  questionNumbers: number[],
  partnerCount: number
): { answered: number; target: number } {
  const numbers = new Set(questionNumbers);
  const scoped = questions.filter((entry) => numbers.has(entry.question));
  const answered = scoped.reduce(
    (sum, entry) => sum + (entry.unlocked ? entry.responses.length : entry.locked.length),
    0
  );

  return { answered, target: partnerCount * questionNumbers.length };
}

// --- Writes -----------------------------------------------------------------
// The author is derived from the session by the API. Nothing here sends a
// personName, and nothing here may be trusted to enforce authorship.

export type HqSaveResult = { ok: true } | { ok: false; error: string };

export async function saveHqPartnerAnswer(input: {
  responseId: string | null;
  question: number;
  body: string;
}): Promise<HqSaveResult> {
  const body = input.body.trim();

  if (!body) {
    return { ok: false, error: "An answer cannot be empty." };
  }

  try {
    if (input.responseId) {
      await updateHqPartnerResponse({ id: input.responseId, body });
    } else {
      await createHqPartnerResponse({ question: input.question, body });
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not save that answer."
    };
  }
}

// --- Static content accessors ----------------------------------------------
// Vision, opportunity, and numbers are static content in the repo, no CMS.

export async function getHqVision(): Promise<HqStaticSection> {
  return hqVision;
}

export async function getHqOpportunity(): Promise<HqStaticSection> {
  return hqOpportunity;
}

export async function getHqNumbers(): Promise<{
  intro: HqStaticSection;
  groups: HqNumbersGroup[];
}> {
  return { intro: hqNumbersIntro, groups: hqNumbersGroups };
}

export async function getHqRolesContent(): Promise<{
  intro: HqStaticSection;
  questions: HqPartnerQuestion[];
  partners: HqPartner[];
  roleRows: HqRoleRow[];
  ownershipOptions: HqOwnershipOption[];
}> {
  return {
    intro: hqRolesIntro,
    questions: hqPartnerQuestions,
    partners: hqPartners,
    roleRows: hqRoleRows,
    ownershipOptions: hqOwnershipOptions
  };
}

export async function getHqPartnershipAgreementContent(): Promise<{
  intro: HqStaticSection;
  questions: HqPartnerQuestion[];
  partners: HqPartner[];
}> {
  return {
    intro: hqPartnershipAgreementIntro,
    questions: hqPartnershipAgreementQuestions,
    partners: hqPartners
  };
}

export async function getHqDocumentsContent(): Promise<{
  intro: HqStaticSection;
  expected: HqExpectedDocument[];
}> {
  return { intro: hqDocumentsIntro, expected: hqExpectedDocuments };
}

export async function getHqDecisionsContent(): Promise<HqStaticSection> {
  return hqDecisionsIntro;
}

// --- Overview ---------------------------------------------------------------

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Landing-page status for each section. Static sections report the status
 * declared in their content file; record-backed sections derive it from the
 * data, so the landing page cannot claim progress that does not exist.
 */
export async function getHqOverview(organizationId: string): Promise<HqOverviewResponse> {
  const [decisions, responses, documents] = await Promise.all([
    getHqDecisions(organizationId),
    getHqPartnerResponses(organizationId),
    getHqDocuments(organizationId)
  ]);

  const rolesStats = scopeHqAnswerStats(
    responses.questions,
    hqPartnerQuestions.map((question) => question.number),
    hqPartners.length
  );
  const partnershipStats = scopeHqAnswerStats(
    responses.questions,
    hqPartnershipAgreementQuestions.map((question) => question.number),
    hqPartners.length
  );
  const signed = documents.documents.filter((document) => document.status === "SIGNED").length;

  const derived: Record<string, { status: HqSectionStatus; detail: string }> = {
    vision: { status: hqVision.status, detail: `${hqVision.blocks.length} sections drafted` },
    opportunity: {
      status: hqOpportunity.status,
      detail: `${hqOpportunity.blocks.length} sections drafted`
    },
    numbers: {
      status: hqNumbersIntro.status,
      detail: `${hqNumbersGroups.length} cost groups, no figures confirmed`
    },
    roles: {
      status:
        rolesStats.answered === 0
          ? "NOT_STARTED"
          : rolesStats.answered < rolesStats.target
            ? "IN_PROGRESS"
            : "READY_FOR_REVIEW",
      detail: `${rolesStats.answered} of ${rolesStats.target} partner answers in`
    },
    "partnership-agreement": {
      status:
        partnershipStats.answered === 0
          ? "NOT_STARTED"
          : partnershipStats.answered < partnershipStats.target
            ? "IN_PROGRESS"
            : "READY_FOR_REVIEW",
      detail: `${partnershipStats.answered} of ${partnershipStats.target} partner answers in`
    },
    documents: {
      status:
        documents.documents.length === 0
          ? "NOT_STARTED"
          : signed === documents.documents.length
            ? "AGREED"
            : "IN_PROGRESS",
      detail:
        documents.documents.length === 0
          ? `${pluralize(hqExpectedDocuments.length, "document", "documents")} expected, none linked yet`
          : `${pluralize(documents.documents.length, "document", "documents")} linked, ${signed} signed`
    },
    decisions: {
      status: decisions.decisions.length === 0 ? "NOT_STARTED" : "IN_PROGRESS",
      detail:
        decisions.decisions.length === 0
          ? "Nothing agreed yet"
          : `${pluralize(decisions.decisions.length, "decision", "decisions")} recorded`
    }
  };

  const sections: HqSectionSummary[] = HQ_SECTIONS.map((section) => ({
    ...section,
    status: derived[section.key]?.status ?? "NOT_STARTED",
    detail: derived[section.key]?.detail ?? ""
  }));

  return { ok: true, sections };
}
