# Phase 11 External Acceptance Intake Audit

## What Intake / Evidence / Log Models Were Added

- `ProposalAcceptanceIntake`
- `ProposalAcceptanceEvidence`
- `ProposalAcceptanceIntakeLog`

## Exact Route List

Authenticated internal routes:

- `POST /proposals/:proposalId/acceptance-intakes`
- `GET /proposals/:proposalId/acceptance-intakes`
- `GET /acceptance-intakes/:intakeId`
- `PATCH /acceptance-intakes/:intakeId/revoke`
- `GET /acceptance-intakes/:intakeId/evidence`
- `GET /proposals/:proposalId/acceptance-intake-logs`

Public/provider routes:

- `POST /public/proposal-acceptance/submit`
- `POST /public/proposal-acceptance/validate-token`
- `POST /payments/providers/:provider/acceptance-signals`

## Exact Enums / Statuses Introduced

- `ProposalAcceptanceIntakeStatus`
  - `OPEN`
  - `SUBMITTED`
  - `VERIFIED`
  - `HANDOFF_ACCEPTED`
  - `HANDOFF_REJECTED`
  - `EXPIRED`
  - `REVOKED`
  - `FAILED`
- `ProposalAcceptanceIntakeSource`
  - `PUBLIC_TOKEN`
  - `PROVIDER_CALLBACK`
  - `EXTERNAL_MANUAL_ENTRY`
- `ProposalAcceptanceEvidenceKind`
  - `CHECKBOX_CONFIRMATION`
  - `TYPED_NAME`
  - `EMAIL_MATCH`
  - `PROVIDER_ASSERTION`
  - `IP_CAPTURE`
  - `USER_AGENT_CAPTURE`
  - `NOTE`
- `ProposalAcceptanceIntakeAction`
  - `INTAKE_CREATED`
  - `TOKEN_ISSUED`
  - `TOKEN_VALIDATED`
  - `TOKEN_REJECTED`
  - `SUBMISSION_RECEIVED`
  - `SUBMISSION_VERIFIED`
  - `SUBMISSION_FAILED`
  - `HANDOFF_REQUESTED`
  - `HANDOFF_ACCEPTED`
  - `HANDOFF_REJECTED`
  - `INTAKE_EXPIRED`
  - `INTAKE_REVOKED`
  - `REQUEST_IGNORED_DUPLICATE`
- `ProposalAcceptanceIntakeOutcome`
  - `APPLIED`
  - `SKIPPED`
  - `FAILED`

## Token / Public / Provider Rules Enforced

- Public token material is cryptographically random and stored by hash.
- Public token validation rejects invalid, expired, and revoked tokens through a generic public-safe error.
- Public submission requires explicit confirmation and typed-name evidence.
- IP and user-agent capture are recorded when available.
- Provider callback intake is normalized through a target-owned provider adapter and cannot mutate proposal/project state directly.
- Duplicate provider references and repeated successful submissions are handled idempotently.

## Handoff Into Phase 10

- Verified intake never writes proposal acceptance state directly.
- Verified intake calls the canonical Phase 10 `acceptProposal` path through `handoff.ts`.
- Handoff success updates intake to `HANDOFF_ACCEPTED`.
- Handoff business-rule rejection updates intake to `HANDOFF_REJECTED`.
- Project creation and conversion remain outside this intake boundary.

## Deferred

- Full public proposal portal
- Full e-sign provider integration
- Public document rendering
- Invoice generation
- Accounting sync
- Customer/contact sync
- Manufacturing/job/task generation
- Branded external UX flows
