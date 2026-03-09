# Import Migration Results

## Sources Audited
- Amazon fixture import
- normalized fixture/manual import
- canonical manual/admin shelf-order intake
- configurator manufacturing creation path

## Canonical Write Path Implemented
For new Craft & Board import writes in this branch:
- `SalesOrder`
- `SalesOrderItem`
- `ShelfJob`

These are now created first for:
- Amazon fixture import
- normalized fixture/manual import

Imported canonical items are normalized and priced using the existing pricing engine defaults where available, then converted into `ShelfJob` rows when valid.

## Compatibility Behavior Retained
The following compatibility dual-write remains in place, but is centralized in import persistence:
- linked `Order`
- linked `OrderItem`
- linked `ManufacturingJob`
- linked `Part`

Bridge fields populated:
- `Order.salesOrderId`
- `OrderItem.salesOrderItemId`
- `ManufacturingJob.shelfJobId`

## Legacy Write Paths Still Remaining
- configurator persistence remains legacy-first
- older fulfillment/order routes still read legacy `Order`
- older batching/manufacturing-job flows still rely on `ManufacturingJob`, `Part`, and `Batch`

## Tenant / Org Behavior Confirmed
- import writes continue to require org context
- imports use the Craft & Board bootstrap org via existing tenant bootstrap resolution
- no new hardcoded org lookup was introduced outside the existing bootstrap defaults

## Tests Added / Updated
- updated Amazon import persistence test to assert canonical-first writes plus compatibility rows
- added normalized-order import persistence test for canonical-first writes plus compatibility rows

## Remaining Follow-up Work
- migrate configurator persistence to canonical-first later
- retire legacy import-only assumptions after downstream consumers are updated
- move older fulfillment/order reporting onto canonical sales/manufacturing entities

## Exact Recommendation For Next Branch
- `feat/cost-engine-platform-module`
