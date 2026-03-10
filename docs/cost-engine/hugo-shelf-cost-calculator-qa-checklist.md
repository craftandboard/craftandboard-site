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
25. Reload the saved comparison set and confirm the scenario list persists
26. Change one assumption or input and recalculate
27. Confirm the result changes and remains explainable

## Expected Pilot Behavior
- No raw API calls or spreadsheets are required to use the calculator
- Every cost category is visible in cents/dollars
- A user can trace the result back to the selected profile and rule assumptions
- A user can explain why the target Amazon sell price is above the bare production subtotal
- A user can explain why one fee preset or shipping zone produces a safer or riskier launch price
