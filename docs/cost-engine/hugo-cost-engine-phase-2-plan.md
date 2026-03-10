# Hugo Cost Engine Phase 2 Plan

## Goal
Make the shelf calculator’s landed-cost and Amazon sell-price guidance more realistic without adding Amazon integration, manufacturing execution, or inventory workflows.

## What changed
- Packaging rules now support foam, corner protectors, packing minutes, packing labor override, and packaging overhead.
- Shipping rules now support dimensional divisor/rate, shipping buffer percent/cents, and marketplace handling.
- Cost profiles now carry pricing defaults for marketplace fee, return reserve, damage reserve, packing labor, shipping buffer, and minimum/target margin recommendations.
- Saved calculations now preserve packaging, shipping, and pricing snapshots.
- `/cost-calculator` now separates shelf spec, packaging/shipping assumptions, and pricing guidance.

## Core formulas
### Packaging cost
- `packaging components = box + bubble wrap + foam + corner protectors + tape + label + insert + shrink wrap + other + profile packaging allowance`
- `packing labor = packing minutes * packing labor rate`
- `packaging total = packaging components + packing labor + packaging overhead`

### Shipping cost
- `base shipping = flat override or base charge`
- `weight adder = weight * costPerPound`
- `volume adder = cubic inches * costPerCubicInch`
- `dimensional adder = (cubic inches / dimensional divisor) * dimensionalRate`
- `shipping buffer = max(percent buffer on shipping base, explicit cents buffer) using selected overrides/profile defaults`
- `shipping total = base + weight adder + volume adder + dimensional adder + marketplace handling + shipping buffer`

### Sell-price recommendation
- `subtotal production cost = material + edge band + labor + machine + packaging + shipping + overhead`
- `break-even price = subtotal + marketplace fee allowance + return reserve + damage reserve`
- `recommended internal price = subtotal lifted by target + growth margins`
- `recommended minimum sell price = break-even lifted by minimum recommended margin`
- `recommended target sell price = break-even lifted by target recommended margin`
- `recommended sell price = max(recommended internal price, recommended target sell price)`

## Routes and contracts updated
- `PATCH /cost-profiles/:costProfileId`
- `PATCH /packaging-rules/:packagingRuleId`
- `PATCH /shipping-rules/:shippingRuleId`
- `POST /cost-calculations/calculate`
- `POST /cost-calculations`
- `GET /cost-calculations/:calculationId`

## Internal UI coverage
- `/cost-calculator`
- active profile default editing
- packaging rule editing
- shipping rule editing
- sell-price recommendation card
- richer saved-calculation detail hydration

## Out of scope
- Seller Central integration
- listing sync or repricing
- order ingestion
- remnant-aware optimization
- barcode scanning
- production scheduling
- purchasing or inventory
- shipping label buying
- advanced analytics/reporting

## Next recommended phase
Add Amazon fee profile presets, richer shipping-zone realism, and a tighter saved-scenario comparison flow before touching Seller Central or manufacturing automation.
