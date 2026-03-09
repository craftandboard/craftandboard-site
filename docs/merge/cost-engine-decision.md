# Cost Engine Decision

## Cost input categories
- Material
- Edge band
- Glue / consumables
- Machine
- Labor
- Packaging
- Shipping
- Overhead
- Growth / margin

## Tenant-configurable assumptions
- `CostRate` remains the base store for material, machine, labor, shipping, overhead, and growth assumptions.
- `ProductionAssumptionProfile` remains the store for timing assumptions.
- `PackagingProfile` remains the store for packaging component costs.
- `PricingPolicy` remains the store for markup, floor, and rounding rules.

## Canonical calculation target entities
- Per-shelf: `ShelfJob`
- Per-order: `SalesOrder`
- Context lineage:
  - `SalesOrderItem`
  - optional future precision from `ManufacturingPacket` / `ManufacturingPart`

## Result storage strategy
- Persist `ShelfCostEstimate` as the latest current cost snapshot for a canonical `ShelfJob`.
- Persist `OrderCostEstimate` as the latest current rollup for a canonical `SalesOrder`.
- Store explicit JSON snapshots for:
  - normalized input
  - assumptions used
  - full breakdown result

## Deferred refinements
- Live carrier/shipping integration
- Inventory depletion against remnants/material stock
- More precise machine-time models from telemetry
- Full quoting UI
- Cross-tenant package extraction

## Input category mapping
| Input Category | Source Entity / Config | Required Now | Calculation Use | Deferred Notes |
| --- | --- | --- | --- | --- |
| material sheet cost | `CostRate.sheet_material_cost_per_sqft` + `MaterialProfile` | YES | area cost baseline | exact sheet nesting still deferred |
| material waste allowance | `CostRate.waste_percent` | YES | material uplift | remnant-aware depletion deferred |
| edge band cost | `CostRate.edge_band_cost_per_linear_ft` | YES | edge band subtotal | color/catalog precision can expand later |
| edge band waste allowance | current calculator + input LF | YES | edge band subtotal | more granular trim waste deferred |
| glue/consumables | `CostRate.glue_cost_per_linear_ft` | YES | consumables subtotal | chemical-specific inputs deferred |
| machine hourly/rate basis | `CostRate.*machine*` + `ProductionAssumptionProfile` | YES | machine subtotal | telemetry refinement deferred |
| machine time estimate | `ProductionAssumptionProfile` | YES | run/setup allocation | event-derived estimates deferred |
| labor hourly/rate basis | `CostRate.labor_cost_per_min` | YES | labor subtotal | role-based labor classes deferred |
| labor time estimate | `ProductionAssumptionProfile` | YES | labor subtotal | station-level detail deferred |
| packaging component costs | `PackagingProfile` | YES | packaging subtotal | carton optimization deferred |
| shipping estimate/allocation | `CostRate.shipping_allowance_*` | YES | shipping subtotal | carrier integration deferred |
| overhead factor | `CostRate.overhead_percent` | YES | overhead subtotal | richer allocation methods deferred |
| growth/margin factor | `CostRate.growth_margin_percent` + `PricingPolicy` | YES | reserve/target charge | final customer quoting policy deferred |
