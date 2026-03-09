# Env Matrix

## Frontend Web
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_BASE_URL`

## Backend API
- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`

## Database
- `DATABASE_URL`
- `DIRECT_URL`

## Auth / Session
- `AUTH_SECRET`
- `SESSION_COOKIE_NAME`

## Integrations
- `AMAZON_*`

## Storage / Assets
- `STORAGE_*`

## Printing / Labels
- `PRINT_*`

## Queues / Workers
- `QUEUE_*`

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

