import type { ApiRequestContext } from "./requestContext.js";

export type ApiCapability =
  | "org_member_read"
  | "org_member_manage"
  | "machine_read"
  | "machine_manage"
  | "stage_signal_read"
  | "stage_signal_manage"
  | "trusted_auto_apply_read"
  | "trusted_auto_apply_manage"
  | "remnant_read"
  | "remnant_manage"
  | "fixture_import"
  | "create_job"
  | "batch_build"
  | "batch_nest"
  | "artifact_generate"
  | "shipping_admin"
  | "batch_read"
  | "container_sorting"
  | "station_read"
  | "part_transition"
  | "completed_work_read";

const CAPABILITY_ROLES: Record<ApiCapability, Array<ApiRequestContext["membership"]["role"]>> = {
  org_member_read: ["OWNER", "ADMIN"],
  org_member_manage: ["OWNER"],
  machine_read: ["OWNER", "ADMIN", "OPERATOR"],
  machine_manage: ["OWNER", "ADMIN"],
  stage_signal_read: ["OWNER", "ADMIN", "OPERATOR"],
  stage_signal_manage: ["OWNER", "ADMIN"],
  trusted_auto_apply_read: ["OWNER", "ADMIN"],
  trusted_auto_apply_manage: ["OWNER", "ADMIN"],
  remnant_read: ["OWNER", "ADMIN", "OPERATOR"],
  remnant_manage: ["OWNER", "ADMIN", "OPERATOR"],
  fixture_import: ["OWNER", "ADMIN"],
  create_job: ["OWNER", "ADMIN"],
  batch_build: ["OWNER", "ADMIN"],
  batch_nest: ["OWNER", "ADMIN"],
  artifact_generate: ["OWNER", "ADMIN"],
  shipping_admin: ["OWNER", "ADMIN"],
  batch_read: ["OWNER", "ADMIN", "OPERATOR"],
  container_sorting: ["OWNER", "ADMIN", "OPERATOR"],
  station_read: ["OWNER", "ADMIN", "OPERATOR"],
  part_transition: ["OWNER", "ADMIN", "OPERATOR"],
  completed_work_read: ["OWNER", "ADMIN", "OPERATOR"]
};

const CAPABILITY_LABELS: Record<ApiCapability, string> = {
  org_member_read: "organization member access",
  org_member_manage: "organization member management",
  machine_read: "machine diagnostic access",
  machine_manage: "machine management",
  stage_signal_read: "stage candidate signal access",
  stage_signal_manage: "stage candidate signal review",
  trusted_auto_apply_read: "trusted auto-apply rule access",
  trusted_auto_apply_manage: "trusted auto-apply rule management",
  remnant_read: "remnant access",
  remnant_manage: "remnant management",
  fixture_import: "fixture import",
  create_job: "job creation",
  batch_build: "batch build",
  batch_nest: "batch nesting",
  artifact_generate: "artifact generation",
  shipping_admin: "shipping administration",
  batch_read: "batch inspection",
  container_sorting: "container sorting",
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
