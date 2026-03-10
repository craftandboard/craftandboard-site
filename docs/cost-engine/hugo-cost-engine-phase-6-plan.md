# Hugo Cost Engine Phase 6 Plan

## Goal
Add listing-handoff readiness and stronger price-floor protection to the selected launch scenario so Brandon and Hugo can tell the difference between a ranked winner and a candidate that is actually safe enough to hand into listing prep.

## Added behavior
- Listing-readiness evaluation for the selected launch candidate
- Stronger price-floor alerts layered on top of the existing guardrail and risk logic
- Marketplace-prep field packaging for future listing creation
- Export-ready launch summary snapshots stored on the selected scenario and comparison set

## Formulas and heuristics

### Stronger price-floor alerts
- Block when launch price is below minimum sell price
- Block when minimum sell price is at or below break-even
- Block when launch price is within a 5% buffer of minimum sell price
- Block when minimum sell price is within a 4% buffer of break-even
- Warn when safer-margin price sits more than 18% above the proposed launch price
- Warn when marketplace fee burden exceeds 32% of launch price
- Warn when shipping burden exceeds 24% of launch price
- Warn when reserve burden exceeds 8% of launch price
- Block when the selected scenario still carries `HIGH` risk from the Phase 5 guardrail layer

### Listing readiness
- `READY` when the selected launch scenario exists, stronger alerts have no blocking items, required marketplace-prep fields are present, and the selected scenario is not still materially fragile
- `NEEDS_REVIEW` when the candidate is not blocked but still has missing prep fields or medium-fragility concerns
- `BLOCKED` when stronger price-floor checks produce blocking alerts

### Marketplace field prep
The handoff package now generates a normalized internal field set for future listing work:
- product label
- SKU / internal code
- dimension summary
- material summary
- edge band summary
- packaging summary
- shipping summary
- fee preset label
- shipping zone label
- launch strategy label
- pricing summary
- completeness flags

## Routes updated
- `POST /cost-comparison-sets/:comparisonSetId/listing-readiness`
- `GET /cost-comparison-sets/:comparisonSetId/export-summary`
- `GET /cost-comparison-sets/:comparisonSetId`
- `GET /cost-comparison-sets/:comparisonSetId/recommendation`
- `GET /cost-comparison-sets/:comparisonSetId/handoff-summary`
- `POST /cost-comparison-sets/:comparisonSetId/select-launch-scenario`

## UI surfaces updated
- `/cost-calculator`
- listing readiness card
- marketplace-prep field card
- export summary card
- stronger warning visibility on selected launch candidates
- ranking table now distinguishes risk from listing readiness

## Out of scope
- Seller Central integration
- listing sync or repricing
- order ingestion
- manufacturing execution
- barcode, scheduling, purchasing, or inventory systems
- carrier API integration or shipping-label purchase
- remnant-aware optimization

## Next recommended phase
Add a thin listing-prep export polish phase focused on cleaner launch-candidate export shapes, field-level validation for future marketplace mapping, and explicit price-floor override review before any Seller Central integration.
