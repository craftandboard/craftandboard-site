# Target Architecture

## Platform Identity
- Canonical platform name: `FieldMetriq`
- Canonical target repo: `fieldmetriq-core`
- Craft & Board is the first tenant/business on the platform
- Current repo remains the working migration baseline until the move into `fieldmetriq-core` is complete

## Tenant Model
- The platform owns shared manufacturing, costing, labeling, scanning, telemetry, and operations capabilities.
- Tenants own org-scoped configuration, defaults, pricing assumptions, workstation naming, machine mapping, and integration credentials.
- Craft & Board should be represented as the first tenant/org bootstrap, not as a separate software platform.

## Target Repo Shape
```text
fieldmetriq-core/
  apps/
    api/
    web/
  packages/
    auth/
    ui/
    manufacturing/
    costing/
    labeling/
    scanning/
    inventory/
    integrations/
    shared/
  prisma/
  docs/
```

## Target Domain Modules
- `manufacturing`
  - manufacturing jobs
  - manufacturing parts
  - packets and batches
  - stage rules and operational lifecycle
- `labeling`
  - label payload contracts
  - printable label rendering
  - print pipeline abstractions
- `scanning`
  - scan event ledger
  - station workflow rules
  - scan-driven part and container actions
- `inventory`
  - materials/remnants
  - container and location tracking
  - inventory state and allocation records
- `costing`
  - cost engine
  - pricing engine
  - packaging and shipping assumptions
- `integrations`
  - Amazon import
  - future CSV/file/webhook connectors
  - machine-adapter boundary where source-specific parsing belongs
- `auth`
  - auth/session
  - org context
  - permissions and tenant bootstrap primitives
- `ui`
  - reusable operations UI and shared frontend components
- `shared`
  - cross-package contracts and primitive shared types

## Target Domain Mapping
- manufacturing jobs / parts -> `packages/manufacturing`
- labels / print pipeline -> `packages/labeling`
- scan events -> `packages/scanning`
- stage rules / trusted evidence -> `packages/manufacturing` with shared operational contracts where needed
- machine telemetry -> `packages/integrations` for source adapters and `packages/manufacturing` for normalized operational evidence
- materials / remnants / inventory -> `packages/inventory`
- cost engine / packaging / shipping -> `packages/costing`
- Amazon import -> `packages/integrations`
- auth / org context / permissions -> `packages/auth` plus `packages/shared`

## Deployment Split
- GitHub remains source control
- Vercel hosts frontend UI
- Railway hosts backend API, workers, and database
- Craft & Board public marketing/brand site may remain separate, but operations/manufacturing software belongs in FieldMetriq

## Migration Principles
- Prefer additive migration over destructive rewrite
- Preserve working routes and tests while moving boundaries
- Move shared capabilities into platform domains before applying tenant-specific customization
- Keep schema ownership singular; do not create parallel canonical models for the same concept
- Document every platform-vs-tenant decision in `docs/merge`

## What Stays Stable Vs What Moves Later
Stable now:
- current runtime apps
- current route surface
- current schema as the active source of truth
- current org-aware auth model

Moves later:
- module extraction into `packages/*`
- schema unification where duplicate concepts exist
- frontend ops unification
- canonical repo relocation into `fieldmetriq-core`
