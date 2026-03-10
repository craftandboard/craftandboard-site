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
65. Mark a channel preset as default-for-channel with auto-apply enabled and a priority
66. Refresh a listing-prep package and verify the default channel preset can be auto-applied from launch context
67. Verify the preset selection summary clearly shows whether the preset was auto-applied or chosen manually
68. Approve a package and verify the approval history card shows the latest approval state plus prior condensed events
69. Verify the manual listing worksheet card renders worksheet version, cleaned fields, prompts, and preset/approval summaries
70. Reload the package and confirm worksheet summary, preset-selection summary, and approval-history snapshots persist
71. Load the operator worksheet for an approved package
72. Verify grouped operator sections render clearly for header, pricing, specs, fulfillment, warnings, and prompts
73. Verify the operator checklist card shows required complete, required missing, and optional incomplete fields
74. Verify the current approved artifact card is obvious and shows export/worksheet version plus override involvement
75. Verify the channel handoff summary card shows preset context, channel notes, and operator prompts clearly
76. Reload the package and confirm operator worksheet, checklist, handoff summary, and current artifact summaries persist
77. Verify the operator prompt card shows critical, review, and completion prompts clearly
78. Verify the copy/export card shows grouped copy blocks for identity, specs, fulfillment, pricing, warnings, checklist, and prompts
79. Verify the plain-text worksheet block renders a stable copy-ready text view
80. Verify the structured worksheet export summary renders a stable grouped export payload
81. Verify the worksheet ergonomics summary shows copy-group count, prompt count, missing critical fields, and ready-to-use state
82. Edit a channel mapping preset to change review/completion prompts, copy-group order, or section labels
83. Refresh the listing-prep package and confirm prompt/export/ergonomics snapshots update and persist
84. Verify the quick-copy summary card shows “copy these first” fields and grouped priority copy blocks clearly
85. Verify the final-review prompt card shows critical, warning-sensitive, and completion review prompts clearly
86. Verify the artifact handoff summary card makes the current approved artifact unmistakable
87. Verify the short plain-text summary is concise enough for fast manual Amazon entry
88. Edit a channel mapping preset to change quick-copy ordering, final-review prompts, or short-summary formatting
89. Refresh the listing-prep package and confirm quick-copy, final-review, and handoff snapshots update and persist
90. Verify the final runbook card renders a clear ordered runbook for the current approved artifact
91. Verify the completion cue card clearly distinguishes ready now, ready with override, needs review, and blocked
92. Verify the internal share summary card renders a concise handoff block and short share text
93. Verify the last-change summary card shows the latest meaningful approval/preset/override context without noisy history
94. Edit a channel mapping preset to change final runbook ordering, completion-cue checks, or share-summary formatting
95. Refresh the listing-prep package and confirm runbook, completion-cue, share-summary, and last-change snapshots update and persist

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
- A user can see whether the channel preset was auto-applied from launch context or chosen manually
- A user can use the manual listing worksheet as the primary internal worksheet for first-pass Amazon entry
- A user can use the operator worksheet package as the faster, grouped artifact for daily manual listing work without losing the underlying approved package trail
- A user can see concise operator prompts that explain what to enter first, what still needs review, and what to confirm before final manual listing entry
- A user can copy grouped worksheet values without digging through raw JSON
- A user can fall back to a stable plain-text worksheet or a structured worksheet export when handing the package to another internal operator
- A user can see the most important copy targets immediately instead of scanning the whole worksheet
- A user can run a concise final-review pass before manual Amazon entry without digging through approval or warning cards
- A user can tell at a glance whether the current artifact is still the package to use right now
- A user can treat the final runbook as the current step-by-step manual listing artifact instead of stitching together multiple cards mentally
- A user can tell immediately whether they are ready to enter now, ready with override awareness, still need review, or are blocked
- A user can hand the package to another internal operator with a concise share summary instead of re-explaining the package status manually
