import { Router } from "express";
import { listStations } from "../modules/stations/service.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    scope: "foundation-only",
    stations: listStations()
  });
});

router.post("/scan", (_req, res) => {
  res.status(202).json({
    status: "accepted",
    scope: "foundation-only",
    message: "Station scan is a placeholder endpoint."
  });
});

export default router;
