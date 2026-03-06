# Craft & Board

Craft & Board is a local-first monorepo foundation for a manufacturing SaaS platform. This scaffold sets up the web app, API, worker, Python manufacturing service, shared types, Prisma schema, Redis/Postgres dev stack, and workspace docs without implementing production integrations yet.

## What is included

- `apps/web`: Next.js App Router frontend for operations dashboards
- `apps/api`: Express API with typed placeholder endpoints
- `apps/worker`: BullMQ worker foundation with queue registration
- `services/python-cam`: Python service placeholder for geometry, nesting, and CNC work
- `packages/shared`: Shared TypeScript contracts for core entities
- `prisma`: PostgreSQL Prisma schema and seed stub
- `infrastructure/docker`: Docker Compose for Postgres and Redis
- `docs`: Architecture and specification notes for this scaffold

## Folder structure

```text
craft-and-board/
  apps/
    api/
    web/
    worker/
  docs/
    architecture/
    specs/
  infrastructure/
    docker/
  packages/
    shared/
  prisma/
  scripts/
  services/
    python-cam/
```

## Prerequisites

- Node.js 20+
- `pnpm` 9+ or Corepack-enabled Node
- Python 3.10+
- Docker Desktop or another local Docker runtime

If `pnpm` is not installed:

```bash
corepack enable
corepack prepare pnpm@9.15.5 --activate
```

## Environment

Copy `.env.example` to `.env` before starting local services.

## Start the foundation

Install dependencies:

```bash
pnpm install
```

Start Postgres and Redis:

```bash
pnpm db:up
```

Generate the Prisma client:

```bash
pnpm prisma:generate
```

Run the full local stack:

```bash
pnpm dev
```

Individual processes:

```bash
pnpm dev:web
pnpm dev:api
pnpm dev:worker
```

Python CAM service:

```bash
cd services/python-cam
python3 main.py
```

Stop Postgres and Redis:

```bash
pnpm db:down
```

## Intentionally not implemented yet

- Amazon order ingestion
- ShipStation integration
- Batching logic beyond placeholders
- Nesting, toolpathing, and CNC output
- QR-driven shop-floor workflows
- Authentication, tenancy enforcement, and production infra

This repository is foundation-only so feature work can build on a clean modular base.
