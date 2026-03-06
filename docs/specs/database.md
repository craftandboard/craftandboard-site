# Database Foundation

The Prisma schema is intentionally lightweight and designed to compile cleanly while preserving the core manufacturing relationships the platform will need.

## Current models

- `Organization`, `User`
- `Order`, `OrderItem`, `Shipment`
- `Part`, `Batch`, `Sheet`, `SheetPlacement`, `CncJob`
- `Station`, `ScanEvent`
- `Artifact`

## Relation overview

- Organizations own users, orders, batches, and stations.
- Orders contain order items and shipments.
- Order items expand into parts.
- Parts can be assigned to batches and placed onto sheets.
- Sheets belong to batches and hold placements.
- Stations emit scan events.
- Artifacts can attach to orders, batches, sheets, CNC jobs, and shipments.

This schema is a foundation only. Cardinality, indexing, tenant policies, and operational attributes will evolve as workflow specs are added.
