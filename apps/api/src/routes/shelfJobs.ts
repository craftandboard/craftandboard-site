import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import { convertShelfJobsToPacketSchema } from "../modules/orderIntake/schemas.js";
import {
  convertShelfJobsToManufacturingPacket,
  getManufacturingPacket,
  getManufacturingPackets,
  getShelfJob,
  getShelfJobs
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

router.get("/shelf-jobs", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "order_intake_read");
    res.json(await getShelfJobs(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/shelf-jobs/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "order_intake_read");
    res.json(await getShelfJob(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/shelf-jobs/convert-to-packet", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "order_intake_manage");
    const body = convertShelfJobsToPacketSchema.parse(req.body ?? {});
    res.status(201).json(
      await convertShelfJobsToManufacturingPacket({
        shelfJobIds: body.shelfJobIds,
        organizationId: context.currentOrganization.id,
        createdByUserId: context.currentUser.id
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/manufacturing-packets", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "order_intake_read");
    res.json(await getManufacturingPackets(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/manufacturing-packets/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "order_intake_read");
    res.json(await getManufacturingPacket(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
