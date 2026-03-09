# Current Platform State

## Summary
The current Craft & Board repository already contains platform-grade manufacturing logic that should migrate into FieldMetriq as shared modules.

This is not a blank-slate tenant app anymore. It already includes reusable manufacturing-system foundations.

## Existing Platform Domains Already Implemented
- auth, session, identity
- org and membership model
- role enforcement
- trusted auto-apply rules
- order intake and shelf job normalization
- costing engine
- pricing engine
- manufacturing packet and part expansion
- printable label payload and HTML rendering
- scan event workflow
- container/bin assignment and location tracking
- remnant inventory and matching
- machine telemetry evidence intake

## Telemetry Backbone
Already implemented:
- `MachineEventIngestRun`
- `MachineEventLink`
- `MachineStageCandidate`
- raw + normalized `MachineEvent` evidence
- machine source registry extensions on `Machine`
- single-event and batch ingest routes
- deterministic dedupe
- conservative linking to `ManufacturingBatch`, `ManufacturingPart`, and `Remnant`
- high-confidence machine-stage candidate emission

Operational meaning:
- machine/PLC/CNC evidence is now stored as auditable platform data
- unresolved events are preserved
- duplicates are preserved but not re-emitted

## Trusted Auto-Apply
Already implemented:
- trusted auto-apply rule model
- stage-signal review/apply/reject flow
- org and machine scoped trusted rules
- explicit auto/manual audit fields

Platform relevance:
- this is reusable operational control logic, not Craft & Board-only business behavior

## Container / Bin Workflow
Already implemented:
- containers
- container locations
- active container sessions
- manufacturing-part assignment into containers
- reassignment with audit trail
- container movement between locations

Platform relevance:
- this is generic shop-floor physical tracking

## Manufacturing Core Already Present
Already implemented:
- `SalesOrder`
- `SalesOrderItem`
- `ShelfJob`
- `ManufacturingPacket`
- `ManufacturingPart`
- `ManufacturingBatch`
- `ManufacturingBatchPart`
- label payload snapshots
- part scan flow

Platform relevance:
- this is a reusable production-unit backbone

## API / Route Surface Already Present
Current repo already has substantial route coverage for:
- `/auth`
- `/org`
- `/costing`
- `/pricing`
- `/order-intake`
- `/manufacturing-packets` and manufacturing expansion routes
- `/manufacturing-parts`
- `/scan`
- `/containers`
- `/remnants`
- `/machine-events`
- `/machines`
- `/machine-stage-candidates`
- `/stage-signals`
- `/trusted-auto-apply`

## Schema Areas Already Expanded
Prisma already includes platform-level growth in:
- tenant/org and user models
- costing/pricing models
- order intake models
- manufacturing packet/part/batch models
- label and scan models
- container/location/session models
- remnant inventory models
- telemetry evidence and candidate-signal models

## Verification Already Reported
Most recent verified state from the current working tree:
- Prisma generate passed
- Prisma schema sync passed
- API tests passed
- API build passed
- web build passed

## Open Decisions From Telemetry Report
- final machine payload guarantees for batch/part/remnant identifiers
- whether `programName` heuristic matching should remain enabled by default
- whether machine-stage candidates stay separate from older stage-signal review or merge later
- future trusted auto-apply scope for machine-derived evidence

## Risks If This Work Is Not Preserved
- loss of significant platform-grade manufacturing logic
- duplicated reimplementation in FieldMetriq
- loss of route/test/schema evidence that already encodes platform design decisions
- merge starting from assumptions instead of real working software

