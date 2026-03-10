# Hugo Cost Engine Phase 17 Plan

## Goal
Add a thin end-of-entry confirmation layer and a retained closeout summary for the current approved `AMAZON_MANUAL` listing-prep artifact. This phase keeps the workflow internal-only while making it obvious when manual entry was completed, what package was used, and what warning or override context still mattered at closeout.

## What Was Added
- `ListingPrepPackage.entryCompletedAt`
- `ListingPrepPackage.entryCompletedByMembershipId`
- `ListingPrepPackage.entryCompletionNote`
- `ListingPrepPackage.entryCompletionConfirmed`
- `ListingPrepPackage.closeoutSummarySnapshot`
- `ListingPrepPackage.closeoutVersion`
- `ListingPrepPackage.completedArtifactSummarySnapshot`
- `ListingPrepPackage.entryCompletionState`
- `CalculationComparisonSet.selectedCloseoutVersion`
- `CalculationComparisonSet.selectedCloseoutSummarySnapshot`
- `CalculationScenario.latestCloseoutSummarySnapshot`
- `ChannelMappingPreset.completionConfirmationPromptSnapshot`
- `ChannelMappingPreset.closeoutSummaryFormatSnapshot`

## Phase 17 Rules

### Entry completion confirmation rules
- Entry completion can only be confirmed for the current approved artifact.
- Confirmation is allowed only when approval state is `APPROVED` or `APPROVED_WITH_OVERRIDE`.
- Confirmation is rejected when the package is still `ENTRY_BLOCKED`.
- Confirmation persists:
  - `entryCompletedAt`
  - `entryCompletedByMembershipId`
  - `entryCompletionNote`
  - `entryCompletionConfirmed`
  - `entryCompletionState`

### Entry completion state rules
- `ENTRY_BLOCKED` applies when blocking readiness or warning conditions still exist.
- `ENTRY_READY` applies when the package is approved, current, and final entry checks are clear enough to begin.
- `ENTRY_IN_PROGRESS` applies when the package is usable but remaining review items still exist.
- `ENTRY_COMPLETE` applies after explicit confirmation with no override-aware completion state required.
- `ENTRY_COMPLETE_WITH_OVERRIDE` applies after explicit confirmation when override-aware completion context still exists.

### Closeout summary rules
- Persist a retained closeout snapshot containing:
  - final package identity
  - approval state at closeout
  - entry completion state
  - warning summary at closeout
  - override summary at closeout
  - version summary
  - concise internal share text
- The closeout version is persisted as `closeout-v1`.

### Completed artifact summary rules
- The completed artifact summary clarifies:
  - whether the artifact is completed
  - whether it is still current
  - whether it was completed with override awareness
  - whether the artifact should still be treated as the retained source of truth for that manual listing event

## Routes Added Or Extended

### Added
- `POST /listing-prep-packages/:listingPrepPackageId/confirm-entry-complete`
- `GET /listing-prep-packages/:listingPrepPackageId/closeout-summary`

### Extended
- `GET /listing-prep-packages/:listingPrepPackageId`
- `GET /listing-prep-packages`
- `GET /listing-prep-packages/:listingPrepPackageId/final-handoff-packet`
- `GET /listing-prep-packages/:listingPrepPackageId/entry-complete-cue`
- `GET /listing-prep-packages/:listingPrepPackageId/entry-completion-summary`
- `POST /listing-prep-packages/:listingPrepPackageId/refresh`
- `GET /cost-comparison-sets/:comparisonSetId`
- `GET /cost-comparison-sets/:comparisonSetId/export-summary`

## UI Added Or Updated
- entry-complete confirmation card
- closeout summary card
- completed artifact card
- cost calculator form integration for quick confirmation and retained closeout state visibility

## Out Of Scope
- Seller Central integration
- listing automation or repricing
- order ingestion
- inventory, purchasing, scheduling, CNC, barcode, or manufacturing execution
- shipping-label purchase
- advanced analytics/reporting

## Recommended Next Phase
Phase 18 should stay internal and operator-focused: add a narrow post-completion review and supersession summary so the team can clearly tell when a completed artifact remains current versus when a newer approved artifact should replace it.
