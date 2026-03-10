# Hugo Cost Engine Phase 14 Plan

## Goal
Turn the current approved listing-prep package into a clearer final manual-listing runbook with explicit completion cues and a concise internal handoff summary for `AMAZON_MANUAL`.

## Added fields

### ListingPrepPackage
- `finalRunbookSnapshot`
- `completionCueSnapshot`
- `internalShareSummarySnapshot`
- `shortShareTextSnapshot`
- `runbookVersion`
- `lastChangeSummarySnapshot`

### ChannelMappingPreset
- `finalReviewOrderingSnapshot`
- `completionCueTemplateSnapshot`
- `shareSummaryFormatSnapshot`

### CalculationComparisonSet
- `selectedRunbookVersion`
- `selectedRunbookSummarySnapshot`

### CalculationScenario
- `latestRunbookSummarySnapshot`

## Rules used

### Final runbook rules
- `finalRunbookSnapshot` is built from the approved listing-prep package, not from ad hoc UI state.
- The runbook always prioritizes current-artifact identity, copy-first guidance, final-review prompts, completion cues, warnings/override context, and internal share context.
- Section order comes from `finalReviewOrderingSnapshot.sections` when present, otherwise defaults to `copy-first`, `final-review`, `completion-cue`, `warnings`, and `internal-share`.

### Completion cue rules
- `readyNowBoolean` only becomes true when the package is current, approved cleanly, has no required missing fields, and has no unresolved blocking warnings.
- `readyWithOverrideBoolean` requires the package to be current and approved with override while still having no unresolved required-field gap.
- `blockedBoolean` becomes true when blocking warnings or blocked approval state still prevent use.
- `lastChecks[]` condense the final operator-facing checks into a short ordered list.

### Internal share rules
- `internalShareSummarySnapshot` is a concise handoff block for Brandon/Hugo, not a second worksheet.
- `shareBlockSections[]` focus on what the package is for, what to copy first, and what to watch.
- `shortShareTextSnapshot` is the compact text summary for fast internal sharing.

### Last-change rules
- `lastChangeSummarySnapshot` stays intentionally compact.
- It highlights the most recent approval action first, then preset/override context if available.
- It avoids turning package history into a full activity log.

## Routes added or extended
- `GET /listing-prep-packages/:listingPrepPackageId/final-runbook`
- `GET /listing-prep-packages/:listingPrepPackageId/internal-share-summary`
- `GET /listing-prep-packages/:listingPrepPackageId/operator-worksheet`
- `GET /listing-prep-packages/:listingPrepPackageId/plain-text-worksheet`
- `GET /listing-prep-packages/:listingPrepPackageId/worksheet-export`
- `GET /listing-prep-packages/:listingPrepPackageId`
- `GET /listing-prep-packages`
- `POST /listing-prep-packages/:listingPrepPackageId/refresh`
- `GET /cost-comparison-sets/:comparisonSetId`
- `GET /cost-comparison-sets/:comparisonSetId/export-summary`

## UI added
- final runbook card
- completion cue card
- internal share summary card
- last-change summary card
- updated channel preset editor for runbook ordering, completion-cue checks, and share-summary formatting

## Out of scope
- Seller Central integration
- listing automation or repricing
- order ingestion
- inventory, purchasing, or manufacturing execution
- shipping-label purchase
- analytics/reporting expansion

## Next phase
Phase 15 should stay internal and operator-focused: tighten the final runbook into an even cleaner manual listing execution package with small copy/share polish and channel-specific review refinements before any external marketplace integration.
