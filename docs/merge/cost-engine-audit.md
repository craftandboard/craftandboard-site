# Cost Engine Audit

## Existing costing-related models and services found
- `CostProfile`, `CostRate`, `CostScenario` already provide org-scoped cost assumptions and scenario snapshots.
- `ProductionAssumptionProfile`, `PackagingProfile`, and `PricingPolicy` already provide reusable operational inputs for shelf pricing.
- `ShelfJob`, `SalesOrder`, and `SalesOrderItem` now form the canonical intake path for costable shelf work.
- Existing calculators:
  - `apps/api/src/modules/costing/calculator.ts`
  - `apps/api/src/modules/pricing/calculator.ts`

## Reusable inputs already present
- Material dimensions and quantity from `ShelfJob.normalizedSpecJson`
- Cost rates from `CostRate`
- Production timing from `ProductionAssumptionProfile`
- Packaging component costs from `PackagingProfile`
- Policy-level markup and floor logic from `PricingPolicy`
- Material sheet sizes from `MaterialProfile`

## Missing inputs required for baseline shelf costing
- Persisted canonical cost estimates tied to `ShelfJob` and `SalesOrder`
- Order-level rollup persistence for canonical orders
- Stable API endpoints to compute and fetch latest cost estimates for canonical entities

## Recommended canonical costing entities
- Inputs:
  - `SalesOrder`
  - `SalesOrderItem`
  - `ShelfJob`
- Configuration:
  - `CostProfile`
  - `CostRate`
  - `ProductionAssumptionProfile`
  - `PackagingProfile`
  - `PricingPolicy`
- Results:
  - `ShelfCostEstimate`
  - `OrderCostEstimate`

## Branch implementation plan
1. Reuse existing pricing and costing profiles instead of creating duplicate abstractions.
2. Add persisted estimate records tied to canonical entities.
3. Build shelf-job and sales-order estimate services around existing pricing/costing calculators.
4. Expose a minimal backend route surface for recompute/read.
5. Keep Craft & Board starter assumptions in bootstrap seeding and document which numbers still need validation.
