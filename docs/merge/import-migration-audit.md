# Import Migration Audit

## Intake Sources Found
- Amazon fixture import via [service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/amazonImport/service.ts)
- Normalized fixture/manual import via [importFixtures.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/ordersImport/importFixtures.ts)
- Canonical manual/admin shelf-order intake via [service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/orderIntake/service.ts)
- Configurator manufacturing creation via [service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/configurator/service.ts)

## Current Persistence Flow By Source

### Amazon fixture import
- Normalization: [normalization.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/amazonImport/normalization.ts)
- Persistence before this branch:
  - `Order`
  - `OrderItem`
  - `ManufacturingJob`
  - `Part`
- Canonical entities were not primary write targets.

### Normalized fixture/manual import
- Normalization happens before persistence.
- Persistence before this branch:
  - `Order`
  - `OrderItem`
  - `Part`
- No canonical `SalesOrder`/`SalesOrderItem`/`ShelfJob` path.

### Manual/admin shelf-order intake
- Already canonical-first:
  - `SalesOrder`
  - `SalesOrderItem`
  - normalization/pricing state on canonical items
  - `ShelfJob`
  - `ManufacturingPacket`

### Configurator manufacturing path
- Still legacy-first:
  - `ManufacturingJob`
  - `Order`
  - `OrderItem`
  - `Part`
- Relevant, but not the target of this branch because it is not the main Craft & Board import pipeline.

## Legacy Entities Written Today
- `Order`
- `OrderItem`
- `Part`
- `Batch` indirectly downstream
- `ManufacturingJob`

## Canonical Entities Already Written Today
- `SalesOrder`
- `SalesOrderItem`
- `ShelfJob`
- `ManufacturingPacket`
- `ManufacturingPart`
- `ManufacturingBatch`

## Downstream Consumers Still Relying On Legacy
- legacy fulfillment/order routes
- older batching and manufacturing-job flows
- configurator persistence
- legacy Amazon/fixture import result shapes
- some reporting/compatibility selectors expecting `Order` / `OrderItem` / `Part` / `ManufacturingJob`

## Recommended Migration Action Per Source
- Amazon fixture import: switch to canonical-first, keep narrow compatibility dual-write
- Normalized fixture/manual import: switch to canonical-first, keep narrow compatibility dual-write
- Manual/admin shelf-order intake: keep canonical
- Configurator: keep legacy temporarily and defer to later branch

## Branch Implementation Plan
1. Keep manual/admin order intake untouched because it is already canonical.
2. Move Amazon import persistence to create:
   - `SalesOrder`
   - `SalesOrderItem`
   - priced `ShelfJob`
   first.
3. Preserve active downstream legacy behavior by creating linked:
   - `Order`
   - `OrderItem`
   - `ManufacturingJob`
   - `Part`
4. Move normalized fixture/manual import to the same canonical-first pattern.
5. Use existing bridge fields:
   - `Order.salesOrderId`
   - `OrderItem.salesOrderItemId`
   - `ManufacturingJob.shelfJobId`
6. Do not widen this branch into configurator migration or legacy-model retirement.
