# Hugo Cost Engine Phase 4 Plan

## What This Phase Adds
- Launch templates that seed common Amazon launch setups from a cost profile
- Scenario ranking that scores comparison scenarios from best to worst launch candidate
- Launch recommendation outputs for launch price, floor price, and safer-margin price
- Saved comparison summaries that preserve the winning scenario and ranking rationale

## Routes Added Or Extended
- `POST /cost-profiles/:costProfileId/launch-templates`
- `GET /launch-templates`
- `GET /launch-templates/:templateId`
- `PATCH /launch-templates/:templateId`
- `POST /cost-comparison-sets/:comparisonSetId/rank`
- `GET /cost-comparison-sets/:comparisonSetId/recommendation`
- `POST /cost-calculations/compare`
- `POST /cost-comparison-sets`
- `GET /cost-comparison-sets`
- `GET /cost-comparison-sets/:comparisonSetId`

## Pages And UI Surfaces
- `/cost-calculator`
- launch template editor
- scenario ranking table
- launch recommendation card
- saved comparison recommendation review

## Ranking Formula
- Start every scenario at `50` points.
- Add margin-buffer credit: `min((targetSell - breakEven) / 100, 50)`.
- Subtract fee burden penalty: `min(total marketplace fee load / 100, 20)`.
- Subtract shipping sensitivity penalty: `min((base + weight + volume + dimensional + shipping buffer) / 150, 15)`.
- Subtract reserve burden penalty: `min((return reserve + damage reserve) / 100, 10)`.
- Add launch-strategy adjustment:
  - `BALANCED`: `+6`
  - `AGGRESSIVE`: `+8` when the min-to-target gap is tight, otherwise `+4`
  - `SAFER_MARGIN`: `+12` when the min-to-target gap is wider, otherwise `+7`

## Launch Recommendation Rules
- `recommendedLaunchPrice` comes from the highest-ranked scenario’s target sell price.
- `recommendedFloorPrice` comes from the highest-ranked scenario’s minimum sell price.
- `recommendedSaferMarginPrice` comes from the strongest margin-buffer scenario’s target sell price.
- The “most aggressive” scenario is the one with the lowest target sell price.
- The comparison summary stores the winning scenario id, the safer-margin scenario id, and the most aggressive scenario id.

## New Data Fields

### LaunchTemplate
- `defaultAmazonFeePresetId`
- `defaultShippingZoneRuleId`
- `defaultPackagingRuleId`
- `defaultShippingRuleId`
- `launchStrategy`
- `assumptionsSnapshot`

### CalculationScenario
- `launchStrategy`
- `rankingScore`
- `rankingSummary`
- `isRecommendedLaunchScenario`

### CalculationComparisonSet
- `recommendedScenarioId`
- `rankingSnapshot`
- `comparisonSummary`

## Out Of Scope
- Seller Central integration
- listing sync or repricing
- order ingestion
- remnant optimization
- inventory or POs
- scheduling or manufacturing execution
- CNC generation
- shipping-label buying
- advanced reporting

## Recommended Next Cost-Engine Phase
- Add Phase 5 around Amazon launch guardrails and scenario-to-listing handoff prep: price-floor alerts, margin-at-risk warnings, and a thin export path for chosen launch candidates before any Seller Central integration.
