# FieldMetriq Monorepo Target Architecture

## Recommended target shape

```text
fieldmetriq/
├─ apps/
│  ├─ web/
│  ├─ api/
│  └─ worker/
├─ packages/
│  ├─ ui/
│  ├─ shared/
│  ├─ config/
│  └─ types/
├─ prisma/
├─ docs/
├─ scripts/
└─ .github/
```

## What should live in `apps/web`
- Next.js SaaS frontend
- domain-aware marketing vs app host logic
- auth entry pages
- operations UI routes
- UI-specific route loaders and presentation logic

## What should live in `apps/api`
- Express or HTTP API entrypoint
- request context, auth/session middleware, route registration
- API-facing domain modules
- artifact endpoints, labels, production, manufacturing, operations workflows

## What should live in `apps/worker`
- background jobs
- queue consumers
- job scheduling and retry orchestration

## What should move into `packages/*`
- `packages/ui`
  - reusable app-shell components, shared visual primitives, domain-neutral UI helpers
- `packages/shared`
  - DTOs, contracts, enums, validation shapes, cross-app constants
- `packages/config`
  - shared env parsing, URL/domain config, lint/build presets
- `packages/types`
  - TypeScript-only shared interfaces that should not depend on runtime code

## What local evidence drives this shape
- `craft-and-board` already has `apps/web`, `apps/api`, `apps/worker`, `packages/*`, `prisma`, `docs`, and `scripts`
- `fieldmetriq-core` already has substantial backend logic that can later be folded into `apps/api` and shared packages
- keeping the target close to the existing `craft-and-board` layout reduces structural churn

## Canonical monorepo base recommendation
- Recommended canonical base: `craft-and-board`

## Recommended migration path
- Path `A`: make `craft-and-board` the canonical base and fold backend in later

## Why not `B`
- `fieldmetriq-core` would need a full monorepo shell introduced before frontend migration work even starts
- that adds structural work on top of a dirty backend repo with live Railway ownership

## Why not `C`
- a brand new clean repo later is possible, but it adds another layer of repo and deployment indirection while both current repos are still active and dirty
- that is safer only after the current live repos are stabilized and checkpointed
