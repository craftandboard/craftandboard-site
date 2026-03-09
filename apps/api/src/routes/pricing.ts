import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  calculatePricingSchema,
  createPackagingProfileSchema,
  createPricingPolicySchema,
  createPricingScenarioSchema,
  createProductionAssumptionProfileSchema,
  createShelfProductSchema,
  updatePackagingProfileSchema,
  updatePricingPolicySchema,
  updateProductionAssumptionProfileSchema,
  updateShelfProductSchema
} from "../modules/pricing/schemas.js";
import {
  calculatePricing,
  createPackagingProfileRecord,
  createPricingPolicyRecord,
  createPricingScenarioSnapshot,
  createProductionAssumptionProfileRecord,
  createShelfProductRecord,
  getPackagingProfiles,
  getPricingPolicies,
  getProductionAssumptionProfiles,
  getShelfProducts,
  updatePackagingProfileRecord,
  updatePricingPolicyRecord,
  updateProductionAssumptionProfileRecord,
  updateShelfProductRecord
} from "../modules/pricing/service.js";

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
    res.status(400).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.get("/shelf-products", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "pricing_read");
    res.json(await getShelfProducts(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/shelf-products", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "pricing_manage");
    const body = createShelfProductSchema.parse(req.body ?? {});
    res.status(201).json(await createShelfProductRecord({ organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/shelf-products/:id/update", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "pricing_manage");
    const body = updateShelfProductSchema.parse(req.body ?? {});
    res.json(await updateShelfProductRecord(req.params.id, { organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/production-assumptions", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "pricing_read");
    res.json(await getProductionAssumptionProfiles(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/production-assumptions", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "pricing_manage");
    const body = createProductionAssumptionProfileSchema.parse(req.body ?? {});
    res.status(201).json(await createProductionAssumptionProfileRecord({ organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/production-assumptions/:id/update", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "pricing_manage");
    const body = updateProductionAssumptionProfileSchema.parse(req.body ?? {});
    res.json(await updateProductionAssumptionProfileRecord(req.params.id, { organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/packaging-profiles", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "pricing_read");
    res.json(await getPackagingProfiles(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/packaging-profiles", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "pricing_manage");
    const body = createPackagingProfileSchema.parse(req.body ?? {});
    res.status(201).json(await createPackagingProfileRecord({ organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/packaging-profiles/:id/update", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "pricing_manage");
    const body = updatePackagingProfileSchema.parse(req.body ?? {});
    res.json(await updatePackagingProfileRecord(req.params.id, { organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/policies", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "pricing_read");
    res.json(await getPricingPolicies(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/policies", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "pricing_manage");
    const body = createPricingPolicySchema.parse(req.body ?? {});
    res.status(201).json(await createPricingPolicyRecord({ organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/policies/:id/update", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "pricing_manage");
    const body = updatePricingPolicySchema.parse(req.body ?? {});
    res.json(await updatePricingPolicyRecord(req.params.id, { organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/calculate", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "pricing_manage");
    const body = calculatePricingSchema.parse(req.body ?? {});
    res.json(await calculatePricing(body, context.currentOrganization.id, context.currentUser.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/scenarios", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "pricing_manage");
    const body = createPricingScenarioSchema.parse(req.body ?? {});
    res.status(201).json(await createPricingScenarioSnapshot({ ...body, createdByUserId: context.currentUser.id }, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
