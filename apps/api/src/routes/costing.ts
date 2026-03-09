import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  calculateCostSchema,
  createCostProfileSchema,
  createCostScenarioSchema,
  updateCostProfileSchema,
  upsertCostRatesSchema
} from "../modules/costing/schemas.js";
import {
  calculateCost,
  createCostProfile,
  createCostScenarioSnapshot,
  getSalesOrderCostEstimate,
  getCostProfileRates,
  getCostProfiles,
  getShelfJobCostEstimate,
  recomputeSalesOrderCostEstimate,
  recomputeShelfJobCostEstimate,
  updateCostProfile,
  upsertCostRates
} from "../modules/costing/service.js";

const router = Router();

function handleRouteError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof RequestAuthenticationError) {
    res.status(401).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof AuthorizationError) {
    res.status(403).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof z.ZodError) {
    res.status(400).json({ ok: false, error: error.issues[0]?.message ?? error.message });
    return;
  }
  if (error instanceof Error) {
    res.status(error.message === "Cost profile not found." ? 404 : 400).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.get("/profiles", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "costing_read");
    res.json(await getCostProfiles(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/profiles", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "costing_manage");
    const body = createCostProfileSchema.parse(req.body ?? {});
    res.status(201).json(await createCostProfile(body, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/profiles/:id/update", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "costing_manage");
    const body = updateCostProfileSchema.parse(req.body ?? {});
    res.json(await updateCostProfile(req.params.id, body, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/profiles/:id/rates", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "costing_read");
    res.json(await getCostProfileRates(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/profiles/:id/rates/upsert", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "costing_manage");
    const body = upsertCostRatesSchema.parse(req.body ?? {});
    res.json(await upsertCostRates(req.params.id, body, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/calculate", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "costing_manage");
    const body = calculateCostSchema.parse(req.body ?? {});
    res.json(await calculateCost(body, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/scenarios", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "costing_manage");
    const body = createCostScenarioSchema.parse(req.body ?? {});
    res.status(201).json(
      await createCostScenarioSnapshot(
        {
          ...body,
          createdByUserId: context.currentUser.id
        },
        context.currentOrganization.id
      )
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/shelf-jobs/:id/estimate", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "costing_read");
    res.json(await getShelfJobCostEstimate(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/shelf-jobs/:id/estimate", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "costing_manage");
    res.status(201).json(await recomputeShelfJobCostEstimate(req.params.id, context.currentOrganization.id, context.currentUser.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/orders/:id/estimate", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "costing_read");
    res.json(await getSalesOrderCostEstimate(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/orders/:id/estimate", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "costing_manage");
    res.status(201).json(await recomputeSalesOrderCostEstimate(req.params.id, context.currentOrganization.id, context.currentUser.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
