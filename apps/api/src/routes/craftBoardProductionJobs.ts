import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  createCraftBoardProductionJobFromOrder,
  getCraftBoardProductionBoard,
  getCraftBoardProductionJobDetail,
  listCraftBoardProductionJobs,
  updateCraftBoardProductionJob
} from "../modules/craftBoardProductionJobs/service.js";
import {
  craftBoardProductionJobCreateParamsSchema,
  craftBoardProductionJobIdParamsSchema,
  createCraftBoardProductionJobSchema,
  listCraftBoardProductionJobsQuerySchema,
  updateCraftBoardProductionJobSchema
} from "../modules/craftBoardProductionJobs/schemas.js";

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
      error.message === "Order not found." || error.message === "Production job not found."
        ? 404
        : 400;
    res.status(statusCode).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.post("/craft-board/orders/:orderId/production-job", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const params = craftBoardProductionJobCreateParamsSchema.parse(req.params);
    const body = createCraftBoardProductionJobSchema.parse(req.body ?? {});
    res.status(201).json(
      await createCraftBoardProductionJobFromOrder({
        organizationId: context.currentOrganization.id,
        orderId: params.orderId,
        actorName: context.currentUser.name ?? context.currentUser.email,
        ...body
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/craft-board/production-jobs", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const query = listCraftBoardProductionJobsQuerySchema.parse(req.query);
    res.json(
      await listCraftBoardProductionJobs({
        organizationId: context.currentOrganization.id,
        status: query.status,
        stage: query.stage,
        includeFulfilled: query.includeFulfilled,
        includeCancelled: query.includeCancelled,
        query: query.q
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/craft-board/production-board", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const query = listCraftBoardProductionJobsQuerySchema.parse(req.query);
    res.json(
      await getCraftBoardProductionBoard({
        organizationId: context.currentOrganization.id,
        query: query.q,
        includeFulfilled: query.includeFulfilled,
        includeCancelled: query.includeCancelled
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/craft-board/production-jobs/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const params = craftBoardProductionJobIdParamsSchema.parse(req.params);
    res.json(
      await getCraftBoardProductionJobDetail({
        organizationId: context.currentOrganization.id,
        id: params.id
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.patch("/craft-board/production-jobs/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const params = craftBoardProductionJobIdParamsSchema.parse(req.params);
    const body = updateCraftBoardProductionJobSchema.parse(req.body);
    res.json(
      await updateCraftBoardProductionJob({
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
