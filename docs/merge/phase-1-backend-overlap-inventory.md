# Phase 1 Backend Overlap Inventory

## Scope
- Source repo read-only:
  - `/Users/brandon/Projects/fieldmetriq-core`
- Canonical repo write target:
  - `/Users/brandon/Projects/craft-and-board`
- This phase is analysis only. No backend code was imported.

## Canonical target: `craft-and-board`

### Backend entrypoint and structure
- API entrypoint:
  - `apps/api/src/index.ts`
- Route surface:
  - `apps/api/src/routes/*.ts`
- Module layer:
  - `apps/api/src/modules/*`
- Shared API libs:
  - `apps/api/src/lib/*`
- Prisma:
  - `prisma/schema.prisma`
  - `prisma/migrations/*`
- Shared packages:
  - `packages/costing`
  - `packages/integrations`
  - `packages/manufacturing`
  - `packages/shared`
- Tests:
  - `apps/api/src/tests/*.test.ts`
- Scripts:
  - `scripts/pnpm`

### Meaningful backend domains already present
- Auth and session:
  - `routes/auth.ts`
  - `modules/auth/*`
  - `lib/requestContext.ts`
- Org and access:
  - `routes/org.ts`
  - `routes/me.ts`
  - `modules/org/*`
  - `lib/authorization.ts`
- Orders and intake:
  - `routes/orders.ts`
  - `routes/orderIntake.ts`
  - `modules/orders/*`
  - `modules/orderIntake/*`
- Manufacturing and production:
  - `routes/manufacturing.ts`
  - `routes/production.ts`
  - `routes/shelfJobs.ts`
  - `modules/manufacturing*`
  - `modules/productionBundles`
  - `modules/productionOutputs`
- Labels and artifacts:
  - `routes/labels.ts`
  - `routes/manufacturingLabels.ts`
  - `modules/labels/*`
  - `lib/generatedArtifacts.ts`
  - `lib/artifactStorage.ts`
- Costing and pricing:
  - `routes/costing.ts`
  - `routes/pricing.ts`
  - `modules/costing/*`
  - `modules/pricing/*`
- Machine and telemetry flows:
  - `routes/machines.ts`
  - `routes/machineEvents.ts`
  - `routes/machineStageCandidates.ts`
  - `modules/machineIntegration`
  - `modules/machineTelemetry`
- Warehouse/floor workflows:
  - `routes/containers.ts`
  - `routes/scanning.ts`
  - `routes/remnants.ts`
  - `routes/stageSignals.ts`
  - `routes/stations.ts`

## Source backend: `fieldmetriq-core`

### Backend entrypoint and structure
- Server entrypoint:
  - `src/server.js`
- Route surface:
  - `src/routes/*.js`
- Service layer:
  - `src/services/*.js`
- Supporting backend layers:
  - `src/auth`
  - `src/middleware`
  - `src/security`
  - `src/repos`
  - `src/jobs`
  - `src/lib`
- Prisma:
  - `prisma/schema.prisma`
  - `prisma/migrations/*`
- Tests and verification scripts:
  - top-level test files plus `scripts/test-*.js`
- Scripts:
  - migration, normalization, verification, dev reset/up/down scripts

### Meaningful backend domains already present
- Auth and session:
  - `/login`
  - `/logout`
  - `/api/auth/login`
  - `/api/auth/logout`
  - auth cookie/session handling in `src/server.js`
- Project and work-module flows:
  - `project-tasks.routes.js`
  - `project-work-pack.routes.js`
  - `project-work-notes.routes.js`
  - `activate-project.routes.js`
  - `job-lifecycle.service.js`
  - `work-pack.service.js`
- Sales and pipeline flows:
  - `lead-advance.routes.js`
  - `proposal-acceptance.routes.js`
  - `sales-audit.service.js`
  - `sales-engine.rules.js`
- Financial and payment flows:
  - `project-payments.routes.js`
  - `project-deposit-gate.routes.js`
  - `project-cost-tracking.routes.js`
  - `project-financial-snapshot.routes.js`
  - `stripeCheckout.js`
  - `stripeWebhook.js`
  - `stripe.js`
- Internal infra endpoints:
  - `/health`
  - `/ready`
  - `/version`

## Structural overlap summary
- `craft-and-board` already has the stronger monorepo shape and module boundaries.
- `fieldmetriq-core` has the stronger single-service backend history for project execution, sales, payments, and work modules.
- The major overlap is not file-for-file duplication. It is business-domain overlap with different boundaries:
  - both repos own auth/session behavior
  - both repos own Prisma schema
  - both repos expose “job/work” concepts with different naming and scope
- The biggest non-overlap is also important:
  - `craft-and-board` owns manufacturing-floor and artifact flows
  - `fieldmetriq-core` owns project-phase, work-pack, and Stripe payment flows

## Immediate import-safe conclusion
- Treat `craft-and-board` as the canonical destination structure.
- Do not bulk-copy `fieldmetriq-core/src` into `apps/api/src`.
- Phase 2 should start with boundary reconciliation for Prisma and auth before importing any source backend slice.
