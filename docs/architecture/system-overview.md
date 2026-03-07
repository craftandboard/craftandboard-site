# System Overview

Craft & Board uses a pnpm monorepo so the web app, API, worker, shared types, Prisma schema, and future manufacturing services can evolve together with low coordination cost.

## Structure

- `apps/web` provides the operator-facing interface using Next.js App Router.
- `apps/api` exposes HTTP endpoints for fixture imports, orders, daily production outputs, reports, batches, stations, and health checks.
- `apps/worker` hosts background queue wiring for async workflows such as import and batch planning.
- `packages/shared` contains reusable TypeScript contracts.
- `services/python-cam` reserves the Python boundary for geometry, nesting, and CNC logic.
- `prisma` holds the PostgreSQL schema used by the Node services.

## Why this architecture

The split keeps UI, synchronous API behavior, async orchestration, and manufacturing computation isolated while still sharing contracts and tooling. That supports future multi-tenant growth without forcing all concerns into a single runtime.

The current workflow starts with local raw-order fixtures, normalizes them into orders, order items, and physical parts, and then generates production-report, label, optimizer, and legacy XML view models from persisted records.

## Planned later modules

- Amazon import pipelines
- Batch construction and optimization
- Nesting and sheet placement generation
- CNC post-processing and artifact generation
- QR-based scan flows for stations
- Shipping and label generation integrations
