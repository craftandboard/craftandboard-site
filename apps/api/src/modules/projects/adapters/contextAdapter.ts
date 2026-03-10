import type { Request } from "express";
import { assertCapability } from "../../../lib/authorization.js";
import { getRequestContext } from "../../../lib/requestContext.js";

export function getProjectReadContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "project_read");
  return context;
}

export function getWorkModuleReadContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "work_module_read");
  return context;
}

export function getProjectWriteContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "project_write");
  return context;
}

export function getWorkModuleWriteContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "work_module_write");
  return context;
}

export function getProjectTaskWriteContext(req: Request) {
  const context = getRequestContext(req);
  assertCapability(context, "project_task_write");
  return context;
}
