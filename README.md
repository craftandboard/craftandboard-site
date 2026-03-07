# Craft & Board

Craft & Board is a local-first monorepo foundation for a manufacturing SaaS platform. This scaffold now includes Seller Central style Amazon fixture ingestion, persisted production bundles, a first-party shelf label system, and a first-pass 4x8 sheet nesting plus Syntec `.NC` generation workflow for shelf manufacturing.

## What is included

- `apps/web`: Next.js App Router frontend for operations dashboards
- `apps/api`: Express API with typed import, order, and production endpoints
- `apps/worker`: BullMQ worker foundation with queue registration
- `services/python-cam`: Python service placeholder for geometry, nesting, and CNC work
- `packages/shared`: Shared TypeScript contracts for core entities
- `prisma`: PostgreSQL Prisma schema and seed stub
- `infrastructure/docker`: Docker Compose for Postgres and Redis
- `docs`: Architecture and specification notes for this scaffold
- `apps/api/src/fixtures/orders`: transitional pre-Amazon normalized order fixtures
- `apps/api/src/fixtures/amazon-seller-central`: Seller Central style Amazon import fixtures
- `apps/api/src/modules/imports`: validation and normalization logic
- `apps/api/src/modules/ordersImport`: fixture loading, persistence, and part expansion
- `apps/api/src/modules/amazonImport`: Seller Central style field mapping and persistence
- `apps/api/src/modules/productionOutputs`: report and export view-model generation
- `apps/api/src/modules/productionBundles`: production bundle grouping and legacy-style output package generation
- `apps/api/src/modules/labels`: shelf label mapping, barcode generation, and printable HTML output
- `apps/api/src/modules/nesting`: deterministic 4x8 sheet packing engine
- `apps/api/src/modules/cnc`: Syntec `.NC` generation for nested sheets
- `apps/api/src/modules/sheetMaps`: SVG/HTML/JSON sheet map rendering
- `apps/api/src/modules/manufacturingJobs`: manufacturing orchestration, persistence, and artifact metadata

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
corepack pnpm install
```

Start Postgres and Redis:

```bash
corepack pnpm db:up
```

Generate the Prisma client:

```bash
PATH="$PWD/scripts:$PATH" corepack pnpm prisma generate
```

Push the current schema into the local database:

```bash
PATH="$PWD/scripts:$PATH" corepack pnpm prisma db push
```

Run the full local stack:

```bash
corepack pnpm dev
```

Preview Amazon fixture import:

```bash
curl http://localhost:4000/orders/import/amazon-fixtures/preview
```

Import Amazon Seller Central style fixtures:

```bash
curl -X POST http://localhost:4000/orders/import/amazon-fixtures
```

Legacy normalized fixture import remains available for comparison:

```bash
curl -X POST http://localhost:4000/orders/import/fixtures
```

Inspect the normalized outputs:

```bash
curl "http://localhost:4000/production/daily?shipByDate=2026-03-10"
curl "http://localhost:4000/production/labels?shipByDate=2026-03-10"
curl "http://localhost:4000/production/optimizer?shipByDate=2026-03-10"
curl "http://localhost:4000/production/legacy-xml?shipByDate=2026-03-10"
```

Inspect production bundles:

```bash
curl "http://localhost:4000/production/bundles"
curl "http://localhost:4000/production/bundles/20260310-WHITE_MELAMINE"
```

Inspect the built-in label engine:

```bash
curl "http://localhost:4000/labels/bundles"
curl "http://localhost:4000/labels/bundles/20260310-WHITE_MELAMINE"
curl "http://localhost:4000/labels/bundles/20260310-WHITE_MELAMINE/html"
```

Build nesting and CNC outputs:

```bash
curl -X POST http://localhost:4000/manufacturing/bundles/20260310-WHITE_MELAMINE/nest
curl http://localhost:4000/manufacturing/bundles/20260310-WHITE_MELAMINE/nest
curl -X POST http://localhost:4000/manufacturing/bundles/20260310-WHITE_MELAMINE/cnc
curl http://localhost:4000/manufacturing/bundles/20260310-WHITE_MELAMINE/cnc
```

Exercise the shared configurator contract in the browser:

```bash
open http://localhost:3000/configurator-test
```

Individual processes:

```bash
corepack pnpm dev:web
corepack pnpm dev:api
corepack pnpm dev:worker
```

Python CAM service:

```bash
cd services/python-cam
python3 main.py
```

Stop Postgres and Redis:

```bash
corepack pnpm db:down
```

## New local workflow

- Preview or import Amazon Seller Central style fixtures from the Orders page
- Persist normalized orders and physical parts in PostgreSQL
- Open the Orders page to inspect imported customer orders
- Open `/production` to inspect bundle summaries separated by ship-by date and material
- Open `/production/[bundleCode]` to inspect pick list, labels, optimizer rows, and legacy XML
- Open `/labels` to preview and print the in-app shelf labels
- Open `/manufacturing` to build nesting, inspect sheet maps, and preview generated CNC jobs
- Open `/configurator-test` to exercise the website-facing validate/normalize/quote API contract
- Use the production bundle endpoints as the contract layer for future PDF, nesting, CNC, and shipping integrations

## Intentionally not implemented yet

- Live Amazon SP-API integration
- ShipStation integration
- Batching logic beyond placeholders
- QR-driven shop-floor workflows
- Authentication, tenancy enforcement, and production infra

This repository is still local-first and integration-light. The current Amazon flow is fixture-driven so the normalization, bundle, and label pipeline can be validated before live marketplace connectivity is introduced.
