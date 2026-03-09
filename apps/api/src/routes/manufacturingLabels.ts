import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  getManufacturingPartLabelHtml,
  getManufacturingPartLabelPayload,
  reprintManufacturingPartLabel
} from "../modules/labels/service.js";

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

router.get("/manufacturing-parts/:id/label-payload", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "station_read");
    res.json(await getManufacturingPartLabelPayload(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/manufacturing-parts/:id/label.html", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "station_read");
    const result = await getManufacturingPartLabelHtml(req.params.id, context.currentOrganization.id);
    res.type("html").send(result.html);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/manufacturing-parts/:id/reprint-label", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "part_transition");
    res.status(201).json(
      await reprintManufacturingPartLabel({
        partId: req.params.id,
        organizationId: context.currentOrganization.id,
        createdByUserId: context.currentUser.id,
        renderFormat: "HTML"
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
