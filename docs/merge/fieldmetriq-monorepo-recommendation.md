# FieldMetriq Monorepo Recommendation

## Recommended canonical repo
- `craft-and-board`

## Recommended path
- Path `A`: make `craft-and-board` the canonical base and fold backend in later

## Evidence-based justification
- `craft-and-board` already has the target monorepo skeleton:
  - `apps/web`
  - `apps/api`
  - `apps/worker`
  - `packages/*`
  - `prisma`
  - `docs`
  - `scripts`
- `fieldmetriq-core` is still a backend-first single-service repo with live Railway ownership and active dirty work in routes, views, Prisma migrations, and tests.
- Using `craft-and-board` as the base minimizes structural work because the monorepo shell already exists.
- This also avoids forcing a dirty backend repo to absorb a frontend, package workspace, and worker structure before migration even begins.

## What not to do yet
- do not merge files between repos while both worktrees are dirty
- do not repoint Vercel or Railway yet
- do not rename repos yet
- do not delete old repo content yet

## Safe execution trigger
- Begin structural work only after Brandon has manually checkpointed the dirty local changes he cares about in both repos and confirmed `craft-and-board` is the canonical monorepo base.
