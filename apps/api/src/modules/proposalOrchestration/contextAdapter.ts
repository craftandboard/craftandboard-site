import type { Request } from "express";
import { assertCapability } from "../../lib/authorization.js";
import { getRequestContext } from "../../lib/requestContext.js";

export function getProposalAcceptanceReadContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "proposal_acceptance_read");
  return context;
}

export function getProposalAcceptanceWriteContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "proposal_acceptance_write");
  return context;
}

export function getProposalConversionReadContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "proposal_conversion_read");
  return context;
}

export function getProposalConversionWriteContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "proposal_conversion_write");
  return context;
}
