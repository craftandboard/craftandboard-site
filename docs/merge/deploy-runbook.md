# Deploy Runbook

## 1. GitHub Branch / Deploy Flow
- merge stable branch into the branch connected to deployment
- Vercel builds `apps/web`
- Railway builds and runs `apps/api`

## 2. Vercel Project Setup
1. Create `fieldmetriq-web-dev`
2. Set root directory to `apps/web`
3. Build command: `pnpm build`
4. Install command: `pnpm install --frozen-lockfile`
5. Output: Next.js default
6. Set env:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_MARKETING_URL`
   - `NEXT_PUBLIC_API_BASE_URL`

## 3. Railway Project Setup
1. Create `fieldmetriq-api-dev`
2. Service root: repo root or `apps/api` depending on Railway project setup
3. Build command:
   - `corepack pnpm --filter api build`
4. Start command:
   - `corepack pnpm --filter api start`
5. Attach Postgres
6. Set env:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `PORT`
   - `AUTH_SECRET`
   - `AUTH_SESSION_SECRET`
   - `REDIS_URL`

## 4. Env Setup Order
1. Railway database URLs
2. Railway auth/session secret
3. Railway queue/storage/print vars
4. Vercel frontend URLs
5. Vercel API base URL pointing to Railway API

## 4A. Production Domain Roles
- `fieldmetriq.com` -> marketing root
- `app.fieldmetriq.com` -> SaaS app
- `api.fieldmetriq.com` -> Railway API
- keep `craftandboard.com` as temporary fallback only during validation

## 5. Database Setup Expectations
- run Prisma generate during build or release workflow
- run schema sync/migration as the environment requires before first live use
- do not point dev and prod at the same database

## 6. First Deploy Sequence
1. Deploy Railway API
2. Verify `/health`
3. Deploy Vercel web
4. Verify dashboard loads against Railway API

## 7. Smoke Test Checklist
- web root loads
- marketing root loads on `fieldmetriq.com`
- app root loads on `app.fieldmetriq.com`
- dashboard loads
- orders page loads
- costing page loads
- machines page loads
- API `/health` returns ok
- canonical estimate pages do not show base-URL mismatch

## 8. Rollback Notes
- rollback frontend by promoting prior Vercel deployment
- rollback backend by promoting prior Railway deployment
- avoid rolling back DB schema without an explicit data plan
