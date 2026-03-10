import type { Request } from "express";
import { assertCapability } from "../../lib/authorization.js";
import { getRequestContext } from "../../lib/requestContext.js";

export function getDepositReadContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "deposit_read");
  return context;
}

export function getDepositWriteContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "deposit_write");
  return context;
}

export function getPaymentReadContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "payment_read");
  return context;
}

export function getPaymentWriteContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "payment_write");
  return context;
}
