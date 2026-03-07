import { Router } from "express";
import { z } from "zod";
import { buildShipBySummary, parseShipByDateParam } from "../modules/productionOutputs/service.js";

const router = Router();

const querySchema = z.object({
  shipByDate: z.string().min(1),
  materialCode: z.string().optional()
});

router.get("/ship-by-summary", async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const summary = await buildShipBySummary({
      shipByDate: parseShipByDateParam(query.shipByDate),
      materialCode: query.materialCode as never
    });

    res.json({ status: "ok", scope: "normalized-foundation", summary });
  } catch (error) {
    next(error);
  }
});

export default router;
