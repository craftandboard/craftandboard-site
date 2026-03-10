# Phase 10 Proposal Acceptance + Conversion Boundary Audit

## What Was Added

- A target-owned proposal orchestration module at `apps/api/src/modules/proposalOrchestration`.
- Canonical acceptance, conversion, and orchestration-log Prisma models.
- Target-owned acceptance and conversion routes.
- Eligibility evaluation tied to canonical proposal acceptance and payment summary truth.
- Target-owned project, proposal, and lead adapters so conversion side effects stay explicit.

## Route List

- `POST /proposals/:proposalId/acceptance`
- `GET /proposals/:proposalId/acceptance`
- `PATCH /proposals/:proposalId/acceptance`
- `POST /proposals/:proposalId/conversion-evaluation`
- `GET /proposals/:proposalId/conversion`
- `POST /proposals/:proposalId/convert`
- `GET /proposals/:proposalId/orchestration-logs`

## Canonical Enums / Statuses

- `ProposalDepositPolicy`
  - `NO_DEPOSIT_REQUIRED`
  - `DEPOSIT_REQUIRED_BEFORE_CONVERSION`
- `ProposalAcceptanceStatus`
  - `PENDING`
  - `ACCEPTED`
  - `REJECTED`
  - `CANCELED`
- `ProposalAcceptanceDecisionSource`
  - `MANUAL_INTERNAL`
  - `MANUAL_EXTERNAL`
  - `PROVIDER_CONFIRMED`
- `ProposalConversionStatus`
  - `PENDING`
  - `ELIGIBLE`
  - `BLOCKED`
  - `CONVERTED`
  - `FAILED`
  - `CANCELED`
- `ProposalOrchestrationAction`
  - `ACCEPTANCE_CREATED`
  - `ACCEPTANCE_ACCEPTED`
  - `ACCEPTANCE_REJECTED`
  - `ACCEPTANCE_CANCELED`
  - `ELIGIBILITY_CHECKED`
  - `CONVERSION_MARKED_ELIGIBLE`
  - `CONVERSION_BLOCKED`
  - `PROJECT_CREATED`
  - `LEAD_STATUS_SYNCED`
  - `PROPOSAL_STATUS_SYNCED`
  - `REQUEST_IGNORED_DUPLICATE`
  - `ORCHESTRATION_FAILED`
- `ProposalOrchestrationOutcome`
  - `APPLIED`
  - `SKIPPED`
  - `FAILED`

## Business Rules Enforced

- Acceptance is canonical business truth and must pass through the orchestration service.
- Conversion eligibility requires an accepted proposal.
- Deposit-required proposals must satisfy the canonical payment summary before conversion.
- Provider-confirmed acceptance remains an orchestrator input, not a provider-route side effect.
- Repeated accept and convert requests are idempotent and logged as skipped when appropriate.

## Intentionally Excluded

- E-signature provider integration
- Invoice generation
- Accounting sync
- Customer/contact sync
- Manufacturing or fulfillment automation
- Direct provider-event to project creation coupling

## Risks / Follow-Up

- Proposal status sync currently uses existing proposal status conventions and archives the proposal after conversion.
- Lead status sync remains adapter-led and only updates canonical sales status.
- Future external acceptance flows should feed this orchestrator rather than bypass it.
