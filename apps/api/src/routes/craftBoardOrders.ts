import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  createCraftBoardOrderFromProposal,
  getCraftBoardOrderDetail,
  listCraftBoardOrders,
  updateCraftBoardOrder
} from "../modules/craftBoardOrders/service.js";
import {
  craftBoardOrderCreateParamsSchema,
  craftBoardOrderIdParamsSchema,
  createCraftBoardOrderSchema,
  listCraftBoardOrdersQuerySchema,
  updateCraftBoardOrderSchema
} from "../modules/craftBoardOrders/schemas.js";

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
      error.message === "Proposal not found." || error.message === "Order not found."
        ? 404
        : 400;
    res.status(statusCode).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.post("/craft-board/proposals/:proposalId/order", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const params = craftBoardOrderCreateParamsSchema.parse(req.params);
    const body = createCraftBoardOrderSchema.parse(req.body ?? {});
    res.status(201).json(
      await createCraftBoardOrderFromProposal({
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

router.get("/craft-board/orders", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const query = listCraftBoardOrdersQuerySchema.parse(req.query);
    res.json(
      await listCraftBoardOrders({
        organizationId: context.currentOrganization.id,
        status: query.status,
        query: query.q
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/craft-board/orders/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const params = craftBoardOrderIdParamsSchema.parse(req.params);
    res.json(
      await getCraftBoardOrderDetail({
        organizationId: context.currentOrganization.id,
        id: params.id
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.patch("/craft-board/orders/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const params = craftBoardOrderIdParamsSchema.parse(req.params);
    const body = updateCraftBoardOrderSchema.parse(req.body);
    res.json(
      await updateCraftBoardOrder({
        organizationId: context.currentOrganization.id,
        id: params.id,
        ...body
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
