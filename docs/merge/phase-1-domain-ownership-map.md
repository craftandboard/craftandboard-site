# Phase 1 Domain Ownership Map

## Ownership assessment

| Domain | Stronger source of truth now | Confidence | Migration risk | Reason |
| --- | --- | --- | --- | --- |
| Auth | split | medium | high | Both repos implement login/session behavior, but with different routing and runtime assumptions. |
| Org / member / access control | split | medium | high | Target has explicit org/member APIs, source has security and permission layers tied to its own app model. |
| Projects / jobs / work modules | fieldmetriq-core | high | high | Source has dedicated project-task, work-pack, phase, and job-spine flows plus migrations. |
| Orders | craft-and-board | high | medium | Target owns order intake, orders, fulfillment, and adjacent manufacturing handoff. |
| Manufacturing | craft-and-board | high | medium | Target has broad route/module/test coverage for manufacturing-floor workflows. |
| Labels / artifacts | craft-and-board | high | medium | Target owns labels, artifact generation, scanning, and manufacturing label outputs. |
| Payments / billing | split | medium | high | Source owns Stripe and project payment flows, target owns costing/pricing; these are adjacent but not identical. |
| Background workers | craft-and-board | medium | medium | Target already has `apps/worker` and API job helpers, but source still has operational job scripts. |
| Admin / internal tools | fieldmetriq-core | medium | medium | Source has more internal operational scripts and monolithic service admin surface. |
| Health / readiness / runtime diagnostics | split | high | low | Both repos expose health behavior; conventions just need to be normalized. |

## Domain-by-domain reading

### Domains to preserve in target as the baseline
- orders
- manufacturing
- labels and artifact generation
- machine and floor telemetry

### Domains likely to import from source later
- project phases and work modules
- project payments
- Stripe webhook and checkout handling
- sales transition flows such as proposal acceptance and lead advancement

### Domains that must be reconciled before any import
- auth/session
- org/member/access control
- Prisma ownership
- “job” terminology and lifecycle boundaries
