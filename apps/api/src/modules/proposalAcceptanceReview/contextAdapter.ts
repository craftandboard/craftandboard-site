import type { Request } from "express";
import { assertCapability } from "../../lib/authorization.js";
import { getRequestContext } from "../../lib/requestContext.js";

export function getProposalAcceptanceReviewReadContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "proposal_acceptance_review_read");
  return context;
}
