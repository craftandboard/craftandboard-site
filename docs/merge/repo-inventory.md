# Repo Inventory

| Domain / Area | Present Now | Evidence / Files | Platform or Tenant | Recommended Action | Notes / Risks |
|---|---|---|---|---|---|
| Auth / session / identity | Yes | `apps/api/src/routes/auth.ts`, auth modules | Platform | KEEP | Reusable across tenants |
| Org / tenant model | Yes | Prisma org/user/member models | Platform | KEEP | Core multi-tenant foundation |
| Roles / permissions | Yes | `apps/api/src/lib/authorization.ts` | Platform | KEEP | Shared capability model |
| Prisma schema | Yes | `prisma/schema.prisma` | Platform | MOVE | High-conflict merge surface |
| Orders | Yes | legacy + intake routes | Platform | REFACTOR | Needs canonical order model alignment |
| Order items | Yes | intake schema/models | Platform | KEEP | Core demand lineage |
| Amazon import | Yes | existing amazon modules/tests | Tenant-configurable | MOVE | Keep framework, tenant mapping later |
| Product parsing / normalization | Yes | order intake + pricing defaults | Platform | KEEP | Product normalization framework belongs in platform |
| Manufacturing jobs | Yes | legacy `ManufacturingJob` plus newer `ShelfJob` | Platform | REFACTOR | Needs unification |
| Manufacturing parts | Yes | manufacturing expansion modules | Platform | KEEP | Core production unit |
| Labels / print pipeline | Yes | manufacturing labels + remnants labels | Platform | KEEP | Shared label framework |
| Scan events | Yes | scanning module, `ScanEvent` | Platform | KEEP | Shared ops evidence |
| Stage signals | Yes | `stageSignals` modules | Platform | KEEP | Review-first workflow |
| Trusted auto-apply rules | Yes | trusted auto-apply module | Platform | KEEP | Shared ops automation control |
| Machine events / telemetry | Yes | machine telemetry modules + routes | Platform | KEEP | Shared manufacturing evidence |
| Machine stage candidates | Yes | `MachineStageCandidate` | Platform | KEEP | Machine-derived signal layer |
| Container / bin workflow | Yes | containers workflow service/routes | Platform | KEEP | Shared physical flow model |
| Materials catalog | Partial | material profile setup in settings | Tenant-configurable | REFACTOR | Platform framework, tenant data |
| Remnant catalog | Yes | remnant services/routes/schema | Platform | KEEP | Shared inventory backbone |
| Inventory assumptions | Partial | remnants + containers only | Platform | REFACTOR | Broader stock model later |
| Edge band estimation | Yes | edge band modules/tests | Platform | KEEP | Shared planning engine |
| Material cost engine | Yes | costing modules/routes | Platform | KEEP | Core platform capability |
| Packaging cost inputs | Yes | pricing/packaging models | Tenant-configurable | KEEP | Tenant assumptions on platform models |
| Shipping cost inputs | Yes | pricing/costing assumptions | Tenant-configurable | KEEP | Tenant assumptions on platform models |
| Frontend routes / ops UI | Yes | Next app routes | Platform | MOVE | Should migrate into FieldMetriq ops UI |
| API route structure | Yes | `apps/api/src/routes/*` | Platform | KEEP | Needs consolidation, not replacement |
| Background jobs / workers | Yes | existing jobs/worker routes/modules | Platform | KEEP | Shared runtime capability |
| Seed scripts | Yes | settings + `prisma/seed.ts` | Tenant-configurable | REFACTOR | Keep structure, separate tenant seed data |
| Env vars / secrets | Partial | repo env usage scattered | Platform | REFACTOR | Needs target env matrix |
| Deployment config | Partial | current repo assumptions | Platform | REFACTOR | Move to Vercel + Railway topology |

