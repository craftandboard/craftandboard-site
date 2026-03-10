# Phase 1 Import Recommendation

## Recommended migration pattern by domain

| Domain | Recommended pattern | Reason |
| --- | --- | --- |
| Manufacturing | `adopt target keep source for reference` | The canonical repo already owns the full manufacturing route/module/test surface. |
| Orders / intake / fulfillment | `adopt target keep source for reference` | Order workflows are already better structured inside `apps/api`. |
| Labels / scans / artifacts | `adopt target keep source for reference` | Source backend does not present a comparable label/artifact subsystem. |
| Project tasks / work packs / phases | `import source into target largely as-is` | Source has the richer implementation and migration history for this slice. |
| Sales / proposal / lead advancement | `import source into target largely as-is` | This capability appears source-only and can later be modularized into `apps/api/src/modules`. |
| Payments / Stripe | `manual reconcile required` | Source owns payments, but target already owns costing/pricing concepts that will collide at schema and naming boundaries. |
| Auth / session | `manual reconcile required` | Both repos have real implementations; importing one over the other would be risky. |
| Org / permissions | `manual reconcile required` | Both repos model access control in different ways. |
| Prisma | `manual reconcile required` | Both repos already treat their own migration history as canonical. |
| Worker/scripts/test harness | `defer until later phase` | Script and test normalization should follow domain import decisions, not lead them. |

## Recommended Phase 2 shape
- Reconcile data-model and auth boundaries first.
- After those boundaries are explicit, import `fieldmetriq-core` in vertical slices instead of one repo-wide transplant.

## Proposed Phase 2 slice order
1. Auth and org boundary reconciliation design only.
2. Prisma model-family ownership decision for user/org/project/job/financial tables.
3. Import project/work-module routes and services from source into target module structure.
4. Import Stripe and project payment flows after the financial model boundary is explicit.
5. Normalize scripts, tests, and worker responsibilities after functional slices land.

## What not to do next
- Do not bulk-copy `src/routes` into `apps/api/src/routes`.
- Do not append source migrations into target migrations untouched.
- Do not rename existing target manufacturing routes to fit source project terminology before the lifecycle model is decided.
