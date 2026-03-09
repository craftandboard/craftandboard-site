import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import { addSalesOrderItemsSchema, createSalesOrderSchema } from "../modules/orderIntake/schemas.js";
import {
  addSalesOrderItemsRecord,
  createSalesOrderRecord,
  getSalesOrder,
  getSalesOrders,
  normalizeSalesOrder,
  priceSalesOrder,
  createShelfJobsFromSalesOrder
} from "../modules/orderIntake/service.js";

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
    res.status(error.message.includes("not found") ? 404 : 400).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.get("/orders", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "order_intake_read");
    res.json(await getSalesOrders(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/orders", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "order_intake_manage");
    const body = createSalesOrderSchema.parse(req.body ?? {});
    res.status(201).json(await createSalesOrderRecord({ organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/orders/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "order_intake_read");
    res.json(await getSalesOrder(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/orders/:id/items", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "order_intake_manage");
    const body = addSalesOrderItemsSchema.parse(req.body ?? {});
    res.status(201).json(await addSalesOrderItemsRecord(req.params.id, { organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/orders/:id/normalize", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "order_intake_manage");
    res.json(await normalizeSalesOrder(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/orders/:id/price", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "order_intake_manage");
    res.json(await priceSalesOrder(req.params.id, context.currentOrganization.id, context.currentUser.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/orders/:id/create-shelf-jobs", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "order_intake_manage");
    res.status(201).json(await createShelfJobsFromSalesOrder(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
