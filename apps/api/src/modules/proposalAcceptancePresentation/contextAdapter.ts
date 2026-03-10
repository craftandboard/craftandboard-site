import type { Request } from "express";
import { assertCapability } from "../../lib/authorization.js";
import { getRequestContext } from "../../lib/requestContext.js";

export function getProposalAcceptancePresentationReadContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "proposal_acceptance_presentation_read");
  return context;
}
