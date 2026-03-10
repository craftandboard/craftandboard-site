# Hugo Cost Engine Phase 11 Plan

## What changed

Phase 11 adds an operator-facing worksheet package on top of the approved listing-prep package flow. The package now stores:

- `operatorWorksheetSnapshot`
- `operatorWorksheetVersion`
- `operatorChecklistSnapshot`
- `channelHandoffSummarySnapshot`
- `currentApprovedArtifactSummary`

Channel presets now also support worksheet-specific handoff refinements:

- `worksheetFieldOrderingSnapshot`
- `worksheetPromptSnapshot`
- `requiredFieldChecklistSnapshot`
- `optionalFieldChecklistSnapshot`

## Operator worksheet rules

The operator worksheet is derived only from the approved or review-ready listing-prep package. It groups fields into:

- header summary
- package identity
- approval/export summary
- pricing block
- dimensions/material/edge band block
- packaging/shipping block
- warnings and override notes
- field checklist
- operator prompts
- channel handoff notes
- current approved artifact summary

The worksheet never becomes the source of truth. It is a presentation artifact generated from stored package snapshots.

## Checklist rules

The operator checklist is derived from:

- marketplace validation snapshot
- channel preset required checklist fields
- channel preset optional checklist fields
- channel preset worksheet prompts

It outputs:

- required complete fields
- required missing fields
- optional incomplete fields
- manual review prompts
- readiness summary
- blocking reasons
- review reasons

## Current approved artifact rules

The current approved artifact summary is generated from the listing-prep package and answers:

- is this the package to use right now
- what is its approval state
- does override approval exist
- what export/worksheet versions are attached
- when it was approved

This keeps the current handoff artifact distinct from older package snapshots.

## Routes added or updated

Added:

- `GET /listing-prep-packages/:listingPrepPackageId/operator-worksheet`

Extended existing listing-prep routes to include operator worksheet, checklist, handoff summary, and current artifact summary in package/comparison responses:

- `GET /listing-prep-packages`
- `GET /listing-prep-packages/:listingPrepPackageId`
- `POST /listing-prep-packages/:listingPrepPackageId/refresh`
- `GET /cost-comparison-sets/:comparisonSetId`
- `GET /cost-comparison-sets/:comparisonSetId/export-summary`
- `GET /cost-comparison-sets/:comparisonSetId/handoff-summary`

## Out of scope

Still intentionally excluded:

- Seller Central integration
- listing automation or repricing
- external listing sync
- inventory, PO, or manufacturing execution flows
- advanced analytics or reporting

## Next phase recommendation

Phase 12 should stay internal and listing-prep focused: polish the operator worksheet into a cleaner manual listing worksheet package with tighter copy/export ergonomics before any Seller Central integration.
