# Hugo Shelf Cost Calculator QA Checklist

## Backend
1. Run `corepack pnpm prisma:generate`
2. Run `corepack pnpm --filter api test`
3. Run `corepack pnpm --filter api build`

## Frontend
1. Run `corepack pnpm --filter web build`

## Manual QA
1. Open `/cost-calculator`
2. Create a cost profile
3. Edit the profile defaults for packing labor, marketplace fee, return reserve, damage reserve, shipping buffer, and min/target sell margins
4. Add a material rule
5. Add an edge band rule
6. Add a packaging rule with foam/corner protectors/packing minutes
7. Add a shipping rule with dimensional settings and shipping buffer
8. Add an Amazon fee preset
9. Add a shipping zone rule
10. Update the packaging rule and verify the save feedback is clear
11. Update the shipping rule and verify the save feedback is clear
12. Update the Amazon fee preset and verify the save feedback is clear
13. Update the shipping zone rule and verify the save feedback is clear
14. Select the created profile
15. Enter shelf dimensions, quantity, minutes, weight, and rule selections
16. Select an Amazon fee preset and shipping zone
17. Click `Calculate shelf cost`
18. Verify the breakdown includes packaging components, packing labor, shipping buffer, marketplace fee, referral fee, fulfillment fee, return reserve, damage reserve, and shipping-zone effects
19. Verify break-even, minimum sell price, target sell price, internal price, and final sell price all render
20. Click `Save calculation`
21. Verify the saved calculation appears in history with the selected fee preset and shipping zone
22. Build at least two scenarios and click `Compare scenarios`
23. Verify side-by-side deltas render for subtotal, break-even, minimum sell price, and target sell price
24. Click `Save comparison set`
25. Create a launch template
26. Edit the launch template and confirm the default fee preset / shipping zone / launch strategy update
27. Apply a launch template to a scenario and verify the scenario fields populate
28. Verify the comparison shows a ranked winner, a safer-margin candidate, and a most aggressive candidate
29. Verify launch price, floor price, and safer-margin price render clearly
30. Create a launch guardrail profile
31. Edit the guardrail profile and confirm the threshold values update
32. Run a comparison with a selected guardrail profile
33. Verify warnings and risk level badges render for fragile scenarios
34. Verify a ranked winner can still appear as risky
35. Select a launch scenario explicitly from the ranking table
36. Verify the launch handoff summary card shows chosen scenario, prices, burdens, and warnings
37. Click `Evaluate listing readiness`
38. Verify the selected scenario shows a listing readiness badge with clear blocking or review warnings
39. Verify the marketplace-prep field card shows product label, dimensions, material, packaging, shipping, fee preset, zone, and completeness flags
40. Verify the export summary card renders a stable JSON-style launch-candidate package
41. Save the comparison set
42. Reload the saved comparison set and confirm ranking, risk summary, selected launch candidate, readiness status, warning snapshot, and export summary persist
43. Change one assumption or input and recalculate
44. Confirm the result changes and remains explainable

## Expected Pilot Behavior
- No raw API calls or spreadsheets are required to use the calculator
- Every cost category is visible in cents/dollars
- A user can trace the result back to the selected profile and rule assumptions
- A user can explain why the target Amazon sell price is above the bare production subtotal
- A user can explain why one fee preset or shipping zone produces a safer or riskier launch price
- A user can explain why the recommended launch scenario outranks the alternatives
- A user can explain why the selected launch scenario is safe enough or still fragile before handing it into a future listing phase
- A user can explain why a launch candidate is recommended but not yet listing-ready
- A user can identify which marketplace-prep fields or price-floor warnings still need review before listing handoff
