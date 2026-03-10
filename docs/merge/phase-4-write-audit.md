# Phase 4 Write Audit

## Current read-first surface
- `GET /projects`
- `GET /projects/:projectLookup`
- `GET /work-modules`
- `GET /work-modules/:workModuleId`
- target-owned request-context adapter
- target-owned Prisma repositories for `Project`, `ProjectPhase`, and `ProjectTask`

## Safe mutation candidates
- create project
- update project summary fields
- create work module
- update work module summary/status fields
- create project task
- update project task title/status/assignment-style fields

## Fields safe to mutate now
- project:
  - `key`
  - `name`
  - `address`
  - `status`
  - `stage`
  - `scopeSummary`
- work module:
  - `name`
  - `status`
  - `summary`
  - `sortOrder`
- project task:
  - `title`
  - `status`
  - `dueDate`
  - `assignedToUserId`
  - `isRequired`

## Fields that should remain deferred
- payment/deposit/project-payment fields
- proposal and lead linkage
- work-order generation
- source `Job` lifecycle coupling
- advanced project workflow automation
- broad project editing across every possible field

## Route plan for this phase
- `POST /projects`
- `PATCH /projects/:projectId`
- `POST /work-modules`
- `PATCH /work-modules/:workModuleId`
- `POST /projects/:projectId/tasks`
- `PATCH /projects/:projectId/tasks/:taskId`
