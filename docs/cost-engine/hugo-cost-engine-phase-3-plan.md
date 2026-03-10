# Hugo Cost Engine Phase 3 Plan

## What This Phase Adds
- Amazon fee presets as editable reusable assumption records
- Shipping zone rules as editable reusable assumption records
- Scenario comparison for the same shelf spec across fee, shipping, packaging, and margin choices
- Saved comparison sets for later review
- Stronger Amazon-oriented break-even, minimum sell, and target sell recommendations

## Routes Added Or Extended
- `POST /cost-profiles/:costProfileId/amazon-fee-presets`
- `GET /amazon-fee-presets`
- `GET /amazon-fee-presets/:presetId`
- `PATCH /amazon-fee-presets/:presetId`
- `POST /cost-profiles/:costProfileId/shipping-zone-rules`
- `GET /shipping-zone-rules`
- `GET /shipping-zone-rules/:zoneRuleId`
- `PATCH /shipping-zone-rules/:zoneRuleId`
- `POST /cost-calculations/calculate`
- `POST /cost-calculations/compare`
- `POST /cost-calculations`
- `GET /cost-calculations`
- `GET /cost-calculations/:calculationId`
- `POST /cost-comparison-sets`
- `GET /cost-comparison-sets`
- `GET /cost-comparison-sets/:comparisonSetId`

## Pages And UI Surfaces
- `/cost-calculator`
- fee preset editor
- shipping zone editor
- scenario builder
- side-by-side comparison card
- saved comparison set loader

## Formula Rules

### Material
- Cost is area-based from required square footage against sheet square footage.
- Waste and usable yield are applied from the selected material rule or profile defaults.
- No nesting or remnant optimization is applied in this phase.

### Edge Band
- Linear footage is derived from the selected edge band pattern.
- Waste and setup allowance are applied from the selected edge band rule or profile defaults.

### Packaging
- Packaging cost is the sum of selected packaging rule components plus profile packaging allowance.
- Packing labor uses explicit input minutes first, then packaging-rule minutes, then profile defaults.
- Packaging overhead is additive from rule plus profile default.

### Shipping
- Base shipping still comes from the selected shipping rule or profile default shipping allowance.
- Shipping zone rules add scenario-specific zone base, weight, dimensional, handling, and buffer assumptions.
- Zone rule values are assumption-driven and do not call carrier APIs.

### Amazon Fee Preset
- Referral fee is percentage-based.
- Closing, fulfillment, and storage are fixed-cents adders.
- Advertising, return reserve, damage reserve, and misc marketplace allowance can be percent-based and/or cents-based.

### Sell Price Recommendations
- `breakEvenPrice = fixedCosts / (1 - variablePct)`
- `recommendedMinSellPrice = fixedCosts / (1 - variablePct - minMarginPct)`
- `recommendedTargetSellPrice = fixedCosts / (1 - variablePct - targetMarginPct)`
- `fixedCosts` includes subtotal production cost plus fixed marketplace allowances.
- `variablePct` includes referral fee plus percent-based advertising, return, damage, and misc marketplace allowances.
- `recommendedInternalPrice` remains the internal shop price recommendation and does not replace Amazon-oriented pricing.

## New Data Fields

### CostProfile
- `defaultPackingLaborRateCentsPerHour`
- `defaultPackingMinutes`
- `defaultMarketplaceFeePct`
- `defaultReturnReservePct`
- `defaultDamageReservePct`
- `defaultShippingBufferPct`
- `defaultShippingBufferCents`
- `defaultPackagingOverheadCents`
- `defaultRecommendedMinMarginPct`
- `defaultRecommendedTargetMarginPct`

### AmazonFeePreset
- reusable org/profile-scoped marketplace fee assumptions

### ShippingZoneRule
- reusable org/profile-scoped zone-sensitive shipping assumptions

### ShelfCostCalculation
- fee preset linkage
- shipping zone linkage
- explicit Amazon fee category cost fields
- fee and zone snapshots

### Comparison Models
- `CalculationScenario`
- `CalculationComparisonSet`
- `ComparisonSetScenario`

## Out Of Scope
- Seller Central integration
- listing sync or repricing
- order ingestion
- remnant optimization
- inventory or POs
- scheduling or execution
- CNC generation
- shipping-label buying
- advanced reporting

## Recommended Next Cost-Engine Phase
- Add a Phase 4 focused on Amazon launch decision support: richer comparison analysis, launch-price guardrails, and optional preset templates for Hugo’s most common shelf families before any Seller Central integration.
