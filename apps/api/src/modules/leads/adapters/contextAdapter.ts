import type { Request } from "express";
import { assertCapability } from "../../../lib/authorization.js";
import { getRequestContext } from "../../../lib/requestContext.js";

export function getLeadReadContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "lead_read");
  return context;
}

export function getProposalReadContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "proposal_read");
  return context;
}

export function getLeadWriteContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "lead_write");
  return context;
}

export function getProposalWriteContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "proposal_write");
  return context;
}
