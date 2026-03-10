import type { Request } from "express";
import { assertCapability } from "../../lib/authorization.js";
import { getRequestContext } from "../../lib/requestContext.js";

export function getProposalAcceptanceIntakeReadContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "proposal_acceptance_intake_read");
  return context;
}

export function getProposalAcceptanceIntakeWriteContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "proposal_acceptance_intake_write");
  return context;
}
