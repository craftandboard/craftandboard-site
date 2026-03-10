import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import { getProposalAcceptancePresentationReadContext } from "../modules/proposalAcceptancePresentation/contextAdapter.js";
import {
  getPublicConfirmation,
  getPublicPresentationState,
  getReadyToConfirmState,
  getSignerInstructions,
  listPresentationLogsForProposal,
  ProposalAcceptancePresentationTokenError,
  recordPresentationViewed
} from "../modules/proposalAcceptancePresentation/service.js";
import { proposalIdParamsSchema, reviewTokenSchema } from "../modules/proposalAcceptancePresentation/schemas.js";

const router = Router();

function handlePresentationError(error: unknown, res: any, next: any) {
  if (error instanceof ProposalAcceptancePresentationTokenError) {
    res.status(400).json({
      ok: false,
      error: "Invalid or expired acceptance token."
    });
    return;
  }
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
    const status = error.message === "Proposal not found." ? 404 : 400;
    res.status(status).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.post("/public/proposal-acceptance/presentation-state", async (req, res, next) => {
  try {
    const body = reviewTokenSchema.parse(req.body);
    res.json(await getPublicPresentationState({ token: body.token }));
  } catch (error) {
    handlePresentationError(error, res, next);
  }
});

router.post("/public/proposal-acceptance/instructions", async (req, res, next) => {
  try {
    const body = reviewTokenSchema.parse(req.body);
    res.json(await getSignerInstructions({ token: body.token }));
  } catch (error) {
    handlePresentationError(error, res, next);
  }
});

router.post("/public/proposal-acceptance/ready-state", async (req, res, next) => {
  try {
    const body = reviewTokenSchema.parse(req.body);
    res.json(await getReadyToConfirmState({ token: body.token }));
  } catch (error) {
    handlePresentationError(error, res, next);
  }
});

router.post("/public/proposal-acceptance/confirmation", async (req, res, next) => {
  try {
    const body = reviewTokenSchema.parse(req.body);
    res.json(await getPublicConfirmation({ token: body.token }));
  } catch (error) {
    handlePresentationError(error, res, next);
  }
});

router.post("/public/proposal-acceptance/presentation-viewed", async (req, res, next) => {
  try {
    const body = reviewTokenSchema.parse(req.body);
    res.json(await recordPresentationViewed({ token: body.token }));
  } catch (error) {
    handlePresentationError(error, res, next);
  }
});

router.get("/proposals/:proposalId/acceptance-presentation-logs", async (req, res, next) => {
  try {
    const context = getProposalAcceptancePresentationReadContext(req);
    const params = proposalIdParamsSchema.parse(req.params);
    res.json(
      await listPresentationLogsForProposal({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId
      })
    );
  } catch (error) {
    handlePresentationError(error, res, next);
  }
});

export default router;
