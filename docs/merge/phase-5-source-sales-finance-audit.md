# Phase 5 Source Sales / Finance Audit

## Source files inspected
- `/Users/brandon/Projects/fieldmetriq-core/src/routes/lead-advance.routes.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/routes/project-deposit-gate.routes.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/routes/project-payments.routes.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/routes/proposal-acceptance.routes.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/routes/stripeCheckout.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/routes/stripeWebhook.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/services/project-deposit-gate.service.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/services/proposal-acceptance.service.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/services/stripe.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/services/sales-audit.service.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/services/sales-engine.rules.js`
- `/Users/brandon/Projects/fieldmetriq-core/prisma/schema.prisma`

## Route groups found
- lead state transition:
  - `POST /leads/:leadId/advance`
- proposal acceptance:
  - `POST /proposals/:proposalId/accept`
- deposit gate:
  - `POST /projects/:projectId/deposit/mark-received`
  - `POST /projects/:projectId/deposit/clear-received`
- project payments:
  - `GET /projects/:projectId/payments`
  - `POST /projects/:projectId/payments`
- Stripe:
  - webhook route with raw-body handling
  - checkout route exists in source set and depends on Stripe client plus app URL conventions

## Services and modules found
- `project-deposit-gate.service.js`
- `proposal-acceptance.service.js`
- `stripe.js`
- `sales-audit.service.js`
- `sales-engine.rules.js`
- `sales-navigation-guard.js`
- `project-financial-snapshot.service.js`

## Prisma model families found
- sales pipeline:
  - `Lead`
  - `Contact`
- proposal and acceptance:
  - `Proposal`
  - `ProposalSection`
  - `ProposalLine`
- money:
  - `Payment`
  - `ProjectPayment`
  - `StripeEvent`
  - `WebhookEvent`
- finance context:
  - `ProjectFinancialBaseline`
  - `ChangeOrder`
  - `Estimate`
- ownership anchors:
  - `Org`
  - `OrgMember`
  - `User`
  - `Project`
  - `Job`
  - `AuditEvent`

## Strong dependencies found
- source sales and finance runtime assumes source-owned:
  - `Org` and `OrgMember`
  - source capability names
  - source `Project` and `Job` lifecycle
  - source `Lead` status machine
  - source `AuditEvent`
- proposal acceptance mutates lead lifecycle and depends on project linkage.
- deposit gate reads/writes project deposit state and falls back to audit-event history when columns are missing.
- Stripe webhook processing depends on queue jobs, webhook secrets, and Stripe event idempotency.

## What clearly belongs together
- leads + sales-stage transitions
- proposals + proposal acceptance
- deposits + project payments
- Stripe webhook + Stripe event persistence + payment ingestion
- sales audit trail + lifecycle state transitions

## What must stay out initially
- Stripe runtime routes and secrets
- payment write flows
- proposal acceptance writes
- lead mutation flows
- queue/job processing tied to webhook ingestion
- any source auth or source permission model

## Import-safe conclusion
- The source sales/finance slice is coherent as a domain, but too coupled to import piecemeal without adapters.
- The first safe bounded import later should be read-first sales records, not Stripe or payment writes.
