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
45. Build a listing-prep package from the selected launch scenario
46. Create a marketplace mapping template
47. Edit the mapping template and confirm format preferences update
48. Build or refresh the listing-prep package with the selected mapping template
49. Verify the listing-prep package card shows package status, readiness status, scenario name, mapping template, and export version
50. Run marketplace field validation and confirm missing, weak, and ready fields render clearly
51. Verify the ready-for-listing-prep card shows `READY`, `READY_WITH_OVERRIDE`, `NEEDS_REVIEW`, or `BLOCKED` clearly
52. If blocking floor warnings exist, enter an override reason and submit override review
53. Verify the override history card shows the latest active override plus readable prior history
54. Verify the export summary card shows template label, export version, and a stable export block
55. Reload the saved comparison set and confirm listing-prep package, validation snapshot, override summary, override history, ready-for-listing-prep summary, and export snapshot persist
56. Create a channel mapping preset for `AMAZON_MANUAL`
57. Edit the channel mapping preset and confirm formatting preferences update
58. Apply the channel mapping preset to an existing listing-prep package
59. Verify the package shows the channel preset label and export contract version
60. Verify the approval card clearly shows `READY_FOR_REVIEW`, `APPROVED`, `APPROVED_WITH_OVERRIDE`, or `BLOCKED`
61. Approve an eligible package
62. Verify the package is marked as the current approved artifact
63. Verify the manual Amazon export card renders a stable export contract with approval state and channel preset summary
64. Reload the package and confirm approval summary, manual Amazon export snapshot, and current approved artifact state persist

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
- A user can identify whether a listing-prep package is blocked by missing fields or by unapproved floor-price override review
- A user can explain which marketplace mapping template was applied and how it shaped the export package
- A user can explain which channel mapping preset was applied and how it shaped the manual Amazon export contract
- A user can tell whether a package is merely ready for review or actually approved for manual Amazon listing prep
- A user can identify the single current approved artifact to use for the next manual listing step
- A user can tell whether a package is ready, ready with override, still needs review, or blocked without reading raw JSON
- A user can review active versus historical overrides without losing the exact reason text
- A user can point to the exact stable package snapshot that the next listing phase should consume
