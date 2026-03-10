# Phase 5 Completion

## What was audited
- source sales routes, services, and Prisma model families in `fieldmetriq-core`
- canonical pricing, costing, sales-order, and project-domain concepts in `craft-and-board`

## Ownership decisions
- leads and proposals remain source-owned candidates for later read-first import
- deposits and Stripe need canonical abstractions in `craft-and-board`
- project payments need adapter-led ownership because they sit next to existing pricing/costing concepts

## Overlap risks
- payment vs pricing/costing semantics
- customer/contact vs sales-order customer fields
- audit-event duplication
- sales stage/status versus project/manufacturing stage/status

## Prisma-risk summary
- do not import payment, Stripe event, or deposit schema first
- do not duplicate org/user/payment identity keys
- bring in lead and proposal records before money flows

## Recommended Phase 6
- import `leads` and `proposals` as read-first bounded modules, with project-sales linkage and stage/audit adapters ahead of any payment or Stripe work

## What remains explicitly out of scope
- Stripe runtime code
- payment runtime code
- proposal acceptance writes
- deposit gate writes
- live provider or env changes
