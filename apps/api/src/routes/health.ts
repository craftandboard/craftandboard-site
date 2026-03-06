import { Router } from "express";
import type { ApiHealthResponse } from "@craft-and-board/shared";

const router = Router();

router.get("/", (_req, res) => {
  const payload: ApiHealthResponse = {
    status: "ok",
    service: "api",
    timestamp: new Date().toISOString(),
    scope: "foundation-only"
  };

  res.json(payload);
});

export default router;
