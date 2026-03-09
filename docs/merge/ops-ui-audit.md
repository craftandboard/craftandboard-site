# Ops UI Audit

## Current Frontend Routes And Pages Found
- `/`
- `/orders`
- `/orders/[id]`
- `/manufacturing`
- `/machines`
- `/machine-events`
- `/remnants`
- `/settings`
- `/material-forecast`
- `/batches`
- `/stations`
- `/stage-signals`
- `/trusted-auto-apply`
- `/labels`
- `/production`

## Screens Already Usable
- Machines and machine-event diagnostics
- Remnant catalog
- Stage-signal review
- Trusted auto-apply rules
- Station views
- Batch and label utilities

## Screens Still Legacy Or Transitional
- `/orders` and `/orders/[id]` were still centered on older Amazon and legacy order entities
- `/manufacturing` was still bundle-oriented and legacy-production heavy
- dashboard copy still described the app as a scaffold rather than an operations surface
- navigation mixed canonical and legacy/transitional tools without clear grouping

## Missing Screens Needed For Ops Baseline
- canonical costing surface
- canonical parts-and-scans surface
- unified inventory surface for containers plus remnants
- canonical dashboard overview tying orders, manufacturing, telemetry, scans, and inventory together

## Recommended Unified Nav Structure
- Dashboard
- Orders
- Manufacturing
- Parts & Scans
- Costing
- Machines
- Inventory
- Settings

Secondary transitional tools should remain accessible but grouped separately:
- Forecast
- Remnants
- Machine Events
- Signals
- Auto-Apply
- Labels
- Batches
- Stations
- Legacy Production
- Configurator

## Branch Implementation Plan
1. Stabilize stacked repo state before UI edits.
2. Add grouped ops navigation.
3. Replace dashboard with canonical operational overview.
4. Refocus orders and manufacturing pages around canonical entities.
5. Add costing, parts/scans, and inventory pages.
6. Keep legacy/transitional screens available but secondary.
