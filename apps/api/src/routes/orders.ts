import { Router } from "express";
import { z } from "zod";
import { listOrders } from "../modules/orders/service.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    scope: "foundation-only",
    orders: listOrders()
  });
});

router.post("/import", (req, res) => {
  const schema = z.object({
    source: z.string().default("amazon-placeholder")
  });
  const body = schema.parse(req.body ?? {});

  res.status(202).json({
    status: "accepted",
    scope: "foundation-only",
    message: "Order import is a placeholder endpoint.",
    requestedSource: body.source
  });
});

export default router;
