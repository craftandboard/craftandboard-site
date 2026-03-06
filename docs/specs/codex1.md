# CODEX1 Scaffold Spec

This scaffold implemented the local Craft & Board foundation only.

## Included in CODEX1

- pnpm monorepo root with shared scripts
- Next.js web app with dashboard, orders, batches, stations, and settings routes
- Express API with health and placeholder operational endpoints
- BullMQ worker with registered queue names and local Redis-tolerant startup
- Python CAM service placeholder modules
- Shared TypeScript contracts package
- Prisma PostgreSQL schema and seed stub
- Docker Compose stack for Postgres and Redis
- VS Code workspace settings with a green visual identity
- Initial architecture and database documentation

## What the next spec should build

- Prisma migrations and first real persistence flows
- Order ingestion contracts and queue handoff
- Batch-building domain logic
- Shop-floor scan event workflows
- Python service API boundary for geometry and nesting
