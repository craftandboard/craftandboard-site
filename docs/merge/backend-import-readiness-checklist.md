# Backend Import Readiness Checklist

## Scope
- Source repo: `/Users/brandon/Projects/fieldmetriq-core`
- Target repo: `/Users/brandon/Projects/craft-and-board`
- Phase 0 status: planning only, no backend import performed

## Readiness checks before any import
- Both repos have checkpoint commits for current local work
- Canonical repo is agreed: `craft-and-board`
- `fieldmetriq-core` local leftovers are understood and intentionally preserved
- `craft-and-board` remains the only repo modified for Phase 0 prep

## Code comparison checks
- Compare route inventories between source and target API apps
- Compare auth/session approaches
- Compare Prisma schema models and migration histories
- Compare scripts and local runtime workflows
- Compare test entrypoints and DB reset approaches

## Safety checks
- Do not overwrite `apps/web`
- Do not overwrite current `apps/api/src/modules` blindly
- Do not merge Prisma migrations until ordering and ownership are explicit
- Do not change provider settings during the import-prep phase

## Import sequence checks
- Start with documentation and route/module inventory mapping
- Import one backend slice at a time
- Validate build and tests after each slice
- Keep the source repo available as the rollback reference until migration is complete

## Rollback readiness
- Prior checkpoint commit hash recorded for the canonical repo
- Prior checkpoint commit hash recorded for the source backend repo
- Provider deploy settings unchanged
- No destructive repo cleanup performed
