# Schema Unification Results

## Audit Summary
- overlap is real, not hypothetical
- both legacy and newer order/manufacturing models are active in runtime code
- newer intake/execution models already drive the stronger FieldMetriq direction
- legacy models still support important working routes and cannot be removed safely yet

## Canonical Entities Selected
- `SalesOrder`
- `SalesOrderItem`
- `ShelfJob`
- `ManufacturingPacket`
- `ManufacturingPart`
- `ManufacturingBatch`

Transitional:
- `Order`
- `OrderItem`
- `Part`
- `Batch`
- `ManufacturingJob`

## Schema Changes Made
Added additive bridge references:
- `Order.salesOrderId`
- `OrderItem.salesOrderItemId`
- `Part.manufacturingPartId`
- `Batch.manufacturingBatchId`
- `ManufacturingJob.shelfJobId`

Added corresponding one-to-one compatibility relations on:
- `SalesOrder`
- `SalesOrderItem`
- `ManufacturingPart`
- `ManufacturingBatch`
- `ShelfJob`

## Services / Routes Updated
- no broad controller or route rewrite was performed
- canonical preference already existed in key newer flows:
  - order intake
  - manufacturing expansion
  - label payloads for manufacturing parts
  - scan workflow for manufacturing parts
  - machine telemetry linking for manufacturing batch / manufacturing part / remnant

This branch intentionally leaves runtime behavior stable while making the canonical direction explicit in schema and docs.

## Data Backfills Performed
- none required in this branch
- bridge fields are nullable and additive
- existing Craft & Board data remains valid

## Legacy Concepts Still Present
- legacy order/part/batch flows remain active
- configurator and Amazon persistence still write primarily into legacy order/manufacturing models
- legacy fulfillment and some older batching/export helpers still read older models

## What Is Now Canonical For Future Branches
- new order-intake work should target `SalesOrder` and `SalesOrderItem`
- new production-unit work should target `ManufacturingPart`
- new execution-batch work should target `ManufacturingBatch`
- new transitional bridges should prefer compatibility links rather than creating new duplicate tables

## What Remains For Later Cleanup
- import migration into canonical order entities
- deeper convergence of configurator/Amazon flows
- eventual retirement of legacy `Order` / `OrderItem` / `Part` / `Batch`
- clearer long-term role of `ManufacturingJob` versus `ShelfJob`

## Recommended Next Branch
- `feat/craft-board-import-migration`

That branch should move import paths toward the canonical `SalesOrder` / `SalesOrderItem` direction while preserving Craft & Board continuity.
