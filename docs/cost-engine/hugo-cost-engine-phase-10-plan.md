# Hugo Cost Engine Phase 10 Plan

## Scope
- polish approval history on listing-prep packages
- auto-select default channel presets from launch context
- generate a tighter manual listing worksheet artifact
- preserve worksheet and preset-selection summaries on listing-prep packages and comparison sets

## New rules
- approval history is stored as a condensed snapshot, not a full workflow log
- default channel preset selection considers:
  - `channelCode`
  - `launchStrategy`
  - preset `defaultForChannel`
  - preset `autoApplyEnabled`
  - preset `priority`
- package approval remains explicit:
  - build/refresh/validation/override flows keep packages in review-or-blocked states
  - only the explicit approval action can move a package to `APPROVED` or `APPROVED_WITH_OVERRIDE`
- worksheet generation produces a stable `manual-listing-v1` snapshot with:
  - product identity
  - pricing block
  - preset summary
  - readiness summary
  - approval summary
  - override summary
  - manual review prompts

## Routes added or updated
- `POST /listing-prep-packages/:listingPrepPackageId/apply-default-channel-preset`
- `GET /listing-prep-packages/:listingPrepPackageId/manual-listing-worksheet`
- updated:
  - `POST /listing-prep-packages/:listingPrepPackageId/apply-channel-preset`
  - `POST /listing-prep-packages/:listingPrepPackageId/approve`
  - `POST /listing-prep-packages/:listingPrepPackageId/refresh`
  - `GET /listing-prep-packages`
  - `GET /listing-prep-packages/:listingPrepPackageId`
  - `GET /listing-prep-packages/:listingPrepPackageId/manual-amazon-export`
  - `GET /cost-comparison-sets/:comparisonSetId`
  - `GET /cost-comparison-sets/:comparisonSetId/export-summary`
  - `GET /cost-comparison-sets/:comparisonSetId/handoff-summary`

## Fields added
- `ChannelMappingPreset`
  - `defaultForChannel`
  - `defaultLaunchStrategies`
  - `launchContextSnapshot`
  - `priority`
  - `autoApplyEnabled`
- `ListingPrepPackage`
  - `approvalHistorySnapshot`
  - `autoAppliedChannelPreset`
  - `channelPresetSelectionSummary`
  - `manualListingWorksheetSnapshot`
  - `worksheetVersion`
  - `worksheetSummarySnapshot`
- `CalculationScenario`
  - `latestPresetSelectionSummarySnapshot`
- `CalculationComparisonSet`
  - `selectedWorksheetVersion`
  - `selectedWorksheetSummarySnapshot`

## Intentionally out of scope
- Seller Central integration
- listing automation or repricing
- order ingestion
- carrier APIs or label purchase
- manufacturing execution
- inventory / PO workflows
- remnant optimization

## Next likely phase
- keep the next phase narrow and internal: manual listing worksheet polish, approval-history cleanup, and perhaps one more export-contract pass before any Seller Central integration
