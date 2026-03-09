# Current Working Tree Snapshot

## Active Branch
- `feature/material-cost-engine`

## Git Status Summary
- Pending file count: `56`
- Modified files: `21`
- Untracked files: `35`
- Deleted files: `0`
- Renamed files: `0`

The earlier reported `68` pending files does not match the current repo state. The real current count is `56`.

## High-Level Assessment
The pending changes represent coherent platform work, not random local noise. API tests, API build, web build, Prisma generate, and Prisma schema sync all passed from this pending state.

Recommended conclusion:
- preserve the current code as valid platform work
- do not discard the pending implementation
- stabilize it with a commit before broader merge work

## Grouped Files By Domain

### KEEP NOW — Costing / Pricing Foundation
- `/apps/api/src/modules/costing/`
- `/apps/api/src/modules/pricing/`
- `/apps/api/src/routes/costing.ts`
- `/apps/api/src/routes/pricing.ts`
- `/apps/api/src/tests/costing.test.ts`
- `/apps/api/src/tests/pricing.test.ts`
- `/prisma/migrations/20260308193000_add_costing_engine_foundation/`
- `/prisma/migrations/20260308201500_add_pricing_engine_foundation/`

Disposition:
- `KEEP NOW`

### KEEP NOW — Order Intake / Shelf Job / Manufacturing Packet Backbone
- `/apps/api/src/modules/orderIntake/`
- `/apps/api/src/routes/orderIntake.ts`
- `/apps/api/src/routes/shelfJobs.ts`
- `/apps/api/src/tests/orderIntake.test.ts`
- `/prisma/migrations/20260308213000_add_order_intake_shelf_jobs/`

Disposition:
- `KEEP NOW`

### KEEP NOW — Manufacturing Expansion / Labels / Scan Workflow
- `/apps/api/src/modules/manufacturingExpansion/`
- `/apps/api/src/modules/labels/contracts.ts`
- `/apps/api/src/modules/labels/service.ts`
- `/apps/api/src/modules/labels/htmlRenderer.ts`
- `/apps/api/src/modules/scanning/`
- `/apps/api/src/routes/manufacturingExpansion.ts`
- `/apps/api/src/routes/manufacturingLabels.ts`
- `/apps/api/src/routes/scanning.ts`
- `/apps/api/src/tests/manufacturingExpansion.test.ts`
- `/apps/api/src/tests/labels.test.ts`
- `/apps/api/src/tests/scanning.test.ts`
- `/prisma/migrations/20260308223000_add_manufacturing_expansion_backbone/`
- `/prisma/migrations/20260308233000_add_label_scan_workflow_backbone/`

Disposition:
- `KEEP NOW`

### KEEP NOW — Container / Bin Workflow
- `/apps/api/src/modules/containers/schemas.ts`
- `/apps/api/src/modules/containers/workflowService.ts`
- `/apps/api/src/modules/containers/selectors.ts`
- `/apps/api/src/modules/containers/service.ts`
- `/apps/api/src/routes/containers.ts`
- `/prisma/migrations/20260308234500_add_container_sorting_workflow/`

Disposition:
- `KEEP NOW`

### KEEP NOW — Remnant Catalog / Optimization Backbone
- `/apps/api/src/modules/remnants/htmlRenderer.ts`
- `/apps/api/src/modules/remnants/matching.ts`
- `/apps/api/src/modules/remnants/service.ts`
- `/apps/api/src/routes/remnants.ts`
- `/apps/api/src/routes/optimization.ts`
- `/apps/api/src/tests/remnants.test.ts`
- `/prisma/migrations/20260308235900_add_remnant_inventory_backbone/`

Disposition:
- `KEEP NOW`

### KEEP NOW — Machine Telemetry / PLC Intake Backbone
- `/apps/api/src/modules/machineTelemetry/`
- `/apps/api/src/modules/machines/contracts.ts`
- `/apps/api/src/modules/machines/service.ts`
- `/apps/api/src/routes/machineEvents.ts`
- `/apps/api/src/routes/machineStageCandidates.ts`
- `/apps/api/src/routes/machines.ts`
- `/apps/api/src/tests/machineTelemetry.test.ts`
- `/prisma/migrations/20260309002000_add_machine_telemetry_backbone/`

Disposition:
- `KEEP NOW`

### KEEP NOW — Cross-Cutting Wiring / Shared Contracts / Seeds
- `/apps/api/src/app.ts`
- `/apps/api/src/lib/authorization.ts`
- `/apps/api/src/modules/settings/service.ts`
- `/apps/api/src/modules/trustedAutoApply/selectors.ts`
- `/apps/api/src/modules/trustedAutoApply/service.ts`
- `/packages/shared/src/index.ts`
- `/prisma/schema.prisma`

Disposition:
- `KEEP NOW`

### KEEP NOW — Integration / Regression Tests
- `/apps/api/src/tests/routes.test.ts`
- `/apps/api/src/tests/codex6-guardrails.test.ts`

Disposition:
- `KEEP NOW`

## Explicit Classification Per Pending File

### KEEP NOW
- `/apps/api/src/app.ts`
- `/apps/api/src/lib/authorization.ts`
- `/apps/api/src/modules/containers/schemas.ts`
- `/apps/api/src/modules/containers/selectors.ts`
- `/apps/api/src/modules/containers/service.ts`
- `/apps/api/src/modules/containers/workflowService.ts`
- `/apps/api/src/modules/costing/`
- `/apps/api/src/modules/labels/contracts.ts`
- `/apps/api/src/modules/labels/htmlRenderer.ts`
- `/apps/api/src/modules/labels/service.ts`
- `/apps/api/src/modules/machineTelemetry/`
- `/apps/api/src/modules/machines/contracts.ts`
- `/apps/api/src/modules/machines/service.ts`
- `/apps/api/src/modules/manufacturingExpansion/`
- `/apps/api/src/modules/orderIntake/`
- `/apps/api/src/modules/pricing/`
- `/apps/api/src/modules/remnants/htmlRenderer.ts`
- `/apps/api/src/modules/remnants/matching.ts`
- `/apps/api/src/modules/remnants/service.ts`
- `/apps/api/src/modules/scanning/`
- `/apps/api/src/modules/settings/service.ts`
- `/apps/api/src/modules/trustedAutoApply/selectors.ts`
- `/apps/api/src/modules/trustedAutoApply/service.ts`
- `/apps/api/src/routes/containers.ts`
- `/apps/api/src/routes/costing.ts`
- `/apps/api/src/routes/machineEvents.ts`
- `/apps/api/src/routes/machineStageCandidates.ts`
- `/apps/api/src/routes/machines.ts`
- `/apps/api/src/routes/manufacturingExpansion.ts`
- `/apps/api/src/routes/manufacturingLabels.ts`
- `/apps/api/src/routes/optimization.ts`
- `/apps/api/src/routes/orderIntake.ts`
- `/apps/api/src/routes/pricing.ts`
- `/apps/api/src/routes/remnants.ts`
- `/apps/api/src/routes/scanning.ts`
- `/apps/api/src/routes/shelfJobs.ts`
- `/apps/api/src/tests/codex6-guardrails.test.ts`
- `/apps/api/src/tests/costing.test.ts`
- `/apps/api/src/tests/labels.test.ts`
- `/apps/api/src/tests/machineTelemetry.test.ts`
- `/apps/api/src/tests/manufacturingExpansion.test.ts`
- `/apps/api/src/tests/orderIntake.test.ts`
- `/apps/api/src/tests/pricing.test.ts`
- `/apps/api/src/tests/remnants.test.ts`
- `/apps/api/src/tests/routes.test.ts`
- `/apps/api/src/tests/scanning.test.ts`
- `/packages/shared/src/index.ts`
- `/prisma/migrations/20260308193000_add_costing_engine_foundation/`
- `/prisma/migrations/20260308201500_add_pricing_engine_foundation/`
- `/prisma/migrations/20260308213000_add_order_intake_shelf_jobs/`
- `/prisma/migrations/20260308223000_add_manufacturing_expansion_backbone/`
- `/prisma/migrations/20260308233000_add_label_scan_workflow_backbone/`
- `/prisma/migrations/20260308234500_add_container_sorting_workflow/`
- `/prisma/migrations/20260308235900_add_remnant_inventory_backbone/`
- `/prisma/migrations/20260309002000_add_machine_telemetry_backbone/`
- `/prisma/schema.prisma`

### KEEP LATER
- none identified in the current pending set

### DISCARD GENERATED
- none identified in the current pending set

### NEEDS REVIEW
- none identified as blockers; route and schema overlap should still be reviewed during merge execution, but not excluded from stabilization

### BLOCKING CONFLICT RISK
- `/prisma/schema.prisma`
- `/packages/shared/src/index.ts`
- `/apps/api/src/app.ts`
- `/apps/api/src/routes/containers.ts`
- `/apps/api/src/routes/machines.ts`
- `/apps/api/src/routes/machineEvents.ts`
- `/apps/api/src/routes/remnants.ts`
- `/apps/api/src/tests/routes.test.ts`

Reason:
- these are valid files, but they are high-conflict surfaces for future merge work
- they should still be stabilized now rather than left ambiguous

## Known Workstreams Confirmed In Pending Files
- machine telemetry backbone: `yes`
- trusted auto-apply: `yes`
- container/bin workflow: `yes`
- material cost engine: `yes`
- schema/migrations: `yes`
- routes/contracts/tests: `yes`
- deployment/env/config changes: `seed/config only`, no broad deploy-target refactor yet

## Likely Generated / Noise Files
None were found in the current pending set.

Not present:
- `.env`
- `node_modules`
- local build output
- generated-artifacts runtime output

## Are Changes Safe To Commit As-Is
Yes, with one caveat:
- the work is broad and stacked across multiple platform domains
- but it is internally coherent and currently verified by tests/builds

That makes it appropriate for a stabilization commit rather than continued uncommitted drift.

## Commit Recommendation
Recommended strategy: `2 commits max`

1. `chore: stabilize pending manufacturing platform work before merge foundation`
   Includes:
   - all validated pending code, schema, routes, tests, and migrations

2. `docs: add fieldmetriq merge foundation and migration plan`
   Includes:
   - docs under `docs/merge/`

If momentum matters more than history granularity, one single commit is still acceptable. Two commits is cleaner.

## Blockers Before Merge Foundation
- none blocking documentation
- broad merge work should not begin until the current pending implementation is committed or intentionally excluded

## Decision
The current 56 pending files should be preserved now, not deferred.

