# Phase 7 Write Audit

## Current read-first surface
- `GET /leads`
- `GET /leads/:leadLookup`
- `GET /proposals`
- `GET /proposals/:proposalLookup`
- target-owned lead/proposal context adapters
- target-owned status translation adapters
- target-owned lead/proposal repositories

## Safe mutation candidates
- create lead
- update lead summary fields
- update lead status/stage
- create proposal
- update proposal summary fields and status
- create proposal sections
- update proposal sections
- create proposal lines
- update proposal lines

## Fields safe to mutate now
- lead:
  - `projectId`
  - `name`
  - `email`
  - `phone`
  - `address`
  - `status`
  - `stage`
  - `notes`
- proposal:
  - `projectId`
  - `leadId`
  - `title`
  - `status`
  - `version`
  - `publicToken`
- proposal section:
  - `title`
  - `sortOrder`
- proposal line:
  - `sectionId`
  - `name`
  - `description`
  - `qty`
  - `unit`
  - `priceCents`
  - `sortOrder`

## Fields that should remain deferred
- deposit/payment state
- Stripe linkage
- proposal acceptance side effects
- customer/contact import
- conversion automation
- invoice/email/send flows

## Route plan for this phase
- `POST /leads`
- `PATCH /leads/:leadId`
- `POST /proposals`
- `PATCH /proposals/:proposalId`
- `POST /proposals/:proposalId/sections`
- `PATCH /proposals/:proposalId/sections/:sectionId`
- `POST /proposals/:proposalId/lines`
- `PATCH /proposals/:proposalId/lines/:lineId`
