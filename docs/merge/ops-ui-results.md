# Ops UI Unification Results

## Screens And Routes Audited
- dashboard
- orders
- manufacturing
- machines
- machine events
- remnants
- settings
- forecast
- batches
- stations
- stage signals
- trusted auto-apply

## Nav Structure Implemented
Primary operations navigation:
- Dashboard
- Orders
- Manufacturing
- Parts & Scans
- Costing
- Machines
- Inventory
- Settings

Transitional tools kept as secondary links:
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

## Canonical Entities Surfaced
- `SalesOrder`
- `SalesOrderItem`
- `ShelfJob`
- `ManufacturingPacket`
- `ManufacturingBatch`
- `ManufacturingPart`
- persisted order and shelf-job cost estimates

## Costing UI Added
- `/costing`
- order-level estimate view
- shelf-job estimate view
- recompute actions for persisted estimates

## Telemetry / Manufacturing / Scan / Container Visibility Added
- dashboard summary cards and recent operational activity
- canonical manufacturing overview on `/manufacturing`
- machine stage candidates added to `/machines`
- new `/parts-scans` surface for manufacturing parts, scan events, and workflow rules
- new `/inventory` surface for containers, active sessions, and remnant inventory

## Transitional Legacy Surfaces Still Remaining
- legacy production bundle flow
- stage signals and trusted auto-apply remain separate tools
- remnants still have their own dedicated page in addition to inventory summary
- older order/manufacturing compatibility paths still exist behind the canonical screens

## Deferred UI Refinements
- richer order detail summaries with direct packet and batch links
- dedicated shelf-job detail route
- container assignment actions from the UI
- richer telemetry filters and detail drilldown
- more complete settings administration

## Exact Recommendation For Next Branch
- `chore/deploy-vercel-railway-wireup`
