# Hugo Cost Engine Phase 13 Plan

## Goal
Tighten the approved listing-prep package into a faster operator worksheet for manual Amazon entry by adding stronger quick-copy summaries, final-review prompts, and clearer current-artifact handoff summaries.

## Added fields

### ListingPrepPackage
- `quickCopySummarySnapshot`
- `finalReviewPromptSnapshot`
- `artifactHandoffSummarySnapshot`
- `shortPlainTextSummarySnapshot`
- `quickCopyVersion`

### ChannelMappingPreset
- `finalReviewPromptTemplateSnapshot`
- `quickCopyOrderingSnapshot`
- `shortSummaryFormatSnapshot`

### CalculationComparisonSet
- `selectedQuickCopySummarySnapshot`
- `selectedFinalReviewPromptSnapshot`

### CalculationScenario
- `latestQuickCopySummarySnapshot`

## Rules used

### Quick-copy summary rules
- `copyFirstFields` prioritize product identity, dimensions/material, launch pricing, and warning-sensitive values.
- `priorityCopyBlocks` are ordered from `quickCopyOrderingSnapshot` when present, otherwise use the default Amazon-manual order.
- `shortPlainTextSummarySnapshot` condenses the current artifact identity, readiness, and price values into a fast copyable summary.

### Final-review prompt rules
- `criticalReviewPrompts` focus on price choice, current approved artifact state, and unresolved critical checklist gaps.
- `warningSensitivePrompts` highlight override acknowledgement and active warning-sensitive values.
- `completionReviewPrompts` are the last-step checks before manual entry is treated as complete.
- Channel-specific prompt refinements come from `finalReviewPromptTemplateSnapshot` when present.

### Artifact handoff summary rules
- `artifactUseNowBoolean` is true only for the package that should be used right now.
- `artifactVersionSummary` groups quick-copy, worksheet, and export versions in one place.
- `artifactStatusSummary` keeps approval state, current-artifact state, and override sensitivity easy to scan.

## Routes added or extended
- `GET /listing-prep-packages/:listingPrepPackageId/quick-copy-summary`
- `GET /listing-prep-packages/:listingPrepPackageId/final-review-prompts`
- `GET /listing-prep-packages/:listingPrepPackageId/operator-worksheet`
- `GET /listing-prep-packages/:listingPrepPackageId/plain-text-worksheet`
- `GET /listing-prep-packages/:listingPrepPackageId/worksheet-export`
- `GET /listing-prep-packages/:listingPrepPackageId`
- `GET /listing-prep-packages`
- `POST /listing-prep-packages/:listingPrepPackageId/refresh`
- `GET /cost-comparison-sets/:comparisonSetId`
- `GET /cost-comparison-sets/:comparisonSetId/export-summary`

## UI added
- quick-copy summary card
- final-review prompt card
- artifact handoff summary card
- updated channel mapping preset editor for quick-copy/final-review/short-summary refinements

## Out of scope
- Seller Central integration
- listing automation or repricing
- order ingestion
- inventory, purchasing, or manufacturing execution
- shipping-label purchase
- analytics/reporting expansion

## Next phase
Phase 14 should stay internal and operator-focused: tighten the operator worksheet into an even cleaner final manual-listing runbook with stronger completion-state cues and artifact-sharing polish before any external marketplace integration.
