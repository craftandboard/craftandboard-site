export const COST_PROFILE_STATUSES = ["ACTIVE", "ARCHIVED"] as const;
export const SHELF_COST_EDGE_BAND_PATTERNS = [
  "NONE",
  "LONG_EDGES",
  "SHORT_EDGES",
  "ALL_FOUR"
] as const;
export const COST_SCENARIO_STATUSES = ["ACTIVE", "ARCHIVED"] as const;
export const LAUNCH_STRATEGIES = ["BALANCED", "AGGRESSIVE", "SAFER_MARGIN"] as const;
export const LAUNCH_RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export const LISTING_READINESS_STATUSES = ["READY", "NEEDS_REVIEW", "BLOCKED"] as const;
export const LISTING_PREP_PACKAGE_STATUSES = [
  "DRAFT",
  "READY_FOR_REVIEW",
  "READY",
  "APPROVED",
  "APPROVED_WITH_OVERRIDE",
  "BLOCKED",
  "ARCHIVED"
] as const;
export const CHANNEL_MAPPING_CHANNEL_CODES = ["AMAZON_MANUAL"] as const;
export const ARTIFACT_SUPERSESSION_STATUSES = [
  "CURRENT_COMPLETED",
  "SUPERSEDED_COMPLETED",
  "COMPLETED_NO_REPLACEMENT",
  "HISTORICAL"
] as const;
export const ENTRY_COMPLETION_STATES = [
  "ENTRY_READY",
  "ENTRY_IN_PROGRESS",
  "ENTRY_COMPLETE",
  "ENTRY_COMPLETE_WITH_OVERRIDE",
  "ENTRY_BLOCKED"
] as const;

export type CostProfileStatus = (typeof COST_PROFILE_STATUSES)[number];
export type ShelfCostEdgeBandPattern = (typeof SHELF_COST_EDGE_BAND_PATTERNS)[number];
export type CostScenarioStatus = (typeof COST_SCENARIO_STATUSES)[number];
export type LaunchStrategy = (typeof LAUNCH_STRATEGIES)[number];
export type LaunchRiskLevel = (typeof LAUNCH_RISK_LEVELS)[number];
export type ListingReadinessStatus = (typeof LISTING_READINESS_STATUSES)[number];
export type ListingPrepPackageStatus = (typeof LISTING_PREP_PACKAGE_STATUSES)[number];
export type ChannelMappingChannelCode = (typeof CHANNEL_MAPPING_CHANNEL_CODES)[number];
export type ArtifactSupersessionStatus = (typeof ARTIFACT_SUPERSESSION_STATUSES)[number];
export type EntryCompletionState = (typeof ENTRY_COMPLETION_STATES)[number];
