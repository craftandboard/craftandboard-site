import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  createWorkflowStationRuleSchema,
  listScanEventsQuerySchema,
  partScanSchema,
  scanLookupSchema,
  updateWorkflowStationRuleSchema
} from "../modules/scanning/schemas.js";
import {
  createWorkflowStationRuleRecord,
  getScanEventView,
  getScanEventsView,
  getWorkflowStationRulesView,
  lookupScan,
  scanManufacturingPart,
  updateWorkflowStationRuleRecord
} from "../modules/scanning/service.js";

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
    const maybeScanEvent = (error as Error & { scanEvent?: unknown }).scanEvent;
    res.status(error.message.includes("not found") ? 404 : 400).json({
      ok: false,
      error: error.message,
      ...(maybeScanEvent ? { event: maybeScanEvent } : {})
    });
    return;
  }
  next(error);
}

router.post("/scan/lookup", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "station_read");
    const body = scanLookupSchema.parse(req.body ?? {});
    res.json(
      await lookupScan({
        organizationId: context.currentOrganization.id,
        scanValue: body.scanValue,
        stationType: body.stationType,
        metadata: body.metadata,
        scannedByUserId: context.currentUser.id
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/scan/part", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "part_transition");
    const body = partScanSchema.parse(req.body ?? {});
    res.json(
      await scanManufacturingPart({
        organizationId: context.currentOrganization.id,
        scanValue: body.scanValue,
        stationType: body.stationType,
        actionType: body.actionType,
        metadata: body.metadata,
        scannedByUserId: context.currentUser.id
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/scan/events", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "station_read");
    const query = listScanEventsQuerySchema.parse(req.query);
    res.json(await getScanEventsView({ organizationId: context.currentOrganization.id, ...query }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/scan/events/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "station_read");
    res.json(await getScanEventView(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/workflow/station-rules", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "station_read");
    res.json(await getWorkflowStationRulesView(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/workflow/station-rules", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "manufacturing_expansion_manage");
    const body = createWorkflowStationRuleSchema.parse(req.body ?? {});
    res.status(201).json(await createWorkflowStationRuleRecord({ organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/workflow/station-rules/:id/update", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "manufacturing_expansion_manage");
    const body = updateWorkflowStationRuleSchema.parse(req.body ?? {});
    res.json(await updateWorkflowStationRuleRecord({ id: req.params.id, organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
