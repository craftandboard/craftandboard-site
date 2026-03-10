# Live Deploy Reality Audit

## Production frontend source of truth
- Provider: Vercel
- Team: `sublimedesignnvs-projects`
- Project: `craftandboard-web`
- Domain: `craftandboard.com`
- Connected GitHub repo: `brandonbozarth/fieldmetriq-core`
- Production branch: `main`
- Root directory: `apps/web`
- Framework preset: `Next.js`
- Latest production deployment:
  - Deployment URL: `https://craftandboard-332vq33x9-sublimedesignnvs-projects.vercel.app`
  - Commit SHA: `61fdd4f1e1560aa3580b947dc890b0f08ff68e01`
  - Commit message: `checkpoint before codex task build`
- Production env vars found:
  - `NEXT_PUBLIC_API_BASE_URL` is set on the Vercel project for `production`, `preview`, and `development`
  - Vercel API returned the key, but not the plain-text value from this session

## Production backend source of truth
- Provider: Railway
- Workspace: `fieldmetriqdev's Projects`
- Project: `FieldMetriq Production`
- Service: `fieldmetriq-core`
- Environment: `production`
- Current Railway-generated public domain: `fieldmetriq-core-production.up.railway.app`
- Current backend repo/source recorded by Railway:
  - Repo: `FieldMetriq-dev/fieldmetriq-core`
  - Branch: `main`
  - Latest deployed commit SHA: `251c27094b87b62474cfa6d9880b01d4e795fb07`
- Working lightweight routes:
  - `GET /health` -> `200 ok`
  - `GET /ready` -> `200 ok`

## Repo mismatch findings
- The local checkout at `/Users/brandon/Projects/fieldmetriq-core` is not the live frontend deploy source.
- That checkout:
  - has remote `fieldmetriqdev/fieldmetriq-core`
  - is on branch `feat/work-module-p8-project-phases`
  - does not contain `apps/web`
  - does not contain the live Vercel commit `61fdd4f1e1560aa3580b947dc890b0f08ff68e01`
- The local checkout at `/Users/brandon/Projects/craft-and-board` does match the live frontend deploy shape.
- That checkout:
  - has remote `brandonbozarth/fieldmetriq-core`
  - contains `apps/web`
  - contains deployed Vercel commit `61fdd4f1e1560aa3580b947dc890b0f08ff68e01`

## Whether current local checkout is the real deploy source
- `/Users/brandon/Projects/fieldmetriq-core`: no for frontend, yes-ish for an older Railway backend lineage only
- `/Users/brandon/Projects/craft-and-board`: yes for the currently live Vercel frontend project

## Immediate cutover-safe plan based on findings
1. Keep the existing Railway-generated hostname as production fallback.
2. Attach `api.fieldmetriq.com` to the live Railway production service.
3. Add the exact DNS record Railway requires in Cloudflare:
   - `CNAME`
   - name `api`
   - target `u4uv13cn.up.railway.app`
   - proxy `DNS only` during verification
4. Wait for Railway to verify `api.fieldmetriq.com`.
5. Only after verification, update the live Vercel production env var `NEXT_PUBLIC_API_BASE_URL=https://api.fieldmetriq.com`.
6. Redeploy the Vercel production frontend and smoke test `craftandboard.com`.
