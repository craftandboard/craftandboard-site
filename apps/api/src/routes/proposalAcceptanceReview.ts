import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import { getProposalAcceptanceReviewReadContext } from "../modules/proposalAcceptanceReview/contextAdapter.js";
import {
  getPublicProposalSnapshot,
  getPublicReviewContext,
  listReviewLogsForProposal,
  ProposalAcceptanceReviewTokenError,
  recordSnapshotViewed
} from "../modules/proposalAcceptanceReview/service.js";
import { proposalIdParamsSchema, reviewTokenSchema } from "../modules/proposalAcceptanceReview/schemas.js";

const router = Router();

function handleReviewError(error: unknown, res: any, next: any) {
  if (error instanceof ProposalAcceptanceReviewTokenError) {
    const code = error.code ?? "INVALID";
    res.status(400).json({
      ok: false,
      code,
      error:
        code === "EXPIRED"
          ? "This acceptance link expired."
          : code === "REVOKED"
            ? "This acceptance link was revoked."
            : "This acceptance link is not available."
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

router.post("/public/proposal-acceptance/review", async (req, res, next) => {
  try {
    const body = reviewTokenSchema.parse(req.body);
    res.json(await getPublicProposalSnapshot({ token: body.token }));
  } catch (error) {
    handleReviewError(error, res, next);
  }
});

router.post("/public/proposal-acceptance/review-context", async (req, res, next) => {
  try {
    const body = reviewTokenSchema.parse(req.body);
    res.json(await getPublicReviewContext({ token: body.token }));
  } catch (error) {
    handleReviewError(error, res, next);
  }
});

router.post("/public/proposal-acceptance/viewed", async (req, res, next) => {
  try {
    const body = reviewTokenSchema.parse(req.body);
    res.json(await recordSnapshotViewed({ token: body.token }));
  } catch (error) {
    handleReviewError(error, res, next);
  }
});

router.get("/proposals/:proposalId/acceptance-review-logs", async (req, res, next) => {
  try {
    const context = getProposalAcceptanceReviewReadContext(req);
    const params = proposalIdParamsSchema.parse(req.params);
    res.json(
      await listReviewLogsForProposal({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId
      })
    );
  } catch (error) {
    handleReviewError(error, res, next);
  }
});

export default router;
