# Current To Target Mapping

| Current Area | Current Path / Module | Target Platform Domain | Target Location Later | Migration Phase | Notes |
| --- | --- | --- | --- | --- | --- |
| machineTelemetry module | `apps/api/src/modules/machineTelemetry/*` | integrations + manufacturing evidence | `packages/integrations` and `packages/manufacturing` | Phase 4 | Source-specific parsing should stay at integrations boundary |
| machines module | `apps/api/src/modules/machines/*` | manufacturing ops core | `packages/manufacturing` or `packages/integrations` boundary | Phase 4 | Registry may stay close to telemetry boundary |
| trustedAutoApply module | `apps/api/src/modules/trustedAutoApply/*` | manufacturing operational rules | `packages/manufacturing` | Phase 4 | Review-first automation guardrails remain platform-level |
| stageSignals module | `apps/api/src/modules/stageSignals/*` | manufacturing operational rules | `packages/manufacturing` | Phase 4 | Shared operational evidence layer |
| containers workflow | `apps/api/src/modules/containers/*` | inventory + scanning | `packages/inventory` and `packages/scanning` | Phase 4 | Physical location and assignment concerns may split later |
| manufacturing jobs | current manufacturing/order intake/manufacturing expansion modules | manufacturing | `packages/manufacturing` | Phase 3-4 | Requires schema unification |
| parts | `apps/api/src/modules/manufacturingExpansion/*` and related routes | manufacturing | `packages/manufacturing` | Phase 3-4 | Must preserve lineage to orders and jobs |
| labels/scans | `apps/api/src/modules/labels/*`, `apps/api/src/modules/scanning/*` | labeling + scanning | `packages/labeling`, `packages/scanning` | Phase 4 | Keep payload contracts stable |
| remnant/material features | `apps/api/src/modules/remnants/*`, material forecast hooks | inventory | `packages/inventory` | Phase 4-5 | Tied to planning and material reuse |
| amazon import | `apps/api/src/modules/amazonImport/*` | integrations | `packages/integrations` | Phase 4 | Tenant parsing/config should be parameterized |
| costing inputs | `apps/api/src/modules/costing/*` | costing | `packages/costing` | Phase 5 | Core math is platform-level |
| packaging/shipping logic | pricing + costing modules | costing | `packages/costing` | Phase 5 | Tenant assumptions should stay configurable |
| frontend ops routes | `apps/web/src/app/*` operational pages | ui | `packages/ui` plus `apps/web` composition | Phase 6 | Preserve working operator flows during migration |
| prisma schema | `prisma/schema.prisma` | shared platform data model | `prisma/` in `fieldmetriq-core` | Phase 3 | Single canonical schema only |
