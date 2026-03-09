# System Overview

Craft & Board is a pnpm monorepo for a cabinet-shelf manufacturing workflow. It takes shelf demand from configurator input and Amazon fixture imports, converts that demand into persisted manufacturing records, groups parts into production batches, generates floor artifacts, and drives station-level execution through packing and shipping.

This document is for engineers and maintainers who need to understand how the current system is assembled, where data lives, and which modules own each stage of the workflow.

## System Components

- `apps/web`
  - Next.js App Router application for operators and test harnesses.
  - Main UI surfaces: configurator test, orders, batches, manufacturing, labels, and station views.
- `apps/api`
  - Express API for the entire operational workflow.
  - Owns imports, configurator translation, job persistence, batching, nesting, packet generation, station queues, shipping actions, and machine telemetry ingestion.
- `apps/worker`
  - Background-process entry point. The current repo keeps this lightweight, with Redis/no-op behavior when queue infrastructure is absent.
- `packages/shared`
  - Shared TypeScript contracts used across API and web.
- `prisma`
  - PostgreSQL schema and Prisma client generation.
- `generated-artifacts`
  - Runtime-generated printable PDFs and other file-based artifacts exposed through the API as static files.

## Machine Telemetry Prep

The machine telemetry layer is intentionally infrastructure-first:

- machines are registered as org-owned records
- machine events are stored in an append-only ledger
- raw payloads are preserved for debugging
- safe linking attempts can connect an event to batch, job, or part context
- unmatched events still persist successfully

This phase does not:

- depend on live PLC connectivity
- hardcode one vendor protocol
- automatically mutate broad production state
- attempt real-time streaming analytics

## Auto Stage Candidate Signals

The stage-signal layer sits on top of linked machine events.

It is intentionally review-first:

- machine events can generate candidate stage updates
- candidates remain advisory until a user applies them
- rejected and applied decisions remain visible for audit
- applying a candidate uses the existing batch or part transition service
- unsupported targets stay reviewable-only instead of mutating state unsafely

## Trusted Auto-Apply

Trusted auto-apply sits on top of stage candidates, not raw machine events.

It is intentionally opt-in:

- manual review remains the default for all candidate signals
- only HIGH-confidence candidates are eligible
- only a narrow approved action subset is considered
- rules are org-scoped and can target:
  - one specific machine
  - one machine type
- machine-specific rules win over machine-type rules
- auto-apply reuses the same stage-signal apply service as manual review
- auto-applied candidates retain explicit audit fields for:
  - applied mode
  - rule id
  - rationale
  - timestamps

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

- `materialForecast/*`
  - Computes pending cut demand before batching.
  - Groups persisted parts by material and thickness.
  - Estimates sheet demand with a simple planning heuristic.
  - Uses live remnant inventory to expose advisory candidate coverage and estimated new-sheet reduction.
  - Creates batches from explicit forecast-selected jobs/parts.
- `edgeBanding/*`
  - Computes edge band demand from persisted parts, order-item source text, and material mapping rules.
  - Applies deterministic per-edge waste allowance and per-material setup allowance.
  - Exposes rollups for forecast, batch, and order planning.
- `remnants/*`
  - Owns the persisted remnant catalog and remnant lifecycle.
  - Creates labeled/scannable remnant records tied to org and normalized material identity.
  - Supports remnant updates, partial consumption, and remnant label artifact generation.
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
- `machines/*`
  - Owns machine registry, event normalization, safe context linking, and simulation-ready ingest flow.
- `stageSignals/*`
  - Owns candidate-signal generation, listing, apply/reject review flow, and audit-safe linkage back to source machine events.
- `trustedAutoApply/*`
  - Owns trusted rule configuration, matching, and conservative auto-apply evaluation for eligible candidate signals.
- `containers/*`
  - Batch-scoped post-CNC sorting workflow.
  - Creates bins or containers linked to a batch and optionally narrowed to one job or order.
  - Assigns parts into a current physical container by `partId` or `scanCode`.
  - Returns batch sorting summary with assigned and unassigned counts.
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
- `Remnant`
  - Persisted leftover-sheet inventory record.
  - Tracks normalized material identity, dimensions, usable area, source batch, location, and lifecycle status.
- `RemnantUsage`
  - Audit trail for remnant create/update/consume actions.
- `Sheet`
  - Persisted nested sheet layout for a batch.
- `SheetPlacement`
  - Part placement coordinates on a sheet.
- `Shipment`
  - Shipping/pickup fulfillment record associated with an order.
- `Machine`
  - Org-owned machine registry row for CNC, edgebander, label printer, scanner station, or other device types.
- `MachineEvent`
  - Append-only machine event ledger row with raw payload, normalized refs, processing status, and optional linked batch/job/part context.
- `StageCandidateSignal`
  - Reviewable stage-update suggestion derived from a trusted linked machine event.
  - Stores target context, recommended action, confidence, rationale, review status, and audit timestamps.

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
   - Forecast UI can select explicit demand into the next batch.
   - The legacy batch build route can still create a material-wide draft batch.
6. Nesting
   - Parts are placed onto persisted `Sheet` and `SheetPlacement` rows.
7. Artifact generation
  - CNC packet JSON
  - label packet JSON
  - label PDF
  - traveler PDF
8. Sorting
   - Cut parts can be assigned into a current batch container or bin before downstream work.
9. Remnant capture
   - Leftover usable material can be recorded as a real remnant with a code, dimensions, location, and status.
   - Remnants can generate label artifacts and later appear in forecast planning.
10. Station execution
   - Cutting: pending -> cut
   - Edgebanding: cut -> edgebanded
   - Packing: edgebanded -> packed
11. Completion cascade
   - When all parts for a job are packed, `ManufacturingJob.status = COMPLETE`
   - When all jobs for an order are complete, `Order.status = READY_FOR_SHIPMENT`
12. Shipping
   - Shipping station consumes completed orders and marks them `SHIPPED`

13. Machine telemetry capture
   - Machines can emit or simulate diagnostic events into the append-only ledger.
   - Events preserve raw payload and normalized refs.
   - Linking can safely attach machine activity to batch, job, or part context without changing production state automatically.
14. Stage candidate review
   - Supported linked machine events can create reviewable stage candidates.
   - Users can apply or reject them.
   - Applying uses the existing domain transition services rather than bypassing current state rules.
15. Trusted auto-apply
   - If an eligible HIGH-confidence candidate matches an enabled trusted rule, it may auto-apply through the same domain-safe apply path.
   - If any eligibility check fails, the candidate stays OPEN for manual review.

## Material Forecast Layer

The forecast layer sits between demand persistence and batch creation.

It answers:

- what parts are still waiting to be cut
- which materials are accumulating demand
- how much sheet demand is likely for each material
- how much of that demand may be covered by real remnants first
- how much matching edge band is likely required for the same pending work
- which source jobs and orders should be selected into the next batch

It does not yet perform:

- final nesting optimization
- exact remnant allocation
- purchasing decisions
- calendar scheduling

## Edge Band Planning Layer

The edge banding layer is a planning and purchasing aid built on persisted parts.

It currently:

- derives banding patterns from source edge text when available
- falls back to stored normalized edge-band values safely
- maps panel material to edge band material/color deterministically
- calculates raw linear footage from part dimensions
- adds:
  - per-edge waste allowance
  - setup/test-run allowance once per edge band material bucket
- rolls totals up by:
  - part
  - job
  - batch
  - forecast demand

It intentionally does not model:

- machine runtime
- stock depletion
- vendor ordering
- substitution logic

The current implementation is intentionally computed rather than snapshot-driven. It reads live persisted operational demand and excludes parts that have already been attached to a real batch.

## Machine Event Layer

The machine event layer exists so later PLC, webhook, file-drop, or vendor adapters have one stable ingest target.

Supported normalized event types in this phase:

- `RUN_STARTED`
- `RUN_COMPLETED`
- `SHEET_STARTED`
- `SHEET_COMPLETED`
- `PART_SCANNED`
- `EDGEBAND_RUN_STARTED`
- `EDGEBAND_RUN_COMPLETED`
- `MACHINE_HEARTBEAT`
- `FAULT`
- `STOPPED`

Processing model:

- `RECEIVED`
- `PARSED`
- `LINKED`
- `UNMATCHED`
- `ERROR`

Safe linking order:

1. part by `scanCode`, `id`, or `partCode`
2. batch by `id` or `code`
3. manufacturing job by `id` or `labelCode`

Linking is intentionally conservative. If no trustworthy context is present, the event stays stored as `UNMATCHED`.

## Candidate Signal Rules

Phase 1 supported rules:

- CNC `RUN_STARTED` + linked batch -> `MARK_BATCH_CUT_IN_PROGRESS`
- CNC `RUN_COMPLETED` + linked batch -> `MARK_BATCH_CUT_COMPLETE`
- CNC `PART_SCANNED` or `SHEET_COMPLETED` + linked part -> `MARK_PART_CUT`
- EDGEBANDER `EDGEBAND_RUN_COMPLETED` + linked part -> `MARK_PART_EDGEBANDED`
- EDGEBANDER `EDGEBAND_RUN_COMPLETED` + linked manufacturing job -> `MARK_JOB_EDGE_COMPLETE`

Only high-confidence, explicitly linked events generate candidates in this phase.

Apply behavior in phase 1:

- part cut and part edgebanded candidates can be applied
- batch cut-in-progress and batch cut-complete candidates can be applied if existing batch transition rules allow it
- job-level edge-complete candidates remain reviewable but non-applying until the domain model supports them cleanly

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
- `generated-artifacts/remnants/<remnantId>/...`

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

### Machines

- Route: `/machines`
- Purpose: machine registry and org-wide recent telemetry view

### Machine Detail

- Route: `/machines/[machineId]`
- Purpose: inspect a single machine, review recent events, and run simulation tests without real hardware

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
6. Optionally assigned to a current post-CNC container or bin
7. Processed through:
   - pending
   - cut
   - edgebanded
   - packed

### Remnant Lifecycle

1. Created manually or from a cut leftover
2. Stored with normalized material identity and measured dimensions
3. Marked `AVAILABLE`, `PARTIAL`, `HOLD`, `SCRAPPED`, or `CONSUMED`
4. Can generate a remnant label PDF artifact
5. Surfaces in forecast as advisory candidate inventory for matching material groups
6. Can be partially consumed with remaining usable area tracked in history

### Container Lifecycle

1. Created for a specific batch
2. Optionally scoped to one order or manufacturing job
3. Moves from `OPEN` to `SORTING` as parts are assigned
4. Can reach `COMPLETE` when its scoped work is fully assigned
5. Remains the current physical location reference for downstream stations

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
