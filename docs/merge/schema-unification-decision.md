# Schema Unification Decision

| Legacy / Alternate Entity | Canonical Entity | Current Usage | Branch Action | Future Plan | Notes |
| --- | --- | --- | --- | --- | --- |
| `Order` | `SalesOrder` | legacy configurator, Amazon persistence, fulfillment, old ops flows | `KEEP TEMPORARILY` | `DEPRECATE` | Added bridge field from `Order` to `SalesOrder` |
| `OrderItem` | `SalesOrderItem` | legacy import/configurator/fulfillment paths | `KEEP TEMPORARILY` | `DEPRECATE` | Added bridge field from `OrderItem` to `SalesOrderItem` |
| `Part` | `ManufacturingPart` | legacy batching, fulfillment, older scan/container logic | `KEEP TEMPORARILY` | `DEPRECATE` | Added bridge field from `Part` to `ManufacturingPart` |
| `Batch` | `ManufacturingBatch` | legacy batching/CNC/export/fulfillment path | `KEEP TEMPORARILY` | `DEPRECATE` | Added bridge field from `Batch` to `ManufacturingBatch` |
| `ManufacturingJob` | `ShelfJob` for intake-to-production intent, with `ManufacturingJob` retained as transitional execution bridge | configurator, Amazon, stage-signal and legacy part linkage | `ALIAS / ADAPT` | `REFACTOR` | Added optional bridge field from `ManufacturingJob` to `ShelfJob` |
| duplicate settings/config usage through `LOCAL_ORG_ID` defaults | org-aware `Organization` + `OrgSettings` + request context | mixed across legacy modules | `KEEP TEMPORARILY` | `REFACTOR` | tenant bootstrap branch already added `OrgSettings`; service defaults still transitional |
| older manufacturing-run concepts embedded in legacy `Batch` and `Part` flows | `ManufacturingBatch` + `ManufacturingPart` | active but split by flow | `BACKFILL` | `REFACTOR` | New work should target canonical models first |

## Branch Decision
- canonical intake uses `SalesOrder` and `SalesOrderItem`
- canonical normalized manufacturing intent uses `ShelfJob`
- canonical execution-unit and execution-batch models use `ManufacturingPart` and `ManufacturingBatch`
- legacy models remain operational compatibility layers until import migration and downstream manufacturing migration are complete
