# Deploy Wireup Audit

## Current Frontend Deploy Readiness
- `apps/web` is a standard Next.js app with:
  - `build`: `next build`
  - `start`: `next start -p 3000`
- No custom server is required.
- No `vercel.json` was necessary for this branch.
- Main readiness gap found:
  - API client preferred `API_BASE_URL`, which is not the right primary convention for Vercel browser-exposed config.

## Current Backend Deploy Readiness
- `apps/api` is an Express API compiled by `tsc`.
- `tsconfig.json` outputs to `dist`.
- Main readiness gaps found:
  - no production `start` script in `apps/api/package.json`
  - local-only `PORT_API` assumption instead of honoring Railway `PORT`
  - auth secret naming needed clearer deploy mapping

## Missing Config / Items Found
- deployment runbook was missing
- deploy results doc was missing
- env matrix needed explicit Vercel-only vs Railway-only ownership
- root env example needed public web vars, direct DB URL, auth, queue, storage, and print placeholders

## Env Requirements By App

### apps/web
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_BASE_URL`

### apps/api
- `DATABASE_URL`
- `DIRECT_URL`
- `PORT` or `PORT_API`
- `AUTH_SECRET` / `AUTH_SESSION_SECRET`
- `REDIS_URL`
- `ENABLE_BACKGROUND_WORKER`
- optional integration/storage/print vars

## Recommended Final Topology For Current Repo State
- Vercel deploys `apps/web`
- Railway deploys `apps/api`
- Railway Postgres backs the API
- Railway worker runs separately when background processing is enabled
- frontend reaches backend through `NEXT_PUBLIC_API_BASE_URL`
