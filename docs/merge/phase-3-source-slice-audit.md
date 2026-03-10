# Phase 3 Source Slice Audit

## Source files inspected
- `/Users/brandon/Projects/fieldmetriq-core/src/routes/project-tasks.routes.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/routes/project-work-pack.routes.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/services/work-pack.service.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/repos/projects.repo.prisma.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/services/next-action.service.js`
- `/Users/brandon/Projects/fieldmetriq-core/prisma/schema.prisma`
- `/Users/brandon/Projects/fieldmetriq-core/src/server.js` project listing section

## Source dependencies found
- Prisma models:
  - `Project`
  - `ProjectPhase`
  - `ProjectTask`
  - source `Job` linkage
- Source auth/runtime assumptions:
  - `req.user`
  - `req.orgId`
  - `hasCapability`
  - monolithic `src/server.js` middleware
- Optional but deferred dependencies:
  - `WorkOrder`
  - project financial snapshot services
  - payment/deposit state
  - proposal and lead linkages

## What is safe to import now
- project list intent
- project detail intent
- work-module list intent
- work-module detail intent
- read-only task and phase summaries
- project-domain terminology and route segmentation

## What must stay out in this phase
- payment and Stripe flows
- proposal, lead, and deposit routing
- source login/session handling
- source monolithic server middleware
- write-heavy task mutations
- work-pack refresh and work-order generation
- source `Job` lifecycle writes

## Exact target landing plan
- routes:
  - `apps/api/src/routes/projects.ts`
  - `apps/api/src/routes/workModules.ts`
- modules:
  - `apps/api/src/modules/projects/*`
  - `apps/api/src/modules/workModules/*`
- adapters:
  - target-owned request-context adapter
  - target-owned Prisma repository adapters
- schema:
  - additive target models for `Project`, `ProjectPhase`, and `ProjectTask`
- tests:
  - route tests for auth/capability enforcement
  - service tests for read shaping and org-scoped input flow
