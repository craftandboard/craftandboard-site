# Hugo Cost Engine Phase 5 Plan

## What This Phase Adds
- Launch guardrail profiles that define explicit thresholds for minimum margin, break-even buffer, fee burden, shipping burden, reserve burden, and target-to-floor spread
- Scenario risk scoring and risk levels so a ranked winner can still be flagged as fragile
- Warning lists that explain why a scenario is risky in plain language
- Selected launch scenario persistence so Brandon and Hugo can choose a handoff candidate instead of relying only on the top-ranked scenario
- Launch-candidate handoff summaries that preserve the chosen scenario, key prices, burdens, warnings, and snapshots for the next listing-focused phase

## Routes Added Or Extended
- `POST /cost-profiles/:costProfileId/launch-guardrail-profiles`
- `GET /launch-guardrail-profiles`
- `GET /launch-guardrail-profiles/:guardrailProfileId`
- `PATCH /launch-guardrail-profiles/:guardrailProfileId`
- `POST /cost-calculations/compare`
- `POST /cost-comparison-sets`
- `POST /cost-comparison-sets/:comparisonSetId/rank`
- `POST /cost-comparison-sets/:comparisonSetId/guardrails`
- `POST /cost-comparison-sets/:comparisonSetId/select-launch-scenario`
- `GET /cost-comparison-sets/:comparisonSetId`
- `GET /cost-comparison-sets/:comparisonSetId/recommendation`
- `GET /cost-comparison-sets/:comparisonSetId/handoff-summary`

## Pages And UI Surfaces
- `/cost-calculator`
- launch guardrail profile editor
- scenario ranking table with risk labels and launch-selection action
- launch risk summary card
- price guardrail warning list
- launch candidate handoff card

## Guardrail Formulas
- `realizedMarginPct = ((targetSellPrice - breakEvenPrice) / targetSellPrice) * 100`
- `bufferAboveBreakEvenPct = ((targetSellPrice - breakEvenPrice) / breakEvenPrice) * 100`
- `feeBurdenPct = totalMarketplaceFees / targetSellPrice * 100`
- `shippingBurdenPct = totalShippingCost / targetSellPrice * 100`
- `reserveBurdenPct = (returnReserve + damageReserve) / targetSellPrice * 100`
- `targetToFloorGapPct = (targetSellPrice - minimumSellPrice) / minimumSellPrice * 100`

## Warning Rules
- `LOW_MARGIN_BUFFER` when `realizedMarginPct < minimumMarginPct`
- `NEAR_BREAK_EVEN` when `bufferAboveBreakEvenPct < minimumBufferAboveBreakEvenPct`
- `HIGH_FEE_BURDEN` when `feeBurdenPct > maximumFeeBurdenPct`
- `HIGH_SHIPPING_BURDEN` when `shippingBurdenPct > maximumShippingBurdenPct`
- `HIGH_RESERVE_BURDEN` when `reserveBurdenPct > maximumReserveBurdenPct`
- `WIDE_TARGET_TO_FLOOR_GAP` when `targetToFloorGapPct > maximumAllowedTargetToFloorGapPct`
- `HIGH_SCENARIO_SENSITIVITY` when target price spread across compared scenarios is materially wide

## Risk Score Logic
- Start from the gap between actual scenario metrics and the configured guardrail thresholds.
- Add penalty weight for:
  - missing margin buffer
  - weak break-even cushion
  - excess fee burden
  - excess shipping burden
  - excess reserve burden
- Add warning-based penalties:
  - `HIGH` warnings contribute the largest weight
  - `MEDIUM` warnings contribute a moderate weight
  - `LOW` warnings contribute a smaller weight
- Risk levels:
  - `HIGH` when score is high or any high-severity warning exists
  - `MEDIUM` when score is moderate or medium-severity warnings exist
  - `LOW` otherwise

## Launch Handoff Summary Fields
- chosen scenario id and name
- cost profile id
- launch strategy
- selected Amazon fee preset
- selected shipping zone rule
- selected packaging and shipping rules
- shelf identity and dimensions
- break-even price
- minimum sell price
- target sell price
- launch price
- marketplace / shipping / reserve burdens
- risk score
- risk level
- warning list
- assumptions snapshot
- result snapshot

## New Data Fields

### LaunchGuardrailProfile
- `minimumMarginPct`
- `minimumBufferAboveBreakEvenPct`
- `maximumFeeBurdenPct`
- `maximumShippingBurdenPct`
- `maximumReserveBurdenPct`
- `maximumAllowedTargetToFloorGapPct`

### CalculationScenario
- `guardrailProfileId`
- `riskScore`
- `riskLevel`
- `guardrailSnapshot`
- `warningSnapshot`
- `handoffSnapshot`
- `isLaunchApprovedCandidate`

### CalculationComparisonSet
- `selectedLaunchScenarioId`
- `selectedLaunchSummary`
- `riskSummary`

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
- Add Phase 6 around listing-handoff readiness: export-focused launch-candidate packaging, stronger price-floor alerts, and thin marketplace-field prep before any Seller Central integration.
