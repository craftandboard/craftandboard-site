# Deploy Wireup Results

## Starting Commit Baseline
- branch used for UI stabilization: `feat/ops-ui-unification`
- baseline commit: `8e08202`
- baseline status before deploy wiring:
  - API tests green
  - API build green
  - web build green

## Files Changed For Deploy Wiring
- `apps/web/src/lib/api.ts`
- `apps/api/src/lib/env.ts`
- `apps/api/package.json`
- `.env.example`
- `docs/merge/deployment-topology.md`
- `docs/merge/env-matrix.md`
- `docs/merge/deploy-wireup-audit.md`
- `docs/merge/deploy-runbook.md`
- `docs/merge/deploy-wireup-results.md`

## Vercel Readiness Status
- `apps/web` is deploy-ready for Vercel
- frontend now prefers `NEXT_PUBLIC_API_BASE_URL`
- no custom Vercel config was required in this branch

## Railway Readiness Status
- `apps/api` now has a production `start` script
- API now honors Railway `PORT` through `PORT_API`
- auth secret aliasing supports deploy env normalization

## Env Matrix Updates
- web-only vars documented
- Railway-only vars documented
- shared auth/session vars documented
- root `.env.example` expanded with deploy placeholders

## Runbook Created
- see `docs/merge/deploy-runbook.md`

## Smoke Test Surface
- `/`
- `/orders`
- `/costing`
- `/machines`
- API `/health`
- verify frontend requests resolve against deployed Railway API

## Remaining Manual Setup Steps
- connect GitHub repo to Vercel project(s)
- connect GitHub repo to Railway project(s)
- provision Railway Postgres and optional Redis
- set Vercel and Railway environment variables
- assign target domains

## Blockers / Open Decisions
- current repo still remains the execution repo until repo move/rename to `fieldmetriq-core`
- no live Vercel/Railway project connection was performed in this branch
- migration strategy for production DB rollout remains a manual platform step

## Exact Next Recommended Branch
- `chore/craft-board-repo-freeze-notes`
