import { Router } from "express";
import { z } from "zod";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import { requireHqRequester } from "../modules/hq/access.js";
import { HQ_QUESTION_NUMBERS } from "../modules/hq/partners.js";
import {
  createHqPartnerResponse,
  getHqPartnerResponseView,
  HqAccessError,
  HqConflictError,
  HqNotFoundError,
  listHqDecisions,
  listHqDocuments,
  updateHqPartnerResponse
} from "../modules/hq/service.js";

const router = Router();

/** Empty bodies are rejected so an answer cannot be cleared to stay unlocked. */
const answerBodySchema = z.string().trim().min(1).max(20000);

/**
 * Validated against the live HQ_QUESTION_NUMBERS list rather than a hardcoded
 * range, so adding a question number there is the only change a new section
 * needs to be accepted here too.
 */
const questionNumberSchema = z.number().int().refine(
  (value) => (HQ_QUESTION_NUMBERS as readonly number[]).includes(value),
  { message: "Not a recognized HQ question number." }
);

const createResponseSchema = z.object({
  question: questionNumberSchema,
  body: answerBodySchema
});

const updateResponseSchema = z.object({
  body: answerBodySchema
});

const responseIdParamsSchema = z.object({
  id: z.string().min(1)
});

function handleHqRouteError(error: unknown, res: Parameters<Parameters<Router["get"]>[1]>[1]) {
  // Not on HQ_ALLOWED_EMAILS, or someone else's record: 404, never 403.
  if (error instanceof HqAccessError || error instanceof HqNotFoundError) {
    res.status(404).json({ ok: false, error: "Not found." });
    return true;
  }
  if (error instanceof HqConflictError) {
    res.status(409).json({ ok: false, error: error.message });
    return true;
  }
  if (error instanceof RequestAuthenticationError) {
    res.status(401).json({ ok: false, error: error.message });
    return true;
  }
  if (error instanceof z.ZodError) {
    res.status(400).json({ ok: false, error: error.message });
    return true;
  }
  return false;
}

router.get("/decisions", async (req, res, next) => {
  try {
    const requester = await requireHqRequester(req);
    res.json(await listHqDecisions(requester.organizationId));
  } catch (error) {
    if (!handleHqRouteError(error, res)) {
      next(error);
    }
  }
});

router.get("/documents", async (req, res, next) => {
  try {
    const requester = await requireHqRequester(req);
    res.json(await listHqDocuments(requester.organizationId));
  } catch (error) {
    if (!handleHqRouteError(error, res)) {
      next(error);
    }
  }
});

router.get("/partner-responses", async (req, res, next) => {
  try {
    const requester = await requireHqRequester(req);

    res.json(
      await getHqPartnerResponseView({
        organizationId: requester.organizationId,
        viewerPersonName: requester.personName
      })
    );
  } catch (error) {
    if (!handleHqRouteError(error, res)) {
      next(error);
    }
  }
});

router.post("/partner-responses", async (req, res, next) => {
  try {
    const requester = await requireHqRequester(req);

    // personName comes from the session roster, never from the request body.
    if (!requester.personName) {
      throw new HqAccessError();
    }

    const body = createResponseSchema.parse(req.body);

    res.status(201).json(
      await createHqPartnerResponse({
        organizationId: requester.organizationId,
        personName: requester.personName,
        question: body.question,
        body: body.body,
        userId: requester.userId,
        email: requester.email
      })
    );
  } catch (error) {
    if (!handleHqRouteError(error, res)) {
      next(error);
    }
  }
});

router.patch("/partner-responses/:id", async (req, res, next) => {
  try {
    const requester = await requireHqRequester(req);

    if (!requester.personName) {
      throw new HqAccessError();
    }

    const params = responseIdParamsSchema.parse(req.params);
    const body = updateResponseSchema.parse(req.body);

    res.json(
      await updateHqPartnerResponse({
        organizationId: requester.organizationId,
        responseId: params.id,
        personName: requester.personName,
        body: body.body,
        userId: requester.userId,
        email: requester.email
      })
    );
  } catch (error) {
    if (!handleHqRouteError(error, res)) {
      next(error);
    }
  }
});

export default router;
