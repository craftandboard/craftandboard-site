import { prisma } from "../../lib/prisma.js";
import { HQ_QUESTION_NUMBERS, HQ_ROSTER } from "./partners.js";

export class HqAccessError extends Error {
  constructor(message = "Not found.") {
    super(message);
    this.name = "HqAccessError";
  }
}

export class HqNotFoundError extends Error {
  constructor(message = "Not found.") {
    super(message);
    this.name = "HqNotFoundError";
  }
}

export class HqConflictError extends Error {
  constructor(message = "An answer already exists for that question.") {
    super(message);
    this.name = "HqConflictError";
  }
}

function iso(value: Date | null) {
  return value ? value.toISOString() : null;
}

export async function listHqDecisions(organizationId: string) {
  const decisions = await prisma.hqDecision.findMany({
    where: { organizationId },
    orderBy: [{ decidedAt: "desc" }, { createdAt: "desc" }]
  });

  return {
    ok: true as const,
    decisions: decisions.map((decision) => ({
      id: decision.id,
      title: decision.title,
      body: decision.body,
      decidedAt: decision.decidedAt.toISOString(),
      agreedBy: decision.agreedBy,
      createdByUserId: decision.createdByUserId,
      createdAt: decision.createdAt.toISOString(),
      updatedAt: decision.updatedAt.toISOString()
    }))
  };
}

export async function listHqDocuments(organizationId: string) {
  const documents = await prisma.hqDocument.findMany({
    where: { organizationId },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }]
  });

  return {
    ok: true as const,
    documents: documents.map((document) => ({
      id: document.id,
      title: document.title,
      url: document.url,
      status: document.status,
      sortOrder: document.sortOrder,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString()
    }))
  };
}

/**
 * BLIND-THEN-REVEAL, ENFORCED HERE.
 *
 * A question is unlocked for the viewer only when the viewer has a non-empty
 * answer to that same question. For a locked question this function returns
 * the other partners' NAMES ONLY — the `body` key is never placed on the
 * object at all, so it cannot leak into a response, a cache, or an HTML
 * payload. Do not "filter it in the route" instead; that is how leaks happen.
 *
 * Locking is per question, immediate, and individual. There is no reveal-all
 * trigger and no waiting for all three partners.
 */
export async function getHqPartnerResponseView(input: {
  organizationId: string;
  viewerPersonName: string | null;
}) {
  const all = await prisma.hqPartnerResponse.findMany({
    where: { organizationId: input.organizationId },
    orderBy: [{ question: "asc" }, { personName: "asc" }]
  });

  const answered = all.filter((response) => response.body.trim().length > 0);

  const questions = HQ_QUESTION_NUMBERS.map((question) => {
    const forQuestion = answered.filter((response) => response.question === question);
    const own = input.viewerPersonName
      ? forQuestion.find((response) => response.personName === input.viewerPersonName) ?? null
      : null;
    const unlocked = Boolean(own);

    if (unlocked) {
      return {
        question,
        unlocked: true as const,
        responses: forQuestion.map((response) => ({
          id: response.id,
          personName: response.personName,
          body: response.body,
          isOwn: response.personName === input.viewerPersonName,
          submittedAt: iso(response.submittedAt),
          updatedAt: response.updatedAt.toISOString()
        })),
        locked: [] as Array<{ personName: string; hasAnswered: true }>
      };
    }

    return {
      question,
      unlocked: false as const,
      responses: [] as Array<{
        id: string;
        personName: string;
        body: string;
        isOwn: boolean;
        submittedAt: string | null;
        updatedAt: string;
      }>,
      // Names only. No body, ever.
      locked: forQuestion.map((response) => ({
        personName: response.personName,
        hasAnswered: true as const
      }))
    };
  });

  return {
    ok: true as const,
    viewer: { personName: input.viewerPersonName },
    questions,
    totals: {
      answered: answered.length,
      target: HQ_ROSTER.length * HQ_QUESTION_NUMBERS.length
    }
  };
}

/** Create the viewer's own answer. Writes a revision with previousBody "". */
export async function createHqPartnerResponse(input: {
  organizationId: string;
  personName: string;
  question: number;
  body: string;
  userId: string;
  email: string;
}) {
  const existing = await prisma.hqPartnerResponse.findUnique({
    where: {
      organizationId_personName_question: {
        organizationId: input.organizationId,
        personName: input.personName,
        question: input.question
      }
    }
  });

  if (existing) {
    throw new HqConflictError();
  }

  const now = new Date();

  const created = await prisma.$transaction(async (tx) => {
    const response = await tx.hqPartnerResponse.create({
      data: {
        organizationId: input.organizationId,
        personName: input.personName,
        question: input.question,
        body: input.body,
        submittedAt: now
      }
    });

    await tx.hqPartnerResponseRevision.create({
      data: {
        organizationId: input.organizationId,
        responseId: response.id,
        personName: input.personName,
        question: input.question,
        previousBody: "",
        newBody: input.body,
        changedByUserId: input.userId,
        changedByEmail: input.email
      }
    });

    return response;
  });

  return {
    ok: true as const,
    response: {
      id: created.id,
      personName: created.personName,
      question: created.question,
      body: created.body,
      submittedAt: iso(created.submittedAt),
      updatedAt: created.updatedAt.toISOString()
    }
  };
}

/**
 * Edit an existing answer. Author-only: a response belonging to someone else
 * is reported as not found rather than forbidden, so the endpoint does not
 * confirm what other partners have written.
 *
 * Editing never re-locks anything — `unlocked` is derived from having a
 * non-empty answer, and empty bodies are rejected at the route.
 */
export async function updateHqPartnerResponse(input: {
  organizationId: string;
  responseId: string;
  personName: string;
  body: string;
  userId: string;
  email: string;
}) {
  const existing = await prisma.hqPartnerResponse.findFirst({
    where: {
      id: input.responseId,
      organizationId: input.organizationId
    }
  });

  if (!existing || existing.personName !== input.personName) {
    throw new HqNotFoundError();
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.hqPartnerResponseRevision.create({
      data: {
        organizationId: input.organizationId,
        responseId: existing.id,
        personName: existing.personName,
        question: existing.question,
        previousBody: existing.body,
        newBody: input.body,
        changedByUserId: input.userId,
        changedByEmail: input.email
      }
    });

    return tx.hqPartnerResponse.update({
      where: { id: existing.id },
      data: { body: input.body }
    });
  });

  return {
    ok: true as const,
    response: {
      id: updated.id,
      personName: updated.personName,
      question: updated.question,
      body: updated.body,
      submittedAt: iso(updated.submittedAt),
      updatedAt: updated.updatedAt.toISOString()
    }
  };
}
