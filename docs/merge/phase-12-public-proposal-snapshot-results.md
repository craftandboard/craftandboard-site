# Phase 12 Public Proposal Snapshot Results

## Summary

Phase 12 added a token-gated, read-only public proposal review surface so external signers can inspect a controlled proposal snapshot before using the existing Phase 11 acceptance submission flow. The review surface is computed from canonical proposal, intake, and payment summary data and intentionally avoids becoming a full public portal or document-rendering system.

## Models / Services Added

Schema:

- `ProposalAcceptanceReviewLog`

Services:

- `buildSnapshotFromCanonicalProposal`
- `validateReviewToken`
- `getPublicProposalSnapshot`
- `getPublicReviewContext`
- `recordSnapshotViewed`
- `listReviewLogsForProposal`

## Routes Added

- `POST /public/proposal-acceptance/review`
- `POST /public/proposal-acceptance/review-context`
- `POST /public/proposal-acceptance/viewed`
- `GET /proposals/:proposalId/acceptance-review-logs`

## Public Data Shape

The signer-facing snapshot exposes only:

- proposal title and neutral summary
- section and line summaries
- total amount summary
- deposit policy and deposit/payment summary
- review instructions
- review gating state and next actions

It does not expose internal IDs, internal metadata, membership data, provider internals, or document-rendering artifacts.

## Validation

- `corepack pnpm prisma:generate`
- `corepack pnpm --filter api test`
- `corepack pnpm --filter api build`

## Deferred To Phase 13+

- Full public proposal portal
- Branded tenant-specific public UX
- Downloadable PDF / print rendering
- Full e-sign runtime
- Invoice generation
- Accounting sync
- Customer/contact sync
- Manufacturing/task automation

## Recommended Phase 13

Add a narrow external acceptance presentation layer that can show signer instructions, review state, and post-submission confirmation in a more deliberate public flow without expanding into full portal, PDF, or e-sign runtime concerns.
