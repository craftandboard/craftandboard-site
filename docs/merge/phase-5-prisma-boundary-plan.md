# Phase 5 Prisma Boundary Plan

## Safe future import candidates
- `Lead`
- `Contact`
- `Proposal`
- proposal section/line families
- source sales-audit supporting records if kept clearly namespaced

## Overlap requiring manual reconciliation
- `Payment`
- `ProjectPayment`
- `AuditEvent`
- project lifecycle linkage fields between sales and project domains
- project deposit state representation
- any customer/contact linkage touching existing sales-order customer fields

## Must not duplicate
- `Organization` / `Org` ownership keys
- `User` identity keys
- org membership records
- Stripe event identity keys
- project primary keys once linked to canonical `Project`

## Should be represented by adapter only at first
- deposit state on project records
- proposal acceptance side effects on projects
- sales-stage transitions reflected in project lifecycle
- payment totals derived into project views
- customer/contact hydration into target project records

## Deferred until after Phase 6+
- `Payment`
- `ProjectPayment`
- `StripeEvent`
- `WebhookEvent`
- full financial baseline and change-order families

## Prisma-risk summary
- The highest-risk area is money state, because source payment records and target pricing/costing artifacts live adjacent to each other but mean different things.
- Stripe event tables should not be introduced before canonical payment ownership is defined.
- Proposal and lead records can arrive earlier than money flows because they are less entangled with current target finance artifacts.
