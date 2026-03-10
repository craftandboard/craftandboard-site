# Backend Import Map

## Source repo
- `/Users/brandon/Projects/fieldmetriq-core`

## Target repo
- `/Users/brandon/Projects/craft-and-board`

## Import intent
- This is a planning map only.
- No backend code is imported in Phase 0.
- The goal is to define where backend code should land later without overwriting the current canonical monorepo baseline.

## Proposed landing areas

### API app code
- Source:
  - `src/routes`
  - `src/services`
  - `src/middleware`
  - `src/security`
  - `src/auth`
  - `src/lib`
  - `src/repos`
  - `src/jobs`
- Proposed target:
  - `apps/api/src/routes`
  - `apps/api/src/modules/*`
  - `apps/api/src/lib`
  - `apps/api/src/jobs` if still needed after module mapping

### Prisma schema and migrations
- Source:
  - `prisma/schema.prisma`
  - `prisma/migrations/*`
- Proposed target:
  - compare against `craft-and-board/prisma/schema.prisma`
  - import only after schema ownership and migration ordering are reconciled
  - final home remains `prisma/` in the canonical monorepo

### Scripts
- Source:
  - `scripts/*`
- Proposed target:
  - `scripts/` in the canonical monorepo
  - app-specific scripts may later live beside `apps/api`

### Shared types and contracts
- Source:
  - route payload shapes and reusable service-level structures currently embedded in `fieldmetriq-core/src/*`
- Proposed target:
  - `packages/shared`
  - `packages/types`
  - `packages/config` when env or runtime config becomes shared

### Tests
- Source:
  - `tests/*`
- Proposed target:
  - `apps/api/src/tests`
  - or a top-level `tests/` area only if cross-app integration tests need a separate home

## What must be compared before import
- route overlap between `fieldmetriq-core/src/routes` and `craft-and-board/apps/api/src/routes`
- service/module overlap for manufacturing, labels, production, auth, and work/task flows
- Prisma schema differences and migration history
- env expectations and runtime assumptions
- test harness differences and DB reset flows

## What must not be overwritten
- `craft-and-board/apps/web` frontend domain and branding work
- existing `craft-and-board/apps/api` module structure
- existing `craft-and-board/prisma` history without reconciliation
- current deployment docs and domain role docs

## Rollback and safety notes
- import in slices, not one bulk copy
- checkpoint before each import slice
- keep source repo untouched until the imported slice is validated
- do not rewire providers until imported backend code builds and passes validation in the canonical repo
