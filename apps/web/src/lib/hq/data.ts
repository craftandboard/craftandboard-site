/**
 * ===========================================================================
 * THIS FILE IS THE SEAM. READ THIS BEFORE CHANGING ANYTHING IN (hq).
 * ===========================================================================
 *
 * Today:  every accessor below returns fixtures and static content from
 *         `src/content/hq/*`. There is no database call anywhere in `apps/web`,
 *         and there is no HQ writer anywhere in the product — answers arrive by
 *         text or in person and get transcribed into the content files by hand.
 *         Real document editing lives in Google Docs by design. HQ is the read
 *         view.
 *
 * Later:  these same accessors will call `GET /hq/*` on `apps/api` through
 *         `lib/api.ts`, backed by the `HqDecision`, `HqPartnerResponse`, and
 *         `HqDocument` models already in `prisma/schema.prisma`, scoped by
 *         `organizationId` like every other tenant query in the app.
 *
 * The rules that keep this seam from rotting:
 *
 *   1. NO PAGE, LAYOUT, OR COMPONENT MAY IMPORT `src/content/hq/*` DIRECTLY.
 *      Everything goes through this file. If a page imports a content file,
 *      the swap to `fetch` stops being a one-file change.
 *
 *   2. Every accessor is `async` and returns the exact shape the future API
 *      response will have — `{ ok: true, … }` envelopes and ISO date strings,
 *      not `Date` objects. They are async today purely so that swapping a
 *      fixture for a `fetch` is a body change, never a signature change.
 *
 *   3. Every record-returning accessor takes the caller's `organizationId`.
 *      It is unused while these are fixtures, and it is the whole point the
 *      moment they are not. Do not remove the parameter to quiet a linter.
 *
 *   4. Shapes here must stay aligned with `prisma/schema.prisma`. If a model
 *      changes, `lib/hq/types.ts` changes with it.
 * ===========================================================================
 */

import { hqDecisionRecords, hqDecisionsIntro } from "../../content/hq/decisions";
import { hqDocumentRecords } from "../../content/hq/document-links";
import { hqDocumentsIntro, hqExpectedDocuments } from "../../content/hq/documents";
import { hqNumbersGroups, hqNumbersIntro } from "../../content/hq/numbers";
import { hqOpportunity } from "../../content/hq/opportunity";
import { hqPartnerResponseRecords } from "../../content/hq/partner-responses";
import {
  hqOwnershipOptions,
  hqPartnerQuestions,
  hqPartners,
  hqRoleRows,
  hqRolesIntro
} from "../../content/hq/roles";
import { hqVision } from "../../content/hq/vision";
import { HQ_SECTIONS } from "./nav";
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
// Future: `readJson<HqDecisionsResponse>("/hq/decisions")` etc.

export async function getHqDecisions(organizationId: string): Promise<HqDecisionsResponse> {
  void organizationId;

  return {
    ok: true,
    decisions: [...hqDecisionRecords].sort((left, right) =>
      right.decidedAt.localeCompare(left.decidedAt)
    )
  };
}

export async function getHqPartnerResponses(
  organizationId: string
): Promise<HqPartnerResponsesResponse> {
  void organizationId;

  return {
    ok: true,
    responses: [...hqPartnerResponseRecords].sort(
      (left, right) =>
        left.question - right.question || left.personName.localeCompare(right.personName)
    )
  };
}

export async function getHqDocuments(organizationId: string): Promise<HqDocumentsResponse> {
  void organizationId;

  return {
    ok: true,
    documents: [...hqDocumentRecords].sort(
      (left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title)
    )
  };
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

  const answerTarget = hqPartners.length * hqPartnerQuestions.length;
  const answered = responses.responses.filter((response) => response.body.trim().length > 0).length;
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
