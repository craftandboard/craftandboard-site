/**
 * ===========================================================================
 * THIS FILE IS THE SEAM. READ THIS BEFORE CHANGING ANYTHING IN (hq).
 * ===========================================================================
 *
 * Record-backed data (decisions, partner answers, documents) now comes from
 * `GET /hq/*` on apps/api, backed by the `Hq*` models in
 * `prisma/schema.prisma` and scoped by `organizationId` like every other
 * tenant query. Vision, opportunity, numbers, and the roles scaffolding stay
 * static content in `src/content/hq/*` — no CMS, by design.
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
 * ===========================================================================
 */

import { hqDecisionsIntro } from "../../content/hq/decisions";
import { hqDocumentsIntro, hqExpectedDocuments } from "../../content/hq/documents";
import { hqNumbersGroups, hqNumbersIntro } from "../../content/hq/numbers";
import { hqOpportunity } from "../../content/hq/opportunity";
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

/** Matches HqPartnerResponse.question and the API. */
export const HQ_QUESTION_NUMBERS = [1, 2, 3, 4];
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

  const answerTarget = responses.totals.target || hqPartners.length * hqPartnerQuestions.length;
  const answered = responses.totals.answered;
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
      status: answered === 0 ? "NOT_STARTED" : answered < answerTarget ? "IN_PROGRESS" : "READY_FOR_REVIEW",
      detail: `${answered} of ${answerTarget} partner answers in`
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
