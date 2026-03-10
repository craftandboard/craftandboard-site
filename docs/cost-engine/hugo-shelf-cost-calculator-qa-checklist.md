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
3. Add a material rule
4. Add an edge band rule
5. Add a packaging rule
6. Add a shipping rule
7. Select the created profile
8. Enter shelf dimensions, quantity, minutes, and rule selections
9. Click `Calculate shelf cost`
10. Verify material, edge band, labor, machine, packaging, shipping, overhead, subtotal, internal price, and sell price render
11. Click `Save calculation`
12. Verify the saved calculation appears in history
13. Click a saved calculation and verify the breakdown reloads
14. Change one assumption or input and recalculate
15. Confirm the result changes and remains explainable

## Expected Pilot Behavior
- No raw API calls or spreadsheets are required to use the calculator
- Every cost category is visible in cents/dollars
- A user can trace the result back to the selected profile and rule assumptions
