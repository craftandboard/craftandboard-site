# Cost Engine Results

## Audit summary
- Existing pricing/costing foundations were reusable and kept.
- Canonical entity targeting is now `ShelfJob` for per-shelf estimates and `SalesOrder` for per-order rollups.
- No duplicate cost-profile abstraction was introduced.

## Canonical costing model chosen
- Config:
  - `CostProfile`
  - `CostRate`
  - `ProductionAssumptionProfile`
  - `PackagingProfile`
  - `PricingPolicy`
- Inputs:
  - `SalesOrder`
  - `SalesOrderItem`
  - `ShelfJob`
- Results:
  - `ShelfCostEstimate`
  - `OrderCostEstimate`

## Schema/storage changes made
- Added enum `CostEstimateStatus`
- Added `ShelfCostEstimate`
- Added `OrderCostEstimate`
- Added reverse relations from canonical order/manufacturing/config models to those estimate tables

## Calculation logic implemented
- `recomputeShelfJobCostEstimate(...)`
  - resolves canonical shelf-job input
  - loads active tenant configuration
  - reuses the existing pricing/costing calculators
  - persists a current shelf estimate snapshot
- `recomputeSalesOrderCostEstimate(...)`
  - iterates canonical shelf jobs for an order
  - aggregates line-level cost totals
  - persists a current order rollup snapshot
- Read endpoints exist for latest persisted shelf-job and sales-order estimates.

## Craft & Board default profile created
- Reused existing Craft & Board bootstrap defaults from `ensureDefaultProfiles()`
- Starter assumptions remain seeded for:
  - material
  - edge band
  - glue/consumables
  - machine rates
  - labor
  - packaging
  - shipping
  - overhead
  - growth / margin

## API/service surface added
- `GET /costing/shelf-jobs/:id/estimate`
- `POST /costing/shelf-jobs/:id/estimate`
- `GET /costing/orders/:id/estimate`
- `POST /costing/orders/:id/estimate`

## Assumptions still needing confirmation
- Real Craft & Board material sheet costs
- Edge band by material/color assumptions
- Glue/consumables assumptions
- Actual machine runtime and labor timing assumptions
- Packaging component costs
- Shipping allowance policy
- Overhead and reserve/margin factors

## Deferred refinements
- Live shipping/carrier logic
- Inventory depletion
- Telemetry-driven costing
- UI-heavy quoting workflows
- Legacy-model retirement

## Exact next recommended branch
- `feat/ops-ui-unification`
