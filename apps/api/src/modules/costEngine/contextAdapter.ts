import type { Request } from "express";
import { assertCapability } from "../../lib/authorization.js";
import { getRequestContext } from "../../lib/requestContext.js";

export function getCostProfileReadContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "cost_profile_read");
  return context;
}

export function getCostProfileWriteContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "cost_profile_write");
  return context;
}

export function getCostCalculationReadContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "cost_calculation_read");
  return context;
}

export function getCostCalculationWriteContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "cost_calculation_write");
  return context;
}
