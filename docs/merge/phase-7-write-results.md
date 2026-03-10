# Phase 7 Write Results

## Write surface added
- create lead
- update lead
- create proposal
- update proposal
- create proposal section
- update proposal section
- create proposal line
- update proposal line

## Adapters and repositories extended
- extended target lead/proposal context adapters with write capability accessors
- extended lead repository with create/update methods
- extended proposal repository with create/update plus section/line mutation methods
- extended status adapters with known-status and transition validation helpers

## Routes added
- `POST /leads`
- `PATCH /leads/:leadId`
- `POST /proposals`
- `PATCH /proposals/:proposalId`
- `POST /proposals/:proposalId/sections`
- `PATCH /proposals/:proposalId/sections/:sectionId`
- `POST /proposals/:proposalId/lines`
- `PATCH /proposals/:proposalId/lines/:lineId`

## Schema changes made or none
- none

## Tests added or updated
- expanded lead route tests
- expanded proposal route tests
- expanded lead service tests
- expanded proposal service tests

## What remains deferred
- deposits
- payments and project payments
- Stripe and webhooks
- proposal acceptance writes
- lead conversion automation
- customer/contact import

## Risks
- sales write behavior is intentionally narrower than the source CRM/proposal system
- proposal/project linkage is still lightweight and does not trigger downstream conversion logic

## Exact recommendation for Phase 8
- Phase 8 should define the deposit and payment abstraction seam before any money movement or Stripe import begins
