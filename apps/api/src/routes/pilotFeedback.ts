import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import {
  getPilotFeedbackReadContext,
  getPilotFeedbackWriteContext
} from "../modules/pilotFeedback/contextAdapter.js";
import {
  createPilotFeedback,
  listPilotFeedback,
  updatePilotFeedback
} from "../modules/pilotFeedback/service.js";
import {
  createPilotFeedbackSchema,
  feedbackIdParamsSchema,
  listPilotFeedbackQuerySchema,
  updatePilotFeedbackSchema
} from "../modules/pilotFeedback/schemas.js";

const router = Router();

function handlePilotFeedbackRouteError(error: unknown, res: any, next: any) {
  if (error instanceof RequestAuthenticationError) {
    res.status(401).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof AuthorizationError) {
    res.status(403).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof z.ZodError) {
    res.status(400).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof Error) {
    const status = error.message === "Pilot feedback not found." ? 404 : 400;
    res.status(status).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.get("/pilot-feedback", async (req, res, next) => {
  try {
    const context = getPilotFeedbackReadContext(req);
    const query = listPilotFeedbackQuerySchema.parse(req.query);

    res.json(
      await listPilotFeedback({
        organizationId: context.currentOrganization.id,
        ...query
      })
    );
  } catch (error) {
    handlePilotFeedbackRouteError(error, res, next);
  }
});

router.post("/pilot-feedback", async (req, res, next) => {
  try {
    const context = getPilotFeedbackWriteContext(req);
    const body = createPilotFeedbackSchema.parse(req.body);

    res.status(201).json(
      await createPilotFeedback({
        organizationId: context.currentOrganization.id,
        membershipId: context.membership.id,
        ...body
      })
    );
  } catch (error) {
    handlePilotFeedbackRouteError(error, res, next);
  }
});

router.patch("/pilot-feedback/:feedbackId", async (req, res, next) => {
  try {
    const context = getPilotFeedbackWriteContext(req);
    const params = feedbackIdParamsSchema.parse(req.params);
    const body = updatePilotFeedbackSchema.parse(req.body);

    res.json(
      await updatePilotFeedback({
        organizationId: context.currentOrganization.id,
        feedbackId: params.feedbackId,
        ...body
      })
    );
  } catch (error) {
    handlePilotFeedbackRouteError(error, res, next);
  }
});

export default router;
