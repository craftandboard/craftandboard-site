# Schema Unification Audit

## Overlapping Entities Found

### Orders and Intake
- Legacy:
  - `Order`
  - `OrderItem`
- Newer:
  - `SalesOrder`
  - `SalesOrderItem`

### Manufacturing Execution
- Legacy:
  - `Part`
  - `Batch`
  - `ManufacturingJob`
- Newer:
  - `ManufacturingPart`
  - `ManufacturingBatch`
  - `ShelfJob`
  - `ManufacturingPacket`

## Where Each Is Referenced

### Legacy `Order` / `OrderItem`
- active in:
  - configurator persistence
  - Amazon persistence
  - legacy fulfillment/shipping
  - legacy edge-band/material forecast helpers
  - legacy batch/container flows
- evidence:
  - [configurator/service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/configurator/service.ts)
  - [amazonImport/persistence.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/amazonImport/persistence.ts)
  - [orders/service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/orders/service.ts)
  - [batches/service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/batches/service.ts)
  - [containers/service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/containers/service.ts)

### `SalesOrder` / `SalesOrderItem`
- active in:
  - shelf order intake
  - pricing validation
  - manufacturing packet creation
  - manufacturing expansion
- evidence:
  - [orderIntake/service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/orderIntake/service.ts)
  - [manufacturingExpansion/service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/manufacturingExpansion/service.ts)

### Legacy `Part` / `Batch`
- active in:
  - legacy batching
  - legacy container flow
  - legacy stage/parts progression
  - order fulfillment PDFs
  - some forecast/edge-band helpers
- evidence:
  - [parts/service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/parts/service.ts)
  - [batches/service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/batches/service.ts)
  - [orders/service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/orders/service.ts)

### `ManufacturingPart` / `ManufacturingBatch`
- active in:
  - manufacturing expansion
  - part label payload/rendering
  - scanning workflow
  - machine telemetry linker
  - container sorting workflow
- evidence:
  - [manufacturingExpansion/service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/manufacturingExpansion/service.ts)
  - [labels/service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/labels/service.ts)
  - [scanning/service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/scanning/service.ts)
  - [machineTelemetry/linker.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/machineTelemetry/linker.ts)
  - [containers/workflowService.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/containers/workflowService.ts)

### `ManufacturingJob`
- active in:
  - configurator
  - Amazon persistence
  - legacy part linkage
  - stage signals / machine events
- evidence:
  - [configurator/service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/configurator/service.ts)
  - [amazonImport/persistence.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/amazonImport/persistence.ts)
  - [stageSignals/service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/stageSignals/service.ts)
  - [machines/service.ts](/Users/brandon/Projects/craft-and-board/apps/api/src/modules/machines/service.ts)

## Recommended Canonical Entities
- intake order:
  - `SalesOrder`
- intake line:
  - `SalesOrderItem`
- normalized production-intent record:
  - `ShelfJob`
- packet handoff:
  - `ManufacturingPacket`
- produced execution unit:
  - `ManufacturingPart`
- execution grouping:
  - `ManufacturingBatch`

## Transitional / Compatibility Entities
- `Order`
- `OrderItem`
- `Part`
- `Batch`
- `ManufacturingJob`

These remain active because current configurator, Amazon, fulfillment, and some legacy batching flows still depend on them.

## Migration Risk Notes
- legacy and newer models are both live in production paths
- destructive rename/removal would break current routes and tests
- `ManufacturingJob` still bridges several legacy flows and cannot be dropped safely in this branch
- old and new manufacturing unit models (`Part` vs `ManufacturingPart`) must coexist temporarily until import migration and schema unification proceed further

## Implementation Plan Chosen For This Branch
1. document canonical direction explicitly
2. add non-destructive bridge relations between legacy and canonical entities
3. keep runtime behavior stable
4. leave heavier migration of imports/configurator/fulfillment to later branches
