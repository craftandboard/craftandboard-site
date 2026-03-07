import cors from "cors";
import express from "express";
import configuratorRouter from "./routes/configurator.js";
import healthRouter from "./routes/health.js";
import labelsRouter from "./routes/labels.js";
import manufacturingRouter from "./routes/manufacturing.js";
import ordersRouter from "./routes/orders.js";
import batchesRouter from "./routes/batches.js";
import productionRouter from "./routes/production.js";
import reportsRouter from "./routes/reports.js";
import stationsRouter from "./routes/stations.js";
import { logger } from "./lib/logger.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: ["http://localhost:3000"],
      credentials: false
    })
  );
  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/labels", labelsRouter);
  app.use("/manufacturing", manufacturingRouter);
  app.use("/configurator", configuratorRouter);
  app.use("/orders", ordersRouter);
  app.use("/batches", batchesRouter);
  app.use("/stations", stationsRouter);
  app.use("/production", productionRouter);
  app.use("/reports", reportsRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error("Unhandled request error", err);
    res.status(500).json({
      status: "error",
      scope: "foundation-only",
      message: "Unexpected API error."
    });
  });

  return app;
}
