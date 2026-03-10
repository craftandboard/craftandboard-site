# FieldMetriq Monorepo Preservation Checklist

## Preserve before any merge

### Local uncommitted changes
- `craft-and-board`
  - preserve `34` changed or untracked paths in the current workspace
- `fieldmetriq-core`
  - preserve `27` changed or untracked paths, including Prisma migrations, tests, routes, and views

### Deployment docs and live cutover docs
- Owner today: `craft-and-board/docs/merge`
- Preserve:
  - domain cutover docs
  - live deploy reality audit docs
  - production smoke-check docs
  - env and deployment topology docs

### Env samples and domain config
- Owner today:
  - frontend-oriented env samples in `craft-and-board/.env.example`
  - backend-oriented env samples in `fieldmetriq-core/.env.example`
- Preserve:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_MARKETING_URL`
  - `NEXT_PUBLIC_API_BASE_URL`
  - backend DB/auth/runtime vars

### Prisma schema and migrations
- Owner today:
  - monorepo schema in `craft-and-board/prisma`
  - backend-live schema and migrations in `fieldmetriq-core/prisma`
- Preserve both until schema ownership is explicitly unified

### App routing and domain logic
- Owner today: `craft-and-board/apps/web`
- Preserve:
  - hostname-aware marketing vs app logic
  - auth page redirects to app host
  - FieldMetriq brand/domain metadata behavior

### UI branding and domain work already done
- Owner today: `craft-and-board/apps/web` and `craft-and-board/docs/merge`
- Preserve:
  - FieldMetriq brand strings
  - `fieldmetriq.com` / `app.fieldmetriq.com` / `api.fieldmetriq.com` role separation
  - removal of production-facing localhost artifact links

### Manufacturing, labels, production, and generated artifacts flows
- Owner today:
  - frontend and API representations in `craft-and-board/apps/web` and `craft-and-board/apps/api`
  - live backend implementations and newer work-module flows in `fieldmetriq-core/src`
- Preserve:
  - labels
  - manufacturing bundles
  - artifact generation
  - production pages
  - work/task flows

### Provider-specific assumptions
- Vercel/live frontend assumptions currently live with `craft-and-board`
- Railway/live backend assumptions currently live with `fieldmetriq-core`
- Preserve project/domain/env notes before any repo consolidation

## Do not lose ownership clarity
- `craft-and-board` currently owns the safer monorepo shell
- `fieldmetriq-core` currently owns the live Railway backend lineage and active backend local work
