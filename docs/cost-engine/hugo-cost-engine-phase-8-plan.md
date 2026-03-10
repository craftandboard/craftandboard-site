# Hugo Cost Engine Phase 8 Plan

## Goal
Make listing-prep packages cleaner and more reusable before any marketplace integration by adding marketplace mapping templates, stable export-shape polish, condensed override history, and a clearer ready-for-listing-prep artifact.

## What changed
- Added reusable `MarketplaceMappingTemplate` records scoped to the org and optionally a cost profile.
- Extended `ListingPrepPackage` with:
  - `marketplaceMappingTemplateId`
  - `exportVersion`
  - `exportShapeSnapshot`
  - `overrideHistorySnapshot`
  - `readyForListingPrep`
  - `readyForListingPrepSummary`
- Extended `CalculationScenario` with `latestOverrideSummarySnapshot`.
- Extended `CalculationComparisonSet` with:
  - `selectedListingPrepReadySnapshot`
  - `selectedListingPrepExportVersion`

## Ready-for-listing-prep rules
A package is only `readyForListingPrep = true` when:
- listing readiness is not blocked
- marketplace field validation is not `INVALID`
- stronger blocking floor alerts are either absent or explicitly approved through override review
- the export shape is complete enough for internal handoff
- any applied mapping template resolves the required formatted fields cleanly

If those rules are not all satisfied, the package is summarized as:
- `READY_WITH_OVERRIDE`
- `NEEDS_REVIEW`
- `BLOCKED`

## Export-shape rules
The stable export shape now normalizes:
- package identity and status
- selected scenario identity
- comparison-set linkage
- product label / SKU
- dimensions, material, packaging, shipping, and pricing summaries
- fee preset and shipping-zone labels
- launch-strategy label
- warning summary
- override summary
- mapping-template summary
- assumptions snapshot
- result snapshot
- marketplace field snapshot
- export metadata block with version and generated timestamp

## Marketplace mapping template fields
Templates currently standardize:
- `productLabelFormat`
- `skuFormat`
- `includeWarningNotes`
- `includeOverrideNotes`
- `dimensionsFormat`
- `materialFormat`
- `packagingFormat`
- `pricingFormat`

## Override-history cleanup rules
Phase 8 does not add a workflow engine. It simply:
- highlights the latest override clearly
- preserves a condensed prior-history list
- keeps reason text and timestamps when available
- avoids duplicate noisy history entries where the same override summary and reason repeat

## Routes added or updated
Added:
- `POST /cost-profiles/:costProfileId/marketplace-mapping-templates`
- `GET /marketplace-mapping-templates`
- `GET /marketplace-mapping-templates/:mappingTemplateId`
- `PATCH /marketplace-mapping-templates/:mappingTemplateId`
- `POST /listing-prep-packages/:listingPrepPackageId/refresh`

Updated:
- `POST /cost-comparison-sets/:comparisonSetId/listing-prep-package`
- `GET /listing-prep-packages/:listingPrepPackageId`
- `GET /cost-comparison-sets/:comparisonSetId/export-summary`
- `GET /cost-comparison-sets/:comparisonSetId`

## Out of scope
- Seller Central integration
- listing sync or repricing
- marketplace API validation
- order ingestion
- shipping-label purchase
- manufacturing execution
- analytics/reporting expansion

## Recommended next phase
Keep the next phase thin and internal:
- package-level export polish for specific downstream listing consumers
- explicit mapping-template presets by sales channel if needed
- tighter listing-prep approval semantics only if real team usage shows ambiguity
