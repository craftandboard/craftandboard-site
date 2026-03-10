# Phase 13 Acceptance Presentation Layer Audit

## What was added
- A target-owned public presentation layer for token-gated signer state, instructions, ready-state, confirmation, and presentation audit logs.
- A new `proposalAcceptancePresentation` module with service, state resolver, instruction builder, confirmation builder, repository, audit helpers, and public/internal contracts.
- A narrow presentation-log model to audit token-gated presentation activity without introducing a full portal or persisted public session state.

## Exact route list
- `POST /public/proposal-acceptance/presentation-state`
- `POST /public/proposal-acceptance/instructions`
- `POST /public/proposal-acceptance/ready-state`
- `POST /public/proposal-acceptance/confirmation`
- `POST /public/proposal-acceptance/presentation-viewed`
- `GET /proposals/:proposalId/acceptance-presentation-logs`

## Enums and states introduced
- `ProposalAcceptancePresentationAction`
  - `PRESENTATION_VIEWED`
  - `INSTRUCTIONS_RETURNED`
  - `READY_STATE_RETURNED`
  - `SUBMISSION_STATE_RETURNED`
  - `CONFIRMATION_RETURNED`
  - `PRESENTATION_BLOCKED`
  - `REQUEST_IGNORED_DUPLICATE`
- `ProposalAcceptancePresentationOutcome`
  - `APPLIED`
  - `SKIPPED`
  - `FAILED`
- Public presentation states returned by the service layer:
  - `REVIEW_READY`
  - `INSTRUCTIONS_READY`
  - `READY_TO_CONFIRM`
  - `SUBMITTED`
  - `CONFIRMED`
  - `BLOCKED`
  - `EXPIRED`

## Public signer-facing fields exposed
- `state`
- `reviewAllowed`
- `blockedReasons`
- `nextActions`
- `reviewCompleted`
- `submissionCompleted`
- `confirmationCompleted`
- Structured signer instructions:
  - review instruction
  - confirmation instruction
  - deposit reminder when relevant
  - intake note when present
- Confirmation payload:
  - headline
  - detail
  - submitted timestamp
  - confirmed timestamp

## Fields explicitly excluded
- Internal IDs
- Membership or user details
- Raw proposal metadata
- Internal audit details
- Provider runtime internals
- Project creation internals
- Hidden admin notes outside the existing intake note allowlist
- Full proposal document markup or branding/theme configuration

## Reused boundaries
- Phase 11 token hashing and token validation remain the trust boundary.
- Phase 12 review gating remains the source of truth for whether public review/presentation is allowed.
- Phase 11 public submission remains the only public mutation path for actual acceptance submission.
- Phase 10 orchestration remains the only path that can mutate canonical acceptance/conversion state.

## Deferred on purpose
- Full public proposal portal
- Public document rendering or download flows
- Branded tenant UX
- E-sign provider runtime
- Notifications, invoices, accounting, customer/contact sync
- Manufacturing or downstream task generation
