import { Router } from "express";
import { listBatches } from "../modules/batches/service.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    scope: "foundation-only",
    batches: listBatches()
  });
});

router.post("/build", (_req, res) => {
  res.status(202).json({
    status: "accepted",
    scope: "foundation-only",
    message: "Batch build is not implemented yet."
  });
});

export default router;
