# Tenant Bootstrap Results

## Schema Changes Made
- Added `OrgSettings`
- Added `UnitSystem`
- Linked `Organization.settings`

## Seed / Bootstrap Behavior Added
- Craft & Board is now the formal bootstrap tenant:
  - name: `Craft & Board`
  - slug: `craftandboard`
- Existing internal bootstrap org id was intentionally preserved as `org_local_craft_board` for compatibility with the current codebase and tests.
- Bootstrap path is now available through the settings layer:
  - `ensureCraftBoardTenantBootstrap()`
- Bootstrap seeding now ensures:
  - organization row
  - org settings row
  - existing starter machine/material/costing/pricing/label/container/remnant defaults

## Entities Now Org-Scoped
Already org-scoped and preserved in this branch:
- organization membership and auth context
- machines and machine telemetry entities
- manufacturing jobs, packets, parts, and manufacturing batches
- labels and scan events
- containers, locations, assignments, and sessions
- remnants, movements, and allocations
- costing and pricing profiles/scenarios
- sales orders, sales order items, and shelf jobs

Newly clarified in this branch:
- org-level settings and bootstrap defaults

## Entities Deferred To Next Phase
Deferred to `feat/schema-unification-orders-manufacturing`:
- deeper reconciliation of legacy `Order` / `Part` / `Batch` paths with newer `SalesOrder` / `ManufacturingPart` / `ManufacturingBatch`
- tightening nullable `organizationId` fields that still exist on legacy models
- single canonical settings/config surface across all manufacturing domains
- any broader extraction into platform package boundaries

## Temporary Fallback Behaviors
- backend bootstrap/default-org fallback remains centralized through settings/request-context behavior
- local/dev/test behavior still defaults to the Craft & Board bootstrap org when explicit org context is absent
- this is transitional and should later be tightened by explicit tenant/org context in runtime auth flows

## Risks / Follow-Up Items
- the bootstrap org id is still a legacy internal identifier; it is stable, but not yet renamed for platform purity
- some older service modules still default to `LOCAL_ORG_ID`; the fallback is centralized in one module, but not yet fully removed from legacy callers
- schema unification is still needed before calling the platform data model fully canonical

## Recommendation For Next Branch
- `feat/schema-unification-orders-manufacturing`

This branch should reconcile overlapping order/manufacturing concepts while preserving the new tenant bootstrap baseline.
