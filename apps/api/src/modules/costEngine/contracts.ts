export const COST_PROFILE_STATUSES = ["ACTIVE", "ARCHIVED"] as const;
export const SHELF_COST_EDGE_BAND_PATTERNS = [
  "NONE",
  "LONG_EDGES",
  "SHORT_EDGES",
  "ALL_FOUR"
] as const;
export const COST_SCENARIO_STATUSES = ["ACTIVE", "ARCHIVED"] as const;

export type CostProfileStatus = (typeof COST_PROFILE_STATUSES)[number];
export type ShelfCostEdgeBandPattern = (typeof SHELF_COST_EDGE_BAND_PATTERNS)[number];
export type CostScenarioStatus = (typeof COST_SCENARIO_STATUSES)[number];
