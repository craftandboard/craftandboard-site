# Hugo Cost Engine Phase 12 Plan

## Goal
Make the approved listing-prep package faster to use during manual Amazon listing work by improving operator prompts, copy/export groupings, and worksheet scanability without adding any external marketplace integration.

## Added fields

### ListingPrepPackage
- `operatorPromptSnapshot`
- `copyExportSnapshot`
- `plainTextWorksheetSnapshot`
- `structuredWorksheetExportSnapshot`
- `worksheetErgonomicsSummary`

### ChannelMappingPreset
- `operatorPromptTemplateSnapshot`
- `copyGroupOrderingSnapshot`
- `worksheetSectionLabelSnapshot`

### CalculationComparisonSet
- `selectedWorksheetErgonomicsSummary`

### CalculationScenario
- `latestOperatorPromptSummarySnapshot`

## Rules used

### Operator prompt rules
- `criticalPrompts` are derived from missing required checklist fields, blocking warnings, and approved override state.
- `reviewPrompts` come from the channel preset prompt template when present, otherwise from the default Amazon-manual review list.
- `completionPrompts` come from the channel preset prompt template when present, otherwise from the default finish-check list.

### Copy/export grouping rules
- Stable copy groups are generated for `identity`, `specs`, `fulfillment`, `pricing`, `warnings`, `checklist`, and `prompts`.
- Group order comes from `copyGroupOrderingSnapshot` when present, otherwise falls back to the default Amazon-manual order.
- Section labels come from `worksheetSectionLabelSnapshot` when present, otherwise use default plain-language labels.

### Worksheet ergonomics rules
- `copyGroupCount` is the number of grouped copy/export sections.
- `promptCount` counts critical and review prompts.
- `criticalFieldCount` is the total required checklist count.
- `missingCriticalFieldCount` counts required checklist fields not yet ready.
- `readyToUseBoolean` is true only when the package is the current approved artifact and no critical fields are missing.

## Routes added or extended
- `GET /listing-prep-packages/:listingPrepPackageId/operator-worksheet`
- `GET /listing-prep-packages/:listingPrepPackageId/worksheet-export`
- `GET /listing-prep-packages/:listingPrepPackageId/plain-text-worksheet`
- `GET /listing-prep-packages/:listingPrepPackageId`
- `GET /listing-prep-packages`
- `POST /listing-prep-packages/:listingPrepPackageId/refresh`
- `GET /cost-comparison-sets/:comparisonSetId`
- `GET /cost-comparison-sets/:comparisonSetId/export-summary`

## UI added
- operator prompt card
- manual listing copy-block card
- worksheet export summary card
- improved operator worksheet package card

## Out of scope
- Seller Central integration
- listing automation or repricing
- order ingestion
- inventory, purchasing, or manufacturing execution
- shipping-label purchase
- analytics/reporting expansion

## Next phase
Phase 13 should stay internal and narrow: make the manual listing worksheet even more operator-efficient with channel-specific checklist presets, cleaner copy-ready summaries, and worksheet-level “final review” cues before any external marketplace integration.
