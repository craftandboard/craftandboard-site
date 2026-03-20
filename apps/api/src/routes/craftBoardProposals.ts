import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  approveCraftBoardProposal,
  createCraftBoardProposalFromInquiry,
  declineCraftBoardProposal,
  getCraftBoardProposalDetail,
  getPublicCraftBoardProposal,
  listCraftBoardProposals,
  markCraftBoardProposalViewed,
  updateCraftBoardProposal
} from "../modules/craftBoardProposals/service.js";
import {
  craftBoardProposalCreateParamsSchema,
  craftBoardProposalIdParamsSchema,
  craftBoardProposalPublicResponseSchema,
  craftBoardProposalTokenParamsSchema,
  listCraftBoardProposalsQuerySchema,
  updateCraftBoardProposalSchema
} from "../modules/craftBoardProposals/schemas.js";

const router = Router();

function handleRouteError(error: unknown, res: any, next: any) {
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
    const statusCode =
      error.message === "Inquiry not found." || error.message === "Proposal not found."
        ? 404
        : 400;
    res.status(statusCode).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.post("/craft-board/inquiries/:inquiryId/proposal", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const params = craftBoardProposalCreateParamsSchema.parse(req.params);
    res.status(201).json(
      await createCraftBoardProposalFromInquiry({
        organizationId: context.currentOrganization.id,
        inquiryId: params.inquiryId,
        actorName: context.currentUser.name ?? context.currentUser.email
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/craft-board/proposals", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const query = listCraftBoardProposalsQuerySchema.parse(req.query);
    res.json(
      await listCraftBoardProposals({
        organizationId: context.currentOrganization.id,
        status: query.status,
        query: query.q
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/craft-board/proposals/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const params = craftBoardProposalIdParamsSchema.parse(req.params);
    res.json(
      await getCraftBoardProposalDetail({
        organizationId: context.currentOrganization.id,
        id: params.id
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.patch("/craft-board/proposals/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const params = craftBoardProposalIdParamsSchema.parse(req.params);
    const body = updateCraftBoardProposalSchema.parse(req.body);
    res.json(
      await updateCraftBoardProposal({
        organizationId: context.currentOrganization.id,
        id: params.id,
        actorName: context.currentUser.name ?? context.currentUser.email,
        ...body
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/public/craft-board/proposals/:publicToken", async (req, res, next) => {
  try {
    const params = craftBoardProposalTokenParamsSchema.parse(req.params);
    res.json(await getPublicCraftBoardProposal({ publicToken: params.publicToken }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/public/craft-board/proposals/:publicToken/view", async (req, res, next) => {
  try {
    const params = craftBoardProposalTokenParamsSchema.parse(req.params);
    res.json(await markCraftBoardProposalViewed({ publicToken: params.publicToken }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/public/craft-board/proposals/:publicToken/respond", async (req, res, next) => {
  try {
    const params = craftBoardProposalTokenParamsSchema.parse(req.params);
    const body = craftBoardProposalPublicResponseSchema.parse(req.body);
    res.json(
      body.action === "approve"
        ? await approveCraftBoardProposal({ publicToken: params.publicToken })
        : await declineCraftBoardProposal({ publicToken: params.publicToken })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
