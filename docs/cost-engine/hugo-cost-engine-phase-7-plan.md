# Hugo Cost Engine Phase 7 Plan

## Scope Added
- Stable `ListingPrepPackage` persistence for selected launch scenarios
- Field-level marketplace mapping validation
- Explicit price-floor override review
- Cleaner export snapshot and listing-prep summary persistence on comparison sets

## Core Formulas / Rules
- Marketplace field validation:
  - `VALID` when required prep fields are present and no blocking listing-readiness issue remains
  - `REVIEW_NEEDED` when fields are mostly present but weak or optional gaps remain
  - `INVALID` when required fields are missing or blocking price-floor warnings remain without approved override
- Price-floor override review:
  - no override needed when no blocking stronger-alert warnings exist
  - override requested when blocking warnings exist and a reason is supplied
  - override approved only when explicit approval is captured
- Listing-prep package readiness:
  - `READY` when readiness is acceptable, validation is valid, and no unapproved blocking override remains
  - `READY_FOR_REVIEW` when validation/readiness is close but still needs human review
  - `BLOCKED` when listing readiness is blocked, validation is invalid, or blocking price-floor warnings remain unapproved

## Fields Added
- `ListingPrepPackage`
  - `status`
  - `listingReadinessStatus`
  - `exportSnapshot`
  - `marketplaceFieldSnapshot`
  - `validationSnapshot`
  - `warningSnapshot`
  - `overrideSnapshot`
  - `approvedAt`
  - `approvedByMembershipId`
- `CalculationScenario`
  - `listingPrepPackageId`
  - `priceFloorOverrideRequested`
  - `priceFloorOverrideApproved`
  - `priceFloorOverrideSnapshot`
- `CalculationComparisonSet`
  - `selectedListingPrepPackageId`
  - `listingPrepSummarySnapshot`

## Routes Added / Updated
- `POST /cost-comparison-sets/:comparisonSetId/listing-prep-package`
- `GET /listing-prep-packages`
- `GET /listing-prep-packages/:listingPrepPackageId`
- `POST /listing-prep-packages/:listingPrepPackageId/validate-marketplace-fields`
- `POST /listing-prep-packages/:listingPrepPackageId/price-floor-override`
- Updated:
  - `POST /cost-comparison-sets/:comparisonSetId/listing-readiness`
  - `POST /cost-comparison-sets/:comparisonSetId/select-launch-scenario`
  - `GET /cost-comparison-sets/:comparisonSetId`
  - `GET /cost-comparison-sets/:comparisonSetId/handoff-summary`
  - `GET /cost-comparison-sets/:comparisonSetId/export-summary`

## UI Added
- listing-prep package status card
- marketplace mapping validation card
- price-floor override review card
- clearer listing-prep actions from `/cost-calculator`

## Out Of Scope
- Seller Central integration
- listing sync / repricing
- order ingestion
- carrier or shipping-label APIs
- manufacturing execution
- inventory / purchasing
- remnant optimization

## Recommended Next Phase
- Phase 8 should stay thin and internal: export polish, marketplace field mapping templates, and package-level approval history cleanup before any Seller Central integration.
