# Phase 12 Public Proposal Snapshot Audit

## What Public Review / Snapshot / Log Services Were Added

- A target-owned public review module at `apps/api/src/modules/proposalAcceptanceReview`
- A computed snapshot builder with an explicit signer-safe allowlist
- Public token-gated review and review-context services
- Review audit logging through `ProposalAcceptanceReviewLog`

No persisted snapshot model was added. Snapshot generation remains service-only and reads from canonical proposal, intake, and payment summary truth.

## Exact Route List

Public routes:

- `POST /public/proposal-acceptance/review`
- `POST /public/proposal-acceptance/review-context`
- `POST /public/proposal-acceptance/viewed`

Authenticated internal route:

- `GET /proposals/:proposalId/acceptance-review-logs`

## Exact Enums / Statuses Introduced

- `ProposalAcceptanceReviewAction`
  - `SNAPSHOT_GENERATED`
  - `SNAPSHOT_VIEWED`
  - `TOKEN_VALIDATED_FOR_REVIEW`
  - `REVIEW_BLOCKED`
  - `REVIEW_CONTEXT_RETURNED`
  - `REQUEST_IGNORED_DUPLICATE`
- `ProposalAcceptanceReviewOutcome`
  - `APPLIED`
  - `SKIPPED`
  - `FAILED`

## Public Fields Exposed

- Organization display name
- Proposal title
- Neutral summary string
- Proposal created/updated timestamps
- Section titles
- Line item name, description, qty, unit, and price cents
- Total amount summary
- Deposit summary derived from canonical payment truth
- Review instructions
- Review gating fields:
  - `reviewAllowed`
  - `intakeStatus`
  - `blockedReasons`
  - `nextActions`

## Explicitly Excluded From Public Payloads

- Internal proposal IDs
- Intake IDs
- Internal membership or user data
- Internal metadata blobs
- Provider execution internals
- Internal audit trails
- Unrelated lead/project/customer details
- Hidden admin notes
- Document markup, print layout, or tenant theme data

## Phase 11 Token Reuse

- Review lookup reuses Phase 11 hashed acceptance-intake token lookup.
- Invalid, expired, or revoked tokens return the same generic public-safe error shape.
- Public review remains read-only and cannot mutate proposal, payment, or project state.

## Deferred

- Full public proposal portal
- Branded tenant-specific public UX
- Downloadable PDF or print rendering
- Full e-sign provider integration
- Public document version history
- Invoice generation
- Accounting sync
- Customer/contact sync
- Manufacturing/job/task generation
