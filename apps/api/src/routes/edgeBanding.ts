import { Router } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  getBatchEdgeBandEstimate,
  getForecastEdgeBandEstimate,
  getOrderEdgeBandEstimate
} from "../modules/edgeBanding/service.js";

const router = Router();

const idParamSchema = z.object({
  batchId: z.string().min(1).optional(),
  orderId: z.string().min(1).optional()
});

router.get("/forecast", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "batch_read");
    const payload = await getForecastEdgeBandEstimate(context.currentOrganization.id);
    res.json(payload);
  } catch (error) {
    if (error instanceof RequestAuthenticationError) {
      res.status(401).json({ ok: false, error: error.message });
      return;
    }
    if (error instanceof AuthorizationError) {
      res.status(403).json({ ok: false, error: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.get("/batch/:batchId", async (req, res, next) => {
  try {
    const params = idParamSchema.parse(req.params);
    const context = getRequestContext(req);
    assertCapability(context, "batch_read");
    const payload = await getBatchEdgeBandEstimate(params.batchId!, context.currentOrganization.id);
    res.json(payload);
  } catch (error) {
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
});

router.get("/orders/:orderId", async (req, res, next) => {
  try {
    const params = idParamSchema.parse(req.params);
    const context = getRequestContext(req);
    assertCapability(context, "batch_read");
    const payload = await getOrderEdgeBandEstimate(params.orderId!, context.currentOrganization.id);
    res.json(payload);
  } catch (error) {
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
});

export default router;
