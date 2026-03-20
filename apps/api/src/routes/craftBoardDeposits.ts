import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  createCraftBoardDepositRequestFromProposal,
  getCraftBoardDepositRequestDetail,
  getPublicCraftBoardDepositRequest,
  initiateCraftBoardDepositPayment,
  listCraftBoardDepositRequests,
  markCraftBoardDepositViewed,
  updateCraftBoardDepositRequest
} from "../modules/craftBoardDeposits/service.js";
import {
  craftBoardDepositCreateParamsSchema,
  craftBoardDepositIdParamsSchema,
  craftBoardDepositTokenParamsSchema,
  createCraftBoardDepositRequestSchema,
  listCraftBoardDepositsQuerySchema,
  updateCraftBoardDepositRequestSchema
} from "../modules/craftBoardDeposits/schemas.js";

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
      error.message === "Proposal not found." || error.message === "Deposit request not found."
        ? 404
        : 400;
    res.status(statusCode).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.post("/craft-board/proposals/:proposalId/deposit", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const params = craftBoardDepositCreateParamsSchema.parse(req.params);
    const body = createCraftBoardDepositRequestSchema.parse(req.body ?? {});
    res.status(201).json(
      await createCraftBoardDepositRequestFromProposal({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId,
        actorName: context.currentUser.name ?? context.currentUser.email,
        ...body
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/craft-board/deposits", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const query = listCraftBoardDepositsQuerySchema.parse(req.query);
    res.json(
      await listCraftBoardDepositRequests({
        organizationId: context.currentOrganization.id,
        status: query.status,
        query: query.q
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/craft-board/deposits/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const params = craftBoardDepositIdParamsSchema.parse(req.params);
    res.json(
      await getCraftBoardDepositRequestDetail({
        organizationId: context.currentOrganization.id,
        id: params.id
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.patch("/craft-board/deposits/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const params = craftBoardDepositIdParamsSchema.parse(req.params);
    const body = updateCraftBoardDepositRequestSchema.parse(req.body);
    res.json(
      await updateCraftBoardDepositRequest({
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

router.get("/public/craft-board/deposits/:publicToken", async (req, res, next) => {
  try {
    const params = craftBoardDepositTokenParamsSchema.parse(req.params);
    res.json(await getPublicCraftBoardDepositRequest({ publicToken: params.publicToken }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/public/craft-board/deposits/:publicToken/view", async (req, res, next) => {
  try {
    const params = craftBoardDepositTokenParamsSchema.parse(req.params);
    res.json(await markCraftBoardDepositViewed({ publicToken: params.publicToken }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/public/craft-board/deposits/:publicToken/payment-init", async (req, res, next) => {
  try {
    const params = craftBoardDepositTokenParamsSchema.parse(req.params);
    res.json(await initiateCraftBoardDepositPayment({ publicToken: params.publicToken }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
