import type { ApiRequestContext } from "./requestContext.js";

export type ApiCapability =
  | "org_member_read"
  | "org_member_manage"
  | "fixture_import"
  | "create_job"
  | "batch_build"
  | "batch_nest"
  | "artifact_generate"
  | "shipping_admin"
  | "batch_read"
  | "station_read"
  | "part_transition"
  | "completed_work_read";

const CAPABILITY_ROLES: Record<ApiCapability, Array<ApiRequestContext["membership"]["role"]>> = {
  org_member_read: ["OWNER", "ADMIN"],
  org_member_manage: ["OWNER"],
  fixture_import: ["OWNER", "ADMIN"],
  create_job: ["OWNER", "ADMIN"],
  batch_build: ["OWNER", "ADMIN"],
  batch_nest: ["OWNER", "ADMIN"],
  artifact_generate: ["OWNER", "ADMIN"],
  shipping_admin: ["OWNER", "ADMIN"],
  batch_read: ["OWNER", "ADMIN", "OPERATOR"],
  station_read: ["OWNER", "ADMIN", "OPERATOR"],
  part_transition: ["OWNER", "ADMIN", "OPERATOR"],
  completed_work_read: ["OWNER", "ADMIN", "OPERATOR"]
};

const CAPABILITY_LABELS: Record<ApiCapability, string> = {
  org_member_read: "organization member access",
  org_member_manage: "organization member management",
  fixture_import: "fixture import",
  create_job: "job creation",
  batch_build: "batch build",
  batch_nest: "batch nesting",
  artifact_generate: "artifact generation",
  shipping_admin: "shipping administration",
  batch_read: "batch inspection",
  station_read: "station queue access",
  part_transition: "part transition",
  completed_work_read: "completed work access"
};

export class AuthorizationError extends Error {}

export function assertCapability(context: ApiRequestContext, capability: ApiCapability) {
  const allowedRoles = CAPABILITY_ROLES[capability];

  if (allowedRoles.includes(context.membership.role)) {
    return;
  }

  throw new AuthorizationError(
    `User ${context.currentUser.email} does not have permission to perform ${CAPABILITY_LABELS[capability]} in organization ${context.currentOrganization.slug}.`
  );
}
