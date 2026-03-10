# Phase 10 Proposal Orchestration Audit

This file mirrors the Phase 10 orchestration audit under the exact spec-requested filename.

See also:

- `docs/merge/phase-10-orchestration-boundary-audit.md`

## What Acceptance / Conversion / Audit Models Were Added

- `ProposalAcceptance`
- `ProposalConversion`
- `ProposalOrchestrationLog`
- `Proposal.depositPolicy`

## Exact Route List

- `POST /proposals/:proposalId/acceptance`
- `GET /proposals/:proposalId/acceptance`
- `PATCH /proposals/:proposalId/acceptance`
- `POST /proposals/:proposalId/conversion-evaluation`
- `GET /proposals/:proposalId/conversion`
- `POST /proposals/:proposalId/convert`
- `GET /proposals/:proposalId/orchestration-logs`

## Exact Enums / Statuses Introduced

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

## Exact Eligibility Rules Enforced

1. Proposal must exist in org scope.
2. Proposal cannot already be in a blocked state like rejected or archived.
3. Acceptance status must be `ACCEPTED`.
4. When deposit policy is `DEPOSIT_REQUIRED_BEFORE_CONVERSION`, canonical Phase 8 payment summary truth must show the required deposit as satisfied.
5. Proposal must not already be converted.
6. Existing linked project or converted conversion record blocks duplicate conversion.
7. Lead / proposal / project linkage is evaluated through target-owned adapters only.

## Project Creation Boundary

Project creation is adapter-backed and target-owned through `apps/api/src/modules/proposalOrchestration/projectAdapter.ts`, which integrates with the existing canonical project model and repository layer instead of performing scattered route-level Prisma writes.

## Deferred

- E-signature provider integration
- Quote/proposal public acceptance portal
- Invoice generation
- Accounting sync
- Customer/contact sync
- Manufacturing automation
