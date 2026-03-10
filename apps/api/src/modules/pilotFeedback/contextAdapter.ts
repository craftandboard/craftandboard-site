import type { Request } from "express";
import { assertCapability } from "../../lib/authorization.js";
import { getRequestContext } from "../../lib/requestContext.js";

export function getPilotFeedbackReadContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "pilot_feedback_read");
  return context;
}

export function getPilotFeedbackWriteContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "pilot_feedback_write");
  return context;
}
