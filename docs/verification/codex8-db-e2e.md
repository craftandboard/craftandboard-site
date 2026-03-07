# CODEX8 DB-Backed E2E Verification

## Date
- 2026-03-06 America/Los_Angeles

## Goal
Verify the full persisted Craft & Board manufacturing lifecycle against local Postgres and capture any runtime mismatches that only appear with a real database.

## Commands Run
```bash
corepack pnpm --filter api test
PATH="$PWD/scripts:$PATH" corepack pnpm prisma generate
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/craftandboard' PATH="$PWD/scripts:$PATH" corepack pnpm prisma db push
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/craftandboard' node --input-type=module - <<'EOF_NODE'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  const result = await prisma.$queryRawUnsafe('select current_database() as db, current_user as role');
  console.log(result);
} finally {
  await prisma.$disconnect();
}
EOF_NODE
```

## Environment Findings
- Docker daemon is not running in this environment.
- `localhost:5432` is open.
- The local database server rejects the scaffold default credentials `postgres/postgres`.
- Prisma client initialization fails with: `Authentication failed against database server, the provided database credentials for postgres are not valid.`

## What Was Verified Successfully
- Prisma client generation succeeds.
- API tests pass, including:
  - lifecycle routes
  - packet versioning
  - configurator endpoints
  - existing normalization/nesting tests
- API build passes.
- Web build passes.
- Root workspace build passes.

## Full Persisted Lifecycle Status
### Blocked
The full DB-backed lifecycle could not be completed in this environment because Postgres credentials do not match the scaffold configuration.

This blocked:
- schema push
- persisted Amazon fixture import
- persisted bundle release/nest/CNC lifecycle execution
- persisted regeneration verification
- persisted fail-path verification

## Issues Found
1. Prisma CLI did not automatically receive `DATABASE_URL` because there is no checked-in `.env` file.
   - Fix applied: commands were retried with `DATABASE_URL=...` injected explicitly.
2. The reachable local Postgres server is not using the scaffold credentials.
   - No code fix was possible from inside this repository.
   - This is an environment/configuration mismatch.

## Hardening Applied During CODEX8
Even without a writable local Postgres session, the following production-readiness improvements were implemented:
- lifecycle actions now behave idempotently for repeated release/approve/post/complete/fail calls
- lifecycle route errors can now return structured `details`
- manufacturing bundle UI now separates current vs superseded sheets, CNC jobs, and artifacts
- bundle packet now includes machine/material profile details and onion-skin warnings
- configurator test harness page added at `/configurator-test`

## Known-Good Verification Sequence Once DB Credentials Are Correct
```bash
corepack pnpm install
PATH="$PWD/scripts:$PATH" corepack pnpm prisma generate
PATH="$PWD/scripts:$PATH" corepack pnpm prisma db push
corepack pnpm dev
curl -X POST http://localhost:4000/orders/import/amazon-fixtures
curl -X POST http://localhost:4000/manufacturing/bundles/20260310-WHITE_MELAMINE/release
curl -X POST http://localhost:4000/manufacturing/bundles/20260310-WHITE_MELAMINE/nest
curl -X POST http://localhost:4000/manufacturing/bundles/20260310-WHITE_MELAMINE/nest/approve
curl -X POST http://localhost:4000/manufacturing/bundles/20260310-WHITE_MELAMINE/cnc
curl -X POST http://localhost:4000/manufacturing/bundles/20260310-WHITE_MELAMINE/cnc/approve
curl -X POST http://localhost:4000/manufacturing/bundles/20260310-WHITE_MELAMINE/packet
curl http://localhost:4000/manufacturing/bundles/20260310-WHITE_MELAMINE
```

## Additional Checks To Run Once DB Is Fixed
- repeat `release` and confirm no duplicate state corruption
- repeat `nest/approve` and `cnc/approve` and confirm stable idempotent responses
- regenerate packet twice and confirm one current packet artifact plus superseded history
- run `POST /manufacturing/cnc/:jobId/post`
- run `POST /manufacturing/cnc/:jobId/complete`
- run fail path on a second bundle/job using `POST /manufacturing/cnc/:jobId/fail`
- verify `/manufacturing/[bundleCode]` shows current and superseded records correctly
