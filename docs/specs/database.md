# Database Foundation

The Prisma schema is still intentionally lightweight, but it now supports the first real local workflow: importing shelf orders, normalizing dimensions, and expanding quantity into physical part instances.

## Current models

- `Organization`, `User`
- `Order`, `OrderItem`, `Shipment`
- `Part` as the physical part-instance record for imported shelf pieces
- `Batch`, `Sheet`, `SheetPlacement`, `CncJob`
- `Station`, `ScanEvent`
- `Artifact`

## Relation overview

- Organizations own users, orders, batches, and stations.
- Orders contain order items, shipments, and imported raw payload context.
- Order items store normalized material, dimensions, thickness, and edge-band data.
- Order items expand into physical `Part` rows, one per piece.
- Parts can be assigned to batches and placed onto sheets.
- Sheets belong to batches and hold placements.
- Stations emit scan events.
- Artifacts can attach to orders, batches, sheets, CNC jobs, and shipments.

## Workflow-specific fields

- Orders now store external IDs, Amazon IDs, order dates, ship-by dates, customer full names, customer last names, and raw payload snapshots.
- Order items store normalized width/depth/thickness in inches, product labels, and edge-band patterns.
- Parts store deterministic part codes, QR payload placeholders, instance numbers, ship-by dates, customer last names, and dimensions for fast reporting/export queries.

This schema is a foundation only. Cardinality, indexing, tenant policies, and operational attributes will evolve as workflow specs are added.
