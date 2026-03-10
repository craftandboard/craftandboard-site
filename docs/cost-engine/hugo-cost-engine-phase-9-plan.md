# Hugo Cost Engine Phase 9 Plan

## Scope
Phase 9 adds listing-prep approval polish, reusable channel mapping presets, and a stable manual Amazon export contract without adding any Seller Central or marketplace API integration.

## What Changed
- Added `ChannelMappingPreset` as a reusable internal preset for channel-specific field packaging.
- Extended `ListingPrepPackage` with:
  - `approvalState`
  - `approvalSummarySnapshot`
  - `channelMappingPresetId`
  - `exportContractVersion`
  - `manualAmazonExportSnapshot`
  - `currentApprovedArtifact`
- Extended comparison/scenario snapshots so approval and export contract state persist with the selected launch candidate.

## Approval-State Rules
- `DRAFT`: package exists but is not ready for review.
- `READY_FOR_REVIEW`: package is structurally present but still needs field, export, or override review.
- `APPROVED`: package is ready for manual Amazon listing prep with no active override requirement.
- `APPROVED_WITH_OVERRIDE`: package is usable, but approval depends on an accepted override state.
- `BLOCKED`: package cannot be used for listing prep yet.
- `ARCHIVED`: historical package retained for audit.

Approval is only allowed when:
- listing readiness is effectively ready
- marketplace validation is not blocking
- stronger price-floor alerts are not blocking, or have already been approved as override
- the manual Amazon export contract is complete enough to hand off

## Channel Mapping Presets
Supported initial channel:
- `AMAZON_MANUAL`

Preset fields:
- `productLabelFormat`
- `skuFormat`
- `includeWarningNotes`
- `includeOverrideNotes`
- `dimensionsFormat`
- `materialFormat`
- `packagingFormat`
- `pricingFormat`
- `fieldOrderingSnapshot`

These presets standardize internal field packaging only. They do not publish or validate against a live marketplace API.

## Manual Amazon Export Contract
The manual export contract is a stable internal JSON-safe handoff object containing:
- export contract version
- package id
- selected scenario id
- comparison set id
- approval state
- channel preset summary
- normalized shelf/material/edge-band/packaging/shipping/pricing fields
- fee preset and shipping zone labels
- warning summary
- override summary
- readiness summary
- assumptions snapshot
- result snapshot
- generated / approved timestamps

## Routes Added Or Updated
- `POST /cost-profiles/:costProfileId/channel-mapping-presets`
- `GET /channel-mapping-presets`
- `GET /channel-mapping-presets/:channelMappingPresetId`
- `PATCH /channel-mapping-presets/:channelMappingPresetId`
- `POST /listing-prep-packages/:listingPrepPackageId/apply-channel-preset`
- `POST /listing-prep-packages/:listingPrepPackageId/approve`
- `GET /listing-prep-packages/:listingPrepPackageId/manual-amazon-export`

Extended existing responses:
- `GET /listing-prep-packages`
- `GET /listing-prep-packages/:listingPrepPackageId`
- `GET /cost-comparison-sets/:comparisonSetId`
- `GET /cost-comparison-sets/:comparisonSetId/export-summary`

## Out of Scope
- Seller Central integration
- listing sync or repricing
- external marketplace API validation
- order ingestion
- manufacturing execution
- purchasing, inventory, remnant, or scheduling logic

## Next Phase
Phase 10 should stay internal and listing-prep focused: package approval-history polish, channel-specific preset defaults, and a tighter manual listing worksheet/export shape before any Seller Central connection is attempted.
