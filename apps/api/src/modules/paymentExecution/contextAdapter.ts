import type { Request } from "express";
import { assertCapability } from "../../lib/authorization.js";
import { getRequestContext } from "../../lib/requestContext.js";

export function getPaymentExecutionReadContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "payment_execution_read");
  return context;
}

export function getPaymentExecutionWriteContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "payment_execution_write");
  return context;
}

export function getPaymentEventReadContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "payment_event_read");
  return context;
}

export function getPaymentEventWriteContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "payment_event_write");
  return context;
}
