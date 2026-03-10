# Hugo Cost Engine Phase 15 Plan

## Goal
Turn the approved listing-prep package into a tighter manual-listing execution package for `AMAZON_MANUAL` work. This phase adds cleaner copy/share packaging, clearer last-step checks, a stronger ready-now summary, and a more explicit execution artifact without touching Seller Central or any external marketplace APIs.

## What Was Added
- `ListingPrepPackage.executionPackageSnapshot`
- `ListingPrepPackage.lastStepChecklistSnapshot`
- `ListingPrepPackage.readyNowSummarySnapshot`
- `ListingPrepPackage.shareReadySummarySnapshot`
- `ListingPrepPackage.executionPackageVersion`
- `ListingPrepPackage.copyShareErgonomicsSummary`
- `ChannelMappingPreset.finalCheckOrderingSnapshot`
- `ChannelMappingPreset.pricingCriticalPromptSnapshot`
- `ChannelMappingPreset.sharePackagingFormatSnapshot`
- `CalculationComparisonSet.selectedExecutionPackageVersion`
- `CalculationComparisonSet.selectedExecutionPackageSummarySnapshot`
- `CalculationScenario.latestExecutionSummarySnapshot`

## Phase 15 Rules

### Execution package rules
- The execution package is built from the approved listing-prep package, not from raw user input.
- It groups the artifact into:
  - current artifact header
  - copy-first summary
  - share-ready summary
  - last-step checklist
  - ready-now summary
  - warning and override context
- The package version is persisted as `execution-package-v1`.

### Last-step checklist rules
- `blockingChecks` come from blocking warnings plus unresolved required fields.
- `reviewChecks` come from optional incomplete fields plus non-blocking warnings.
- `pricingCriticalChecks` come from channel preset pricing-critical prompt configuration, or fallback pricing checks if no preset override exists.
- `lastChecks` merge:
  - current-artifact confirmation
  - override-awareness reminders
  - required/optional field review
  - pricing-critical checks

### Ready-now summary rules
- `READY_NOW` requires:
  - current approved artifact
  - approval state `APPROVED`
  - no blocking checks
- `READY_WITH_OVERRIDE` requires:
  - current approved artifact
  - approval state `APPROVED_WITH_OVERRIDE`
  - no blocking checks
- `BLOCKED` applies when:
  - approval state is `BLOCKED`, or
  - blocking checks still exist
- `NEEDS_REVIEW` applies otherwise.

### Share-ready summary rules
- The share-ready summary packages:
  - concise use-now wording
  - short share text
  - internal share blocks
  - channel-specific share packaging label/summary when configured on the preset

### Copy/share ergonomics summary rules
- Persist:
  - `copyGroupCount`
  - `promptCount`
  - `criticalFieldCount`
  - `missingCriticalFieldCount`
  - `readyToUseBoolean`
- This summary is generated from quick-copy, share-ready, and last-step snapshots instead of recomputing in the UI.

## Routes Added Or Extended

### Added
- `GET /listing-prep-packages/:listingPrepPackageId/execution-package`
- `GET /listing-prep-packages/:listingPrepPackageId/last-step-checklist`
- `GET /listing-prep-packages/:listingPrepPackageId/ready-now-summary`

### Extended
- `GET /listing-prep-packages/:listingPrepPackageId`
- `GET /listing-prep-packages`
- `POST /listing-prep-packages/:listingPrepPackageId/refresh`
- `GET /cost-comparison-sets/:comparisonSetId`
- `GET /cost-comparison-sets/:comparisonSetId/export-summary`
- existing worksheet/runbook/share routes now include Phase 15 snapshot context through the underlying package payload

## UI Added Or Updated
- execution package card
- last-step checklist card
- ready-now summary card
- share-ready summary card
- channel preset editor fields for:
  - final check ordering
  - pricing-critical checks
  - share packaging format

## Out Of Scope
- Seller Central integration
- listing automation or repricing
- order ingestion
- inventory, purchasing, scheduling, CNC, barcode, or manufacturing execution
- shipping-label purchase
- advanced analytics/reporting

## Recommended Next Phase
Phase 16 should stay internal and narrow: turn the execution package into a cleaner operator handoff packet with tighter “entry complete” cues, minor internal share/copy refinement, and thin post-entry confirmation packaging before any Seller Central integration.
