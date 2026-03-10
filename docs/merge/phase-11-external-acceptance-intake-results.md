# Phase 11 External Acceptance Intake Results

## Summary

Phase 11 added a target-owned external acceptance intake boundary for public-token, provider-callback, and internal external-manual acceptance capture. Verified intake now records evidence, writes intake audit logs, and hands off into the canonical Phase 10 proposal orchestration layer instead of mutating acceptance or project state directly.

## Models Added

- `ProposalAcceptanceIntake`
- `ProposalAcceptanceEvidence`
- `ProposalAcceptanceIntakeLog`

Migration:

- `prisma/migrations/20260309233000_add_proposal_acceptance_intake_boundary`

## Services / Adapters Added

- `service.ts`
- `repository.ts`
- `statusAdapter.ts`
- `token.ts`
- `verification.ts`
- `handoff.ts`
- `audit.ts`
- `providerAdapter.ts`
- `contextAdapter.ts`

## Rules Enforced

- Public tokens are random, hashed, revocable, and expirable.
- Public submission cannot bypass verification.
- Provider callbacks cannot bypass normalization or Phase 10 handoff.
- Duplicate intake submissions and duplicate provider callbacks are idempotent.
- Successful acceptance still routes through Phase 10 orchestration only.

## Validation

- `corepack pnpm prisma:generate`
- `corepack pnpm --filter api test`
- `corepack pnpm --filter api build`

## Deferred To Phase 12+

- Full public proposal portal
- Full e-sign provider runtime
- Public document rendering
- Invoice generation
- Accounting sync
- Customer/contact sync
- Manufacturing/task automation

## Recommended Phase 12

Add a minimal public proposal snapshot and acceptance review surface so externally issued intake tokens can present controlled proposal context before confirmation, without broadening into full document rendering or branded portal workflows.
