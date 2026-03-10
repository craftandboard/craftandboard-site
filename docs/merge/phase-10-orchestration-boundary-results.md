# Phase 10 Proposal Acceptance + Conversion Boundary Results

## Summary

Phase 10 added a canonical proposal acceptance and conversion orchestration layer on top of the existing proposal and payment boundaries. Acceptance, eligibility evaluation, conversion, and orchestration audit logging now run through one target-owned module instead of being left implicit or coupled to provider events.

## Schema Added

- `ProposalAcceptance`
- `ProposalConversion`
- `ProposalOrchestrationLog`
- `Proposal.depositPolicy`

Migration:

- `prisma/migrations/20260309223000_add_proposal_acceptance_conversion_boundary`

## Services / Adapters Added

- `service.ts`
- `repository.ts`
- `statusAdapter.ts`
- `eligibility.ts`
- `projectAdapter.ts`
- `leadAdapter.ts`
- `proposalAdapter.ts`
- `audit.ts`
- `contextAdapter.ts`

## Routes Added

- `POST /proposals/:proposalId/acceptance`
- `GET /proposals/:proposalId/acceptance`
- `PATCH /proposals/:proposalId/acceptance`
- `POST /proposals/:proposalId/conversion-evaluation`
- `GET /proposals/:proposalId/conversion`
- `POST /proposals/:proposalId/convert`
- `GET /proposals/:proposalId/orchestration-logs`

## Tests Added / Updated

- `apps/api/src/tests/proposalOrchestration.service.test.ts`
- `apps/api/src/tests/proposalOrchestrationRoutes.test.ts`

## Validation

- `corepack pnpm prisma:generate`
- `corepack pnpm --filter api test`
- `corepack pnpm --filter api build`

## Deferred

- E-sign provider integration
- Proposal acceptance intake from external signature systems
- Customer/contact sync
- Invoice generation
- Accounting sync
- Manufacturing automation after conversion

## Recommended Phase 11

Add a controlled external-acceptance intake boundary so provider-confirmed or customer-confirmed acceptance can enter the canonical orchestrator without bypassing audit, deposit gating, or conversion rules.
