# Phase 10 Proposal Orchestration Results

This file mirrors the Phase 10 orchestration results under the exact spec-requested filename.

See also:

- `docs/merge/phase-10-orchestration-boundary-results.md`

## What Was Added

- Target-owned acceptance/conversion/audit schema
- Target-owned orchestration services and adapters
- Acceptance, eligibility, conversion, and orchestration-log routes
- Idempotent conversion gating tied to canonical payment summary truth

## Acceptance / Conversion / Audit Models Added

- `ProposalAcceptance`
- `ProposalConversion`
- `ProposalOrchestrationLog`

## Exact Route List

- `POST /proposals/:proposalId/acceptance`
- `GET /proposals/:proposalId/acceptance`
- `PATCH /proposals/:proposalId/acceptance`
- `POST /proposals/:proposalId/conversion-evaluation`
- `GET /proposals/:proposalId/conversion`
- `POST /proposals/:proposalId/convert`
- `GET /proposals/:proposalId/orchestration-logs`

## Exact Eligibility Rules Enforced

- Accepted proposal required
- Deposit satisfaction required when deposit policy requires it
- Already converted proposals remain blocked from duplicate project creation
- Provider events remain decoupled from direct project creation and lead-stage automation

## Project Creation Path

Project creation uses the existing canonical project model through `projectAdapter.ts` and the established project repository/service boundary.

## Deferred To Later Phases

- E-signature provider integration
- Public acceptance workflows
- Invoice generation
- Accounting sync
- Customer/contact creation or sync
- Manufacturing/fulfillment automation
