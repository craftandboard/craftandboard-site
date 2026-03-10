# Phase 6 Source Slice Audit

## Source files inspected
- `/Users/brandon/Projects/fieldmetriq-core/src/routes/lead-advance.routes.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/routes/proposal-acceptance.routes.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/server.js` lead and project-linked sales read sections
- `/Users/brandon/Projects/fieldmetriq-core/src/services/sales-engine.rules.js`
- `/Users/brandon/Projects/fieldmetriq-core/src/services/next-action.service.js`
- `/Users/brandon/Projects/fieldmetriq-core/prisma/schema.prisma`

## Source dependencies found
- source lead status machine
- source proposal status values
- source project linkage from leads and proposals
- source `Org` and capability model
- source `Contact`, `Estimate`, `Proposal`, and `Project` linkage in read views

## What is safe to import now
- lead list intent
- lead detail intent
- proposal list intent
- proposal detail intent
- proposal section and line read models
- stage/status translation semantics
- project linkage summaries in read-only form

## What must stay out
- deposits
- payments
- Stripe and webhooks
- proposal acceptance writes
- lead advancement writes
- source auth/session runtime
- source audit/write side effects

## Exact target landing plan
- `apps/api/src/modules/leads/*`
- `apps/api/src/modules/proposals/*`
- `apps/api/src/routes/leads.ts`
- `apps/api/src/routes/proposals.ts`
- additive target Prisma models only for:
  - `Lead`
  - `Proposal`
  - `ProposalSection`
  - `ProposalLine`
