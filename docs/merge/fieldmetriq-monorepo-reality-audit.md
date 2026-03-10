# FieldMetriq Monorepo Reality Audit

## Current workspace
- Path: `/Users/brandon/Projects/craft-and-board`
- Git remote:
  - `origin` -> `https://github.com/brandonbozarth/fieldmetriq-core.git`
  - `legacy-craft-board` -> `https://github.com/craftandboard/craftandboard-site.git`
- Branch: `chore/live-deploy-reconcile-and-api-domain-cutover`
- Git status: dirty, `34` changed or untracked paths
- Structure present:
  - `apps/`
  - `packages/`
  - `prisma/`
  - `docs/`
  - `scripts/`
- `apps/` present:
  - `apps/web`
  - `apps/api`
  - `apps/worker`
- `packages/` present:
  - `packages/shared`
  - `packages/costing`
  - `packages/integrations`
  - `packages/manufacturing`
- Classification: mixed monorepo, already close to the preferred target shape

## Repo: craft-and-board
- Path: `/Users/brandon/Projects/craft-and-board`
- Git remote:
  - `origin` -> `https://github.com/brandonbozarth/fieldmetriq-core.git`
  - `legacy-craft-board` -> `https://github.com/craftandboard/craftandboard-site.git`
- Branch: `chore/live-deploy-reconcile-and-api-domain-cutover`
- Git status: dirty, `34` changed or untracked paths
- Workspace tools present:
  - `package.json`
  - `pnpm-workspace.yaml`
- Structure present:
  - `apps/web`
  - `apps/api`
  - `apps/worker`
  - `packages/*`
  - `prisma`
  - `docs`
  - `scripts`
- Classification: mixed monorepo, frontend-first in current deploy ownership but already includes backend, worker, packages, and Prisma

## Repo: fieldmetriq-core
- Path: `/Users/brandon/Projects/fieldmetriq-core`
- Git remote:
  - `origin` -> `https://github.com/fieldmetriqdev/fieldmetriq-core.git`
- Branch: `feat/work-module-p8-project-phases`
- Git status: dirty, `27` changed or untracked paths
- Workspace tools present:
  - `package.json`
  - `railway.toml`
  - `Dockerfile`
- Structure present:
  - `src`
  - `prisma`
  - `docs`
  - `scripts`
- Not present:
  - `apps/web`
  - `apps/api`
  - `packages/*`
  - `pnpm-workspace.yaml`
- Classification: backend-first single-service repo with Prisma, routes, services, views, and extensive test coverage

## Monorepo resemblance summary
- `craft-and-board` already resembles a real monorepo.
- `fieldmetriq-core` does not resemble a monorepo yet; it is a single-service backend/application repo.
- The split reality today is:
  - frontend/live Vercel work comes from `craft-and-board`
  - backend/live Railway work comes from `fieldmetriq-core`
