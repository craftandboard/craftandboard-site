export const COST_RATE_KEYS = [
  "sheet_material_cost_per_sqft",
  "sheet_material_cost_per_sheet",
  "edge_band_cost_per_linear_ft",
  "glue_cost_per_linear_ft",
  "cnc_machine_cost_per_min",
  "edgebander_cost_per_min",
  "labor_cost_per_min",
  "packaging_cost_per_unit",
  "packaging_cost_per_order",
  "shipping_allowance_per_unit",
  "shipping_allowance_per_order",
  "overhead_percent",
  "growth_margin_percent",
  "waste_percent",
  "setup_minutes_per_run",
  "handling_minutes_per_unit",
  "packaging_minutes_per_unit",
  "cnc_minutes_per_sqft",
  "edgebander_minutes_per_linear_ft"
] as const;

export const COSTING_EDGE_BAND_PATTERNS = [
  "NONE",
  "ONE_LONG_EDGE",
  "TWO_LONG_EDGES",
  "TWO_SHORT_EDGES",
  "ALL_FOUR"
] as const;

export const COST_SCENARIO_SOURCE_TYPES = [
  "MANUAL",
  "CONFIGURATOR",
  "ORDER",
  "BATCH",
  "FORECAST"
] as const;

export const COSTING_CURRENCIES = ["USD"] as const;

export type CostRateKey = (typeof COST_RATE_KEYS)[number];
export type CostingEdgeBandPattern = (typeof COSTING_EDGE_BAND_PATTERNS)[number];
export type CostScenarioSourceType = (typeof COST_SCENARIO_SOURCE_TYPES)[number];
export type CostingCurrency = (typeof COSTING_CURRENCIES)[number];
