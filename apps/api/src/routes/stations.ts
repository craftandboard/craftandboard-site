import { Router } from "express";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import { getStationQueue, isShopFloorStationKey, listStations } from "../modules/stations/service.js";

const router = Router();

router.get("/", (req, res) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "station_read");
    res.json({
      status: "ok",
      scope: "foundation-only",
      stations: listStations(context.currentOrganization.id)
    });
  } catch (error) {
    if (error instanceof RequestAuthenticationError) {
      res.status(401).json({ ok: false, error: error.message });
      return;
    }
    if (error instanceof AuthorizationError) {
      res.status(403).json({ ok: false, error: error.message });
      return;
    }
    throw error;
  }
});

router.get("/:station", async (req, res) => {
  if (!isShopFloorStationKey(req.params.station)) {
    return res.status(404).json({
      ok: false,
      error: "Station not found."
    });
  }

  try {
    const context = getRequestContext(req);
    assertCapability(context, "station_read");
    const payload = await getStationQueue(req.params.station, context.currentOrganization.id);
    return res.json(payload);
  } catch (error) {
    if (error instanceof RequestAuthenticationError) {
      return res.status(401).json({ ok: false, error: error.message });
    }
    if (error instanceof AuthorizationError) {
      return res.status(403).json({ ok: false, error: error.message });
    }
    throw error;
  }
});

router.post("/scan", (_req, res) => {
  res.status(202).json({
    status: "accepted",
    scope: "foundation-only",
    message: "Station scan is a placeholder endpoint."
  });
});

export default router;
