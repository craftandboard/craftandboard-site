# Hugo Shelf Cost Calculator Plan

## Scope Added
- Internal `/cost-calculator` page
- Target-owned `/cost-profiles` and `/cost-calculations` API routes
- Org-scoped cost profiles with reusable shelf assumptions
- Material, edge band, packaging, and shipping rule tables
- Saved shelf cost calculations with assumption and result snapshots

## Core Formulas
- Material cost:
  - required area sq ft = `(lengthIn * depthIn * quantity) / 144`
  - sheet area sq ft = `(sheetLengthIn * sheetWidthIn) / 144`
  - effective required area = `required area * (1 + wastePct)`
  - effective sheet yield = `sheet area * usableYieldPct`
  - material cost = `effective required area / effective sheet yield * sheetCostCents`
- Edge band cost:
  - long edges = `2 * lengthIn * quantity / 12`
  - short edges = `2 * depthIn * quantity / 12`
  - effective linear feet = `(pattern footage * (1 + wastePct)) + setupAllowanceLinearFt`
  - edge band cost = `effective linear feet * costCentsPerLinearFoot`
- Labor cost:
  - `laborMinutes / 60 * defaultLaborRateCentsPerHour`
- Machine cost:
  - `machineMinutes / 60 * defaultMachineRateCentsPerHour`
- Overhead cost:
  - `overheadMinutes / 60 * defaultOverheadRateCentsPerHour`
  - if overhead minutes are not provided, the UI sends an explicit value
- Packaging cost:
  - additive sum of box, bubble wrap, tape, label, insert, shrink wrap, and other packaging costs
- Shipping cost:
  - `flatOverride` if present
  - otherwise `defaultShippingAllowance + baseCost + per-pound + per-cubic-inch adders`
- Recommended internal price:
  - `subtotalCost / (1 - targetMarginPct)`
- Recommended sell price:
  - `recommendedInternalPrice / (1 - growthMarginPct)`

## Assumption Categories Supported
- Material sheet cost and yield
- Edge band cost and waste
- Labor rate
- Machine rate
- Overhead rate
- Packaging allowances
- Shipping allowances
- Target margin
- Growth margin

## Routes Added
- `POST /cost-profiles`
- `GET /cost-profiles`
- `GET /cost-profiles/:costProfileId`
- `PATCH /cost-profiles/:costProfileId`
- `POST /cost-profiles/:costProfileId/material-rules`
- `PATCH /material-rules/:materialRuleId`
- `POST /cost-profiles/:costProfileId/edge-band-rules`
- `PATCH /edge-band-rules/:edgeBandRuleId`
- `POST /cost-profiles/:costProfileId/packaging-rules`
- `PATCH /packaging-rules/:packagingRuleId`
- `POST /cost-profiles/:costProfileId/shipping-rules`
- `PATCH /shipping-rules/:shippingRuleId`
- `POST /cost-calculations/calculate`
- `POST /cost-calculations`
- `GET /cost-calculations`
- `GET /cost-calculations/:calculationId`

## UI Added
- `/cost-calculator`
  - profile selector
  - shelf spec form
  - assumptions panel
  - breakdown card
  - history list
  - pragmatic profile/rule editor

## Out Of Scope
- Amazon Seller Central integration
- Listing automation or repricing
- Remnant-aware optimization
- Purchasing or POs
- Inventory replenishment
- CNC generation
- Production scheduling
- Shipping label buying
- Advanced analytics/reporting

## Next Phase Recommendation
- Add profile/rule editing polish plus a second pass on Amazon-specific shipping and packaging assumptions before any Seller Central automation.
