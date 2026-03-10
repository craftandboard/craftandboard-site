import type { ApiRequestContext } from "./requestContext.js";

export type ApiCapability =
  | "org_member_read"
  | "org_member_manage"
  | "project_read"
  | "project_write"
  | "lead_read"
  | "lead_write"
  | "proposal_read"
  | "proposal_write"
  | "deposit_read"
  | "deposit_write"
  | "payment_read"
  | "payment_write"
  | "payment_execution_read"
  | "payment_execution_write"
  | "payment_event_read"
  | "payment_event_write"
  | "work_module_read"
  | "work_module_write"
  | "project_task_write"
  | "costing_read"
  | "costing_manage"
  | "pricing_read"
  | "pricing_manage"
  | "order_intake_read"
  | "order_intake_manage"
  | "manufacturing_expansion_read"
  | "manufacturing_expansion_manage"
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
  project_read: ["OWNER", "ADMIN"],
  project_write: ["OWNER", "ADMIN"],
  lead_read: ["OWNER", "ADMIN"],
  lead_write: ["OWNER", "ADMIN"],
  proposal_read: ["OWNER", "ADMIN"],
  proposal_write: ["OWNER", "ADMIN"],
  deposit_read: ["OWNER", "ADMIN"],
  deposit_write: ["OWNER", "ADMIN"],
  payment_read: ["OWNER", "ADMIN"],
  payment_write: ["OWNER", "ADMIN"],
  payment_execution_read: ["OWNER", "ADMIN"],
  payment_execution_write: ["OWNER", "ADMIN"],
  payment_event_read: ["OWNER", "ADMIN"],
  payment_event_write: ["OWNER", "ADMIN"],
  work_module_read: ["OWNER", "ADMIN"],
  work_module_write: ["OWNER", "ADMIN"],
  project_task_write: ["OWNER", "ADMIN"],
  costing_read: ["OWNER", "ADMIN"],
  costing_manage: ["OWNER", "ADMIN"],
  pricing_read: ["OWNER", "ADMIN"],
  pricing_manage: ["OWNER", "ADMIN"],
  order_intake_read: ["OWNER", "ADMIN"],
  order_intake_manage: ["OWNER", "ADMIN"],
  manufacturing_expansion_read: ["OWNER", "ADMIN"],
  manufacturing_expansion_manage: ["OWNER", "ADMIN"],
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
  project_read: "project access",
  project_write: "project management",
  lead_read: "lead access",
  lead_write: "lead management",
  proposal_read: "proposal access",
  proposal_write: "proposal management",
  deposit_read: "deposit request access",
  deposit_write: "deposit request management",
  payment_read: "payment access",
  payment_write: "payment management",
  payment_execution_read: "payment execution access",
  payment_execution_write: "payment execution management",
  payment_event_read: "payment provider event access",
  payment_event_write: "payment provider event management",
  work_module_read: "work module access",
  work_module_write: "work module management",
  project_task_write: "project task management",
  costing_read: "costing access",
  costing_manage: "costing management",
  pricing_read: "pricing access",
  pricing_manage: "pricing management",
  order_intake_read: "order intake access",
  order_intake_manage: "order intake management",
  manufacturing_expansion_read: "manufacturing expansion access",
  manufacturing_expansion_manage: "manufacturing expansion management",
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
