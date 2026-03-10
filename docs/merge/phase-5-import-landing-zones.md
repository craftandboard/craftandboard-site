# Phase 5 Import Landing Zones

| Future module | Source slice | Required adapters first | Import mode | Wait until Stripe/payment abstraction exists |
| --- | --- | --- | --- | --- |
| `apps/api/src/modules/leads` | `lead-advance.routes.js`, sales-engine rules, sales audit helpers | org resolver, stage/status translation, audit adapter | read-first | no |
| `apps/api/src/modules/proposals` | `proposal-acceptance.routes.js`, proposal acceptance service, proposal models | project-sales linkage adapter, audit adapter | read-first | no |
| `apps/api/src/modules/deposits` | deposit gate route/service | payment ownership adapter, project linkage adapter, audit adapter | read-first first, writes later | yes |
| `apps/api/src/modules/projectPayments` | project payments route/service | payment ownership adapter, org resolver, audit adapter | read-first first, writes later | yes |
| `apps/api/src/modules/stripe` | Stripe checkout/webhook routes and Stripe service | Stripe customer/org adapter, payment ownership adapter, event adapter | defer | yes |
| `apps/api/src/modules/salesPipeline` | sales audit and stage transition helpers if separated from leads | stage/status translation adapter, audit adapter | defer unless needed | no |

## Recommended first bounded import after this phase
- `leads` and `proposals` as read-first slices.

## Why this order is safer
- They are source-owned and do not collide directly with target pricing tables.
- They let the canonical monorepo understand sales context before touching money movement.
- They keep Stripe and payment ownership deferred until abstractions are explicit.
