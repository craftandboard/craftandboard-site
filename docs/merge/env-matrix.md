# Env Matrix

## Frontend Web
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_MARKETING_URL`
- `NEXT_PUBLIC_API_BASE_URL`

## Backend API
- `DATABASE_URL`
- `DIRECT_URL`
- `PORT`
- `PORT_API`
- `AUTH_SECRET`
- `AUTH_SESSION_SECRET`
- `ENABLE_BACKGROUND_WORKER`

## Database
- `DATABASE_URL`
- `DIRECT_URL`

## Auth / Session
- `AUTH_SECRET`
- `AUTH_SESSION_SECRET`
- `SESSION_COOKIE_NAME`

## Integrations
- `AMAZON_*`

## Storage / Assets
- `STORAGE_*`

## Printing / Labels
- `PRINT_*`

## Queues / Workers
- `QUEUE_*`
- `QUEUE_REDIS_URL`

## Matrix

| Group | Local | Dev | Prod |
|---|---|---|---|
| frontend web | local `.env` | Vercel dev env | Vercel prod env |
| backend api | local `.env` | Railway dev vars | Railway prod vars |
| database | local or shared dev DB | Railway dev DB | Railway prod DB |
| auth/session | local secret | shared dev secret | prod secret |
| integrations | optional stub creds | sandbox/dev creds | production creds |
| storage/assets | local fs or dev bucket | dev bucket | prod bucket |
| printing/labels | local output path | dev config | prod config |
| queues/workers | local Redis | Railway/managed Redis dev | Railway/managed Redis prod |

## Vercel Only
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_MARKETING_URL`
- `NEXT_PUBLIC_API_BASE_URL`

## Railway Only
- `DATABASE_URL`
- `DIRECT_URL`
- `PORT`
- `PORT_API`
- `REDIS_URL`
- `QUEUE_REDIS_URL`
- `ENABLE_BACKGROUND_WORKER`
- `STORAGE_*`
- `PRINT_*`
- `AMAZON_*`

## Shared Across Web And API
- `AUTH_SECRET`
- `AUTH_SESSION_SECRET`

## Notes
- `apps/web` now resolves API base URL from `NEXT_PUBLIC_API_BASE_URL` first, then `API_BASE_URL`, then localhost for local-only fallback.
- Recommended production frontend values:
  - `NEXT_PUBLIC_MARKETING_URL=https://fieldmetriq.com`
  - `NEXT_PUBLIC_APP_URL=https://app.fieldmetriq.com`
  - `NEXT_PUBLIC_API_BASE_URL=https://api.fieldmetriq.com`
- Marketing and app domains are intentionally separate:
  - `fieldmetriq.com` serves the public landing page
  - `app.fieldmetriq.com` serves the SaaS app
- `apps/api` now resolves `PORT_API` from Railway `PORT` when present.
- Railway should own the database and queue runtime vars even when the frontend is deployed on Vercel.
