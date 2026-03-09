import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  MACHINE_TELEMETRY_EVENT_TYPES,
  MACHINE_TELEMETRY_PROCESSING_STATUSES
} from "../modules/machineTelemetry/contracts.js";
import { MACHINE_EVENT_SOURCE_TYPES } from "../modules/machines/contracts.js";
import {
  getMachineEvent,
  getMachineEventIngestRun,
  getMachineEventLinks,
  ingestMachineEvent,
  ingestMachineEventBatch,
  listMachineEventIngestRuns,
  listMachineEvents,
  reprocessMachineEvent
} from "../modules/machineTelemetry/service.js";

const router = Router();

const machineEventBaseSchema = z.object({
  machineSourceId: z.string().trim().min(1).optional(),
  machineSourceCode: z.string().trim().min(1).optional(),
  machineId: z.string().trim().min(1).optional(),
  machineCode: z.string().trim().min(1).optional(),
  eventType: z.enum(MACHINE_TELEMETRY_EVENT_TYPES),
  eventTimestamp: z.string().trim().min(1).optional(),
  eventTs: z.string().trim().min(1).optional(),
  sourceType: z.enum(MACHINE_EVENT_SOURCE_TYPES),
  externalEventId: z.string().trim().min(1).optional(),
  sourceEventId: z.string().trim().min(1).optional(),
  payload: z.unknown().optional(),
  batchRef: z.string().trim().min(1).optional(),
  jobRef: z.string().trim().min(1).optional(),
  partRef: z.string().trim().min(1).optional(),
  remnantCode: z.string().trim().min(1).optional(),
  sheetRef: z.string().trim().min(1).optional(),
  severity: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(500).optional()
});

const machineEventSchema = machineEventBaseSchema.refine(
  (value) => value.machineSourceId || value.machineSourceCode || value.machineId || value.machineCode,
  {
    message: "machineSourceId or machineSourceCode is required."
  }
);

const machineEventBatchSchema = z.object({
  machineSourceId: z.string().trim().min(1).optional(),
  machineSourceCode: z.string().trim().min(1).optional(),
  machineId: z.string().trim().min(1).optional(),
  machineCode: z.string().trim().min(1).optional(),
  sourceReference: z.string().trim().min(1).optional(),
  events: z.array(machineEventBaseSchema).min(1)
}).refine(
  (value) => value.machineSourceId || value.machineSourceCode || value.machineId || value.machineCode,
  {
    message: "machineSourceId or machineSourceCode is required."
  }
);

const simulatedMachineEventSchema = machineEventBaseSchema
  .omit({ sourceType: true })
  .refine((value) => value.machineSourceId || value.machineSourceCode || value.machineId || value.machineCode, {
    message: "machineSourceId or machineSourceCode is required."
  });

const machineEventListQuerySchema = z.object({
  machineSourceId: z.string().trim().min(1).optional(),
  machineId: z.string().trim().min(1).optional(),
  eventType: z.enum(MACHINE_TELEMETRY_EVENT_TYPES).optional(),
  processingStatus: z.enum(MACHINE_TELEMETRY_PROCESSING_STATUSES).optional(),
  dateFrom: z.string().trim().min(1).optional(),
  dateTo: z.string().trim().min(1).optional()
});

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
    res.status(error.message === "Machine not found." ? 404 : 400).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.get("/", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_read");
    const query = machineEventListQuerySchema.parse(req.query);
    res.json(
      await listMachineEvents(
        {
          machineSourceId: query.machineSourceId ?? query.machineId,
          eventType: query.eventType,
          processingStatus: query.processingStatus,
          dateFrom: query.dateFrom,
          dateTo: query.dateTo
        },
        context.currentOrganization.id
      )
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/ingest-runs", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_read");
    res.json(await listMachineEventIngestRuns(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/ingest-runs/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_read");
    res.json(await getMachineEventIngestRun(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/ingest", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_manage");
    const body = machineEventSchema.parse(req.body ?? {});
    res.status(201).json(
      await ingestMachineEvent(
        {
          ...body,
          externalEventId: body.externalEventId ?? body.sourceEventId,
          eventTimestamp: body.eventTimestamp ?? body.eventTs
        },
        context.currentOrganization.id
      )
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/ingest-batch", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_manage");
    const body = machineEventBatchSchema.parse(req.body ?? {});
    res.status(201).json(
      await ingestMachineEventBatch(
        {
          ...body,
          events: body.events.map((event) => ({
            ...event,
            externalEventId: event.externalEventId ?? event.sourceEventId,
            eventTimestamp: event.eventTimestamp ?? event.eventTs
          }))
        },
        context.currentOrganization.id
      )
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/simulate", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_manage");
    const body = simulatedMachineEventSchema.parse(req.body ?? {});
    res.status(201).json(
      await ingestMachineEvent(
        {
          ...body,
          sourceType: "MANUAL_SIMULATION",
          externalEventId: body.externalEventId ?? body.sourceEventId,
          eventTimestamp: body.eventTimestamp ?? body.eventTs
        },
        context.currentOrganization.id
      )
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/:id/links", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_read");
    res.json(await getMachineEventLinks(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/:id/reprocess", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_manage");
    res.json(await reprocessMachineEvent(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_read");
    res.json(await getMachineEvent(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
