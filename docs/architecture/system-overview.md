# System Overview

Craft & Board is a pnpm monorepo for a cabinet-shelf manufacturing workflow. It takes shelf demand from configurator input and Amazon fixture imports, converts that demand into persisted manufacturing records, groups parts into production batches, generates floor artifacts, and drives station-level execution through packing and shipping.

This document is for engineers and maintainers who need to understand how the current system is assembled, where data lives, and which modules own each stage of the workflow.

## System Components

- `apps/web`
  - Next.js App Router application for operators and test harnesses.
  - Main UI surfaces: configurator test, orders, batches, manufacturing, labels, and station views.
- `apps/api`
  - Express API for the entire operational workflow.
  - Owns imports, configurator translation, job persistence, batching, nesting, packet generation, station queues, and shipping actions.
- `apps/worker`
  - Background-process entry point. The current repo keeps this lightweight, with Redis/no-op behavior when queue infrastructure is absent.
- `packages/shared`
  - Shared TypeScript contracts used across API and web.
- `prisma`
  - PostgreSQL schema and Prisma client generation.
- `generated-artifacts`
  - Runtime-generated printable PDFs and other file-based artifacts exposed through the API as static files.

## Runtime Topology

In local development, `pnpm dev` runs:

- web on `http://localhost:3000`
- api on `http://localhost:4000`
- worker in watch mode

The API is the central orchestrator. The web app mostly consumes API routes and renders current persisted state. PostgreSQL is the system of record. Generated packets and printable PDFs are tracked through `Artifact` rows and, for PDFs, backed by files under `generated-artifacts/`.

## API Modules

The API is organized by domain-oriented modules under `apps/api/src/modules`.

### Intake And Normalization

- `configurator/service.ts`
  - Validates shelf inputs.
  - Normalizes dimensions, material, thickness, edge banding, and channel.
  - Translates normalized input into a deterministic manufacturing part contract.
  - Persists configurator requests as `ManufacturingJob`, `Order`, `OrderItem`, and `Part`.
- `amazonImport/*`
  - Parses and normalizes Amazon fixture data.
  - Reuses the same manufacturing persistence path semantics used by configurator-created work.
  - Produces operationally compatible `Order`, `OrderItem`, `ManufacturingJob`, and `Part` rows.
- `ordersImport/*`
  - Legacy/fixture order import support for normalized order records and part expansion.

### Manufacturing Planning

- `batches/service.ts`
  - Builds batches from eligible persisted parts/jobs.
  - Generates batch detail read models.
  - Handles batch lifecycle transitions.
  - Generates label packets, CNC packets, label PDFs, and traveler PDFs.
- `nesting/*`
  - Deterministic sheet placement logic for the current foundation implementation.
  - Packs parts left-to-right, then row-by-row, then sheet-by-sheet.
- `cnc/*`
  - CNC formatting and post-processing helpers for manufacturing bundle flows.

### Manufacturing Outputs

- `labels/*`
  - Label rendering helpers and barcode utilities for legacy and current label outputs.
- `bundlePackets/*`
  - Versioned HTML packet generation for production bundle workflows.
- `sheetMaps/*`
  - Sheet map HTML/SVG generation for nested sheets.
- `batches/pdf.ts`
  - Deterministic PDF generation for batch label sheets and traveler documents.

### Execution And Status

- `parts/service.ts`
  - Part-level shop-floor transitions.
  - Supports updates by `partId`, `labelCode`, and `scanCode`.
  - Cascades completion into `ManufacturingJob` and `Order`.
- `stations/service.ts`
  - Station queue filtering for cutting, edgebanding, and packing.
- `orders/service.ts`
  - Order read models, completed-work queue, and shipping mutation.

### Legacy / Parallel Manufacturing Support

- `manufacturingJobs/*`
- `manufacturingLifecycle/*`
- `productionBundles/*`
- `productionOutputs/*`

These modules still support earlier production bundle flows and reporting surfaces. They coexist with the newer batch-based manufacturing path. Maintainers should treat batch-driven manufacturing as the current operational path for configurator and Amazon shelf work, while bundle-oriented modules remain useful for legacy exports and downstream compatibility.

## Database Schema Overview

The schema is defined in [`prisma/schema.prisma`](/Users/brandon/Projects/craft-and-board/prisma/schema.prisma).

### Core Business Records

- `Order`
  - Customer-facing demand record.
  - Current statuses include `READY_FOR_SHIPMENT` and `SHIPPED`.
  - Links to `OrderItem`, `Part`, `ManufacturingJob`, `Shipment`, and `Artifact`.
- `OrderItem`
  - Normalized item-level shelf request inside an order.
  - Stores dimensions, material, edge-banding metadata, and source payload fields.
- `Part`
  - Physical production unit.
  - Tracks dimensions, material, edge banding, shop-floor status, and `scanCode`.
  - Links to `Order`, `OrderItem`, `ManufacturingJob`, `Batch`, and `SheetPlacement`.
- `ManufacturingJob`
  - Manufacturing-level grouping for a requested shelf spec.
  - Current lifecycle includes `DRAFT` and `COMPLETE`.
  - Links to `Order`, `OrderItem`, `Part`, and `Batch`.

### Planning And Execution Records

- `Batch`
  - Material-specific grouping of eligible parts/jobs for production.
  - Current batch lifecycle: `DRAFT -> PLANNED -> RELEASED -> CUTTING -> CUT_COMPLETE -> READY_FOR_NEXT_STAGE`.
- `Sheet`
  - Persisted nested sheet layout for a batch.
- `SheetPlacement`
  - Part placement coordinates on a sheet.
- `Shipment`
  - Shipping/pickup fulfillment record associated with an order.

### Artifact Records

- `Artifact`
  - Cross-cutting metadata table for generated outputs.
  - Used for batch packets, PDFs, sheet maps, CNC files, and other current/superseded outputs.
  - Stores `type`, `uri`, `mimeType`, `version`, `isCurrent`, and generation lineage via `generatedFrom`.

## Manufacturing Pipeline

The current implemented manufacturing path is:

1. Demand intake
   - Configurator input or Amazon fixture import enters the API.
2. Validation and normalization
   - Dimensions, material, thickness, edge-banding, quantity, and channel are normalized.
3. Translation
   - The normalized shelf request becomes a deterministic manufacturing part contract.
4. Persistence
   - `ManufacturingJob`, `Order`, `OrderItem`, and `Part` rows are created.
   - Every part gets:
     - human-readable `labelCode`
     - globally unique `scanCode`
5. Batch build
   - Eligible draft jobs and unbatched parts are grouped by material into a `Batch`.
6. Nesting
   - Parts are placed onto persisted `Sheet` and `SheetPlacement` rows.
7. Artifact generation
   - CNC packet JSON
   - label packet JSON
   - label PDF
   - traveler PDF
8. Station execution
   - Cutting: pending -> cut
   - Edgebanding: cut -> edgebanded
   - Packing: edgebanded -> packed
9. Completion cascade
   - When all parts for a job are packed, `ManufacturingJob.status = COMPLETE`
   - When all jobs for an order are complete, `Order.status = READY_FOR_SHIPMENT`
10. Shipping
   - Shipping station consumes completed orders and marks them `SHIPPED`

## Artifact Generation

Artifact generation follows one pattern:

- generate structured payload from persisted records
- persist an `Artifact` row with `isCurrent = true`
- mark prior artifacts of the same type as superseded
- expose the artifact URI in API responses and the batch detail page

### Current Batch Artifact Types

- `batch-cnc-packet`
  - JSON-like CNC packet contract derived from persisted nested sheets.
- `batch-label-packet`
  - JSON label packet for floor identification and scanning.
- `batch-label-pdf`
  - Printable PDF label sheet generated from the current label packet.
- `batch-traveler-pdf`
  - Printable traveler/cut packet generated from batch summary, parts, and sheets.

### File-Backed Artifacts

PDF artifacts are written to:

- `generated-artifacts/batches/<batchId>/...`

The API serves them through:

- `/generated-artifacts/...`

The `Artifact.uri` field points at those served files so the web app can link to them directly.

## Station Workflows

Station views are intentionally narrower than the batch administration UI.

### Cutting

- Route: `/stations/cutting`
- Queue source: parts in batched pending states
- Scan action: `scanCode -> CUT`

### Edgebanding

- Route: `/stations/edgebanding`
- Queue source: parts with status `CUT`
- Scan action: `scanCode -> EDGEBANDED`

### Packing

- Route: `/stations/packing`
- Queue source: parts with status `EDGEBANDED`
- Scan action: `scanCode -> PACKED`

### Shipping

- Route: `/stations/shipping`
- Queue source: orders from `GET /orders/completed`
- Action: `POST /orders/:orderId/ship`

The station model is intentionally operator-focused:

- no batch administration controls
- no redesign-heavy UI
- no auth/permissions yet
- deterministic status-only behavior

## Data Lifecycle

### Part Lifecycle

1. Created from configurator or Amazon import
2. Assigned to a manufacturing job
3. Batched
4. Nested onto a sheet
5. Included in label/CNC/PDF artifacts
6. Processed through:
   - pending
   - cut
   - edgebanded
   - packed

### Job Lifecycle

1. Created as `DRAFT`
2. Accumulates persisted parts
3. Remains eligible for batching while draft
4. Moves to `COMPLETE` once all parts are packed

### Order Lifecycle

1. Imported or created during configurator persistence
2. Tracks demand through normalization and manufacturing execution
3. Moves to `READY_FOR_SHIPMENT` once all manufacturing jobs are complete
4. Moves to `SHIPPED` when shipping station closes it out

### Batch Lifecycle

1. `DRAFT`
2. `PLANNED`
3. `RELEASED`
4. `CUTTING`
5. `CUT_COMPLETE`
6. `READY_FOR_NEXT_STAGE`

Batch status is intentionally separate from per-part status. Batch status models floor-level coordination; part status models actual unit progress.

## Maintainer Notes

- The batch-driven manufacturing path is the current backbone for configurator and Amazon shelf work.
- `scanCode` is the system’s unambiguous physical-part identifier. `labelCode` is human-readable and may repeat across separate jobs/orders.
- `Artifact` is the preferred persistence pattern for generated outputs. New generated documents should fit that pattern unless there is a strong reason not to.
- Status changes that affect multiple records should stay transactional. The part packing completion cascade is the model to follow.
- If a new workflow starts from persisted parts/jobs/batches, prefer extending existing batch and station services rather than creating a second planning pipeline.
