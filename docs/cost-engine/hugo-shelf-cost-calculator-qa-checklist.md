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
8. Update the packaging rule and verify the save feedback is clear
9. Update the shipping rule and verify the save feedback is clear
10. Select the created profile
11. Enter shelf dimensions, quantity, minutes, weight, and rule selections
12. Click `Calculate shelf cost`
13. Verify the breakdown includes packaging components, packing labor, shipping buffer, marketplace fee, return reserve, and damage reserve
14. Verify break-even, minimum sell price, target sell price, internal price, and final sell price all render
15. Click `Save calculation`
16. Verify the saved calculation appears in history
17. Click a saved calculation and verify the richer pricing/packaging/shipping snapshots reload
18. Change one assumption or input and recalculate
19. Confirm the result changes and remains explainable

## Expected Pilot Behavior
- No raw API calls or spreadsheets are required to use the calculator
- Every cost category is visible in cents/dollars
- A user can trace the result back to the selected profile and rule assumptions
- A user can explain why the target Amazon sell price is above the bare production subtotal
