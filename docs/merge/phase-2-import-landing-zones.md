# Phase 2 Import Landing Zones

## Landing-zone rule
- Imported code from `fieldmetriq-core` should land as bounded modules inside `apps/api/src/modules`.
- No Phase 3 slice should arrive as a second monolithic server.

## Recommended landing zones

| Future landing zone | Intended source slice | Dependency risks | Required adapters first | Phase 3 import mode |
| --- | --- | --- | --- | --- |
| `apps/api/src/modules/projects` | `project-*.routes.js`, project services, project lifecycle logic | high | auth/session, org resolver, prisma naming plan | read-only first |
| `apps/api/src/modules/workModules` | `project-tasks.routes.js`, `project-work-pack.routes.js`, `project-work-notes.routes.js`, work-pack services | high | auth/session, org resolver, project/job terminology adapter | read-only first |
| `apps/api/src/modules/projectPayments` | `project-payments.routes.js`, `project-deposit-gate.routes.js`, payment services | high | payment ownership adapter, prisma translation, auth/org adapter | read-only first |
| `apps/api/src/modules/stripe` | `stripeCheckout.js`, `stripeWebhook.js`, `services/stripe.js` | high | payment ownership adapter, webhook/event identity mapping | read-only first |
| `apps/api/src/modules/proposals` | `proposal-acceptance.routes.js`, proposal services | medium | org resolver, project terminology adapter | read-only first |
| `apps/api/src/modules/leads` | `lead-advance.routes.js`, lead-next-action services | medium | org resolver, audit/event mapping | read-only first |
| `apps/api/src/modules/adminOps` | selected operational services/scripts only if still needed | medium | runtime contract adapter | defer until later |

## Landing notes by slice

### `projects`
- First real import target after boundaries are fixed.
- Owns service-delivery project concepts, not manufacturing order fulfillment.
- Must not reuse target `Order` as a silent substitute for source `Project`.

### `workModules`
- Best narrow Phase 3 slice because it is feature-rich and source-owned.
- Should be imported behind target request-context and authorization helpers.
- Start with read endpoints and derived-state logic before write-heavy task mutations.

### `projectPayments`
- Must stay decoupled from target pricing/costing until the finance seam is explicit.
- Import read and audit views before checkout/deposit mutations.

### `stripe`
- Should remain a separate module boundary from generic project payments.
- Webhook idempotency rules are source-owned and should be preserved, but adapted.

## Why no scaffolding folders were added in this phase
- The landing zones are now explicit in docs.
- Empty module folders would not yet clarify runtime boundaries further.
- Scaffolding should be created only in the same phase that begins the first bounded import slice.
