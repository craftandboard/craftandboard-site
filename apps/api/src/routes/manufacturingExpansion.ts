import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  addPartsToManufacturingBatchSchema,
  createLabelTemplateSchema,
  createManufacturingBatchSchema,
  expandManufacturingPacketSchema,
  listManufacturingPartsQuerySchema,
  updateLabelTemplateSchema
} from "../modules/manufacturingExpansion/schemas.js";
import {
  addManufacturingPartsToBatch,
  createLabelTemplateRecord,
  createManufacturingBatchRecord,
  expandManufacturingPacket,
  getLabelTemplates,
  getManufacturingBatch,
  getManufacturingBatches,
  getManufacturingPacketParts,
  getManufacturingPart,
  getManufacturingPartLabel,
  getManufacturingPartsView,
  updateLabelTemplateRecord
} from "../modules/manufacturingExpansion/service.js";

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

router.post("/manufacturing-packets/:id/expand", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "manufacturing_expansion_manage");
    expandManufacturingPacketSchema.parse(req.body ?? {});
    res.status(201).json(
      await expandManufacturingPacket({
        manufacturingPacketId: req.params.id,
        organizationId: context.currentOrganization.id,
        createdByUserId: context.currentUser.id
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/manufacturing-packets/:id/parts", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "manufacturing_expansion_read");
    res.json(await getManufacturingPacketParts(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/manufacturing-parts", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "manufacturing_expansion_read");
    const query = listManufacturingPartsQuerySchema.parse(req.query);
    res.json(await getManufacturingPartsView({ organizationId: context.currentOrganization.id, ...query }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/manufacturing-parts/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "manufacturing_expansion_read");
    res.json(await getManufacturingPart(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/manufacturing-parts/:id/label", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "manufacturing_expansion_read");
    res.json(await getManufacturingPartLabel(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/manufacturing-batches", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "manufacturing_expansion_manage");
    const body = createManufacturingBatchSchema.parse(req.body ?? {});
    res.status(201).json(
      await createManufacturingBatchRecord({
        organizationId: context.currentOrganization.id,
        ...body
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/manufacturing-batches", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "manufacturing_expansion_read");
    res.json(await getManufacturingBatches(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/manufacturing-batches/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "manufacturing_expansion_read");
    res.json(await getManufacturingBatch(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/manufacturing-batches/:id/add-parts", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "manufacturing_expansion_manage");
    const body = addPartsToManufacturingBatchSchema.parse(req.body ?? {});
    res.json(
      await addManufacturingPartsToBatch({
        organizationId: context.currentOrganization.id,
        batchId: req.params.id,
        partIds: body.partIds
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/label-templates", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "manufacturing_expansion_read");
    res.json(await getLabelTemplates(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/label-templates", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "manufacturing_expansion_manage");
    const body = createLabelTemplateSchema.parse(req.body ?? {});
    res.status(201).json(await createLabelTemplateRecord({ organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/label-templates/:id/update", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "manufacturing_expansion_manage");
    const body = updateLabelTemplateSchema.parse(req.body ?? {});
    res.json(await updateLabelTemplateRecord(req.params.id, { organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
